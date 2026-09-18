import { useCallback, useEffect, useRef, useState } from 'react';

import { getChain } from './chains';

const EMPTY = { address: null, chainId: null, error: null };

/** Read the injected provider, guarding against non-browser environments. */
function getProvider() {
  if (typeof window === 'undefined') return null;
  return window.ethereum || null;
}

/** Wallets report chain ids as hex strings; the rest of the API uses numbers. */
function toChainId(value) {
  if (value == null) return null;
  const parsed =
    typeof value === 'string' ? Number.parseInt(value, 16) : Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toHexChainId(chainId) {
  return `0x${Number(chainId).toString(16)}`;
}

/**
 * Turn a provider error into something worth showing a user. The numeric codes
 * are the ones that occur in normal use, not exceptional failures.
 */
function describe(error) {
  switch (error?.code) {
    case 4001:
      return 'Request rejected in your wallet.';
    case -32002:
      return 'A wallet request is already pending. Check your wallet.';
    case 4902:
      return 'Your wallet does not recognize this network.';
    default:
      return error?.message || 'Something went wrong talking to your wallet.';
  }
}

/**
 * Wallet connection state backed by the injected EIP-1193 provider.
 *
 * @param {object}   [options]
 * @param {number}   [options.chainId]      Chain the app requires. When set, a
 *                                          connected wallet on any other chain
 *                                          reports status `wrong-chain`.
 * @param {Function} [options.onConnect]    Called with the address on connect.
 * @param {Function} [options.onDisconnect] Called on disconnect or wallet-side revoke.
 * @param {Function} [options.onError]      Called with the raw provider error.
 */
export default function useWallet(options = {}) {
  const {
    chainId: requiredChainId,
    onConnect,
    onDisconnect,
    onError,
  } = options;

  const [provider, setProvider] = useState(() => getProvider());
  const [restoring, setRestoring] = useState(() => getProvider() != null);
  const hasProvider = provider != null;
  const [connecting, setConnecting] = useState(false);
  const [state, setState] = useState(EMPTY);

  const providerRef = useRef(null);
  const connectingRef = useRef(false);
  // Set when the wallet reports -32002. A second request while one is already
  // queued does nothing but stack up prompts, so we refuse to send it.
  const walletBusyRef = useRef(false);

  const callbacksRef = useRef({});
  callbacksRef.current = { onConnect, onDisconnect, onError };

  // Extensions do not always inject before the app mounts. MetaMask announces
  // a late injection with this event; without adopting it the hook would report
  // `unsupported` for the rest of the session to someone who has a wallet.
  useEffect(() => {
    if (provider) return undefined;

    const adopt = () => {
      const injected = getProvider();
      if (!injected) return;
      setProvider(injected);
      setRestoring(true);
    };

    window.addEventListener('ethereum#initialized', adopt);
    return () => window.removeEventListener('ethereum#initialized', adopt);
  }, [provider]);

  useEffect(() => {
    providerRef.current = provider;
    if (!provider) return undefined;

    let cancelled = false;

    const restore = async () => {
      try {
        // eth_accounts returns already-authorized accounts without prompting,
        // so a returning user reconnects with no wallet popup.
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (cancelled) return;

        if (accounts && accounts.length > 0) {
          const chainHex = await provider.request({ method: 'eth_chainId' });
          if (cancelled) return;
          setState({
            address: accounts[0],
            chainId: toChainId(chainHex),
            error: null,
          });
        }
      } catch (error) {
        if (!cancelled) {
          setState((prev) => ({ ...prev, error: describe(error) }));
        }
      } finally {
        if (!cancelled) setRestoring(false);
      }
    };

    restore();

    const handleAccountsChanged = (accounts) => {
      walletBusyRef.current = false;

      if (!accounts || accounts.length === 0) {
        setState(EMPTY);
        callbacksRef.current.onDisconnect?.();
        return;
      }

      setState((prev) => ({ ...prev, address: accounts[0], error: null }));
      callbacksRef.current.onConnect?.(accounts[0]);
    };

    const handleChainChanged = (chainHex) => {
      setState((prev) => ({ ...prev, chainId: toChainId(chainHex) }));
    };

    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    return () => {
      cancelled = true;
      provider.removeListener('accountsChanged', handleAccountsChanged);
      provider.removeListener('chainChanged', handleChainChanged);
    };
  }, [provider]);

  const connect = useCallback(async () => {
    const provider = providerRef.current;
    if (!provider) return;
    if (connectingRef.current || walletBusyRef.current) return;

    connectingRef.current = true;
    setConnecting(true);

    try {
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });
      const chainHex = await provider.request({ method: 'eth_chainId' });
      const address = accounts?.[0] ?? null;

      setState({ address, chainId: toChainId(chainHex), error: null });
      if (address) callbacksRef.current.onConnect?.(address);
    } catch (error) {
      if (error?.code === -32002) walletBusyRef.current = true;
      setState((prev) => ({ ...prev, address: null, error: describe(error) }));
      callbacksRef.current.onError?.(error);
    } finally {
      connectingRef.current = false;
      setConnecting(false);
    }
  }, []);

  const switchChain = useCallback(
    async (target = requiredChainId) => {
      const provider = providerRef.current;
      if (!provider || target == null) return;

      const request = () =>
        provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: toHexChainId(target) }],
        });

      const succeed = () =>
        setState((prev) => ({ ...prev, chainId: Number(target), error: null }));

      const fail = (error) => {
        setState((prev) => ({ ...prev, error: describe(error) }));
        callbacksRef.current.onError?.(error);
      };

      try {
        await request();
        succeed();
      } catch (error) {
        // 4902 means the wallet has never heard of this chain. Add it, then
        // ask again; any other code is a real failure.
        if (error?.code !== 4902) {
          fail(error);
          return;
        }

        const chain = getChain(target);
        if (!chain) {
          fail(error);
          return;
        }

        try {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [chain],
          });
          await request();
          succeed();
        } catch (addError) {
          fail(addError);
        }
      }
    },
    [requiredChainId]
  );

  const disconnect = useCallback(async () => {
    const provider = providerRef.current;

    if (provider) {
      try {
        // Not part of EIP-1193. Wallets that implement it genuinely revoke the
        // grant; the rest throw, and the local reset below is all we get.
        await provider.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }],
        });
      } catch (revokeError) {
        // Expected on wallets without permission revocation. Not an error the
        // user can act on, so it is deliberately not surfaced.
      }
    }

    walletBusyRef.current = false;
    setState(EMPTY);
    callbacksRef.current.onDisconnect?.();
  }, []);

  let status;
  if (!hasProvider) {
    status = 'unsupported';
  } else if (restoring || connecting) {
    status = 'connecting';
  } else if (!state.address) {
    status = 'disconnected';
  } else if (requiredChainId != null && state.chainId !== requiredChainId) {
    status = 'wrong-chain';
  } else {
    status = 'connected';
  }

  return {
    address: state.address,
    chainId: state.chainId,
    error: state.error,
    status,
    connect,
    disconnect,
    switchChain,
  };
}
