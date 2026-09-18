import { act, renderHook, waitFor } from '@testing-library/react';

import useWallet from '../useWallet';
import {
  createMockProvider,
  installProvider,
  removeProvider,
  rpcError,
} from '../testUtils/mockProvider';

const ACCOUNT = '0x1111111111111111111111111111111111111111';
const OTHER_ACCOUNT = '0x2222222222222222222222222222222222222222';

afterEach(() => {
  removeProvider();
});

/** Render the hook and wait for the mount-time session restore to settle. */
async function renderSettled(options) {
  const view = renderHook(() => useWallet(options));
  await waitFor(() =>
    expect(view.result.current.status).not.toBe('connecting')
  );
  return view;
}

describe('provider detection', () => {
  test('reports unsupported when no injected provider exists', async () => {
    const { result } = await renderSettled();

    expect(result.current.status).toBe('unsupported');
    expect(result.current.address).toBeNull();
  });

  test('connect is a no-op without a provider', async () => {
    const { result } = await renderSettled();

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.status).toBe('unsupported');
  });

  // Wallet extensions can inject after the app mounts. MetaMask announces this
  // with an ethereum#initialized event; without handling it the user is stuck
  // looking at "Install MetaMask" despite having it installed.
  test('picks up a provider injected after mount', async () => {
    const { result } = await renderSettled();
    expect(result.current.status).toBe('unsupported');

    await act(async () => {
      installProvider(
        createMockProvider({ accounts: [ACCOUNT], chainId: '0x1' })
      );
      window.dispatchEvent(new Event('ethereum#initialized'));
    });

    await waitFor(() => expect(result.current.status).toBe('connected'));
    expect(result.current.address).toBe(ACCOUNT);
  });
});

describe('session restore', () => {
  test('restores an already-authorized account without prompting', async () => {
    const provider = installProvider(
      createMockProvider({ accounts: [ACCOUNT], chainId: '0x1' })
    );

    const { result } = await renderSettled();

    expect(result.current.status).toBe('connected');
    expect(result.current.address).toBe(ACCOUNT);
    expect(result.current.chainId).toBe(1);
    expect(provider.methodCalls('eth_requestAccounts')).toHaveLength(0);
  });

  test('stays disconnected when no account is authorized', async () => {
    installProvider(createMockProvider({ accounts: [] }));

    const { result } = await renderSettled();

    expect(result.current.status).toBe('disconnected');
    expect(result.current.address).toBeNull();
  });
});

describe('connect', () => {
  test('sets address and status on success', async () => {
    installProvider(
      createMockProvider({
        accounts: [],
        chainId: '0x1',
        handlers: { eth_requestAccounts: () => [ACCOUNT] },
      })
    );

    const { result } = await renderSettled();

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.status).toBe('connected');
    expect(result.current.address).toBe(ACCOUNT);
  });

  test('returns to disconnected when the user rejects the request', async () => {
    installProvider(
      createMockProvider({
        handlers: {
          eth_requestAccounts: () => {
            throw rpcError(4001, 'User rejected the request.');
          },
        },
      })
    );

    const { result } = await renderSettled();

    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.status).toBe('disconnected');
    expect(result.current.address).toBeNull();
    expect(result.current.error).toMatch(/rejected/i);
  });

  test('reports a pending request without issuing a second one', async () => {
    const provider = installProvider(
      createMockProvider({
        handlers: {
          eth_requestAccounts: () => {
            throw rpcError(-32002, 'Already processing eth_requestAccounts.');
          },
        },
      })
    );

    const { result } = await renderSettled();

    await act(async () => {
      await result.current.connect();
    });
    await act(async () => {
      await result.current.connect();
    });

    expect(result.current.status).toBe('disconnected');
    expect(result.current.error).toMatch(/pending|wallet/i);
    expect(provider.methodCalls('eth_requestAccounts')).toHaveLength(1);
  });
});

describe('wallet events', () => {
  test('disconnects when the wallet reports no accounts', async () => {
    const provider = installProvider(
      createMockProvider({ accounts: [ACCOUNT] })
    );

    const { result } = await renderSettled();
    expect(result.current.status).toBe('connected');

    act(() => {
      provider.emit('accountsChanged', []);
    });

    expect(result.current.status).toBe('disconnected');
    expect(result.current.address).toBeNull();
  });

  test('tracks the active account when it changes', async () => {
    const provider = installProvider(
      createMockProvider({ accounts: [ACCOUNT] })
    );

    const { result } = await renderSettled();

    act(() => {
      provider.emit('accountsChanged', [OTHER_ACCOUNT]);
    });

    expect(result.current.address).toBe(OTHER_ACCOUNT);
    expect(result.current.status).toBe('connected');
  });

  test('reports wrong-chain when the wallet leaves the required chain', async () => {
    const provider = installProvider(
      createMockProvider({ accounts: [ACCOUNT], chainId: '0x1' })
    );

    const { result } = await renderSettled({ chainId: 1 });
    expect(result.current.status).toBe('connected');

    act(() => {
      provider.emit('chainChanged', '0x89');
    });

    expect(result.current.status).toBe('wrong-chain');
    expect(result.current.chainId).toBe(137);
  });

  test('ignores the required chain when none is given', async () => {
    const provider = installProvider(
      createMockProvider({ accounts: [ACCOUNT], chainId: '0x1' })
    );

    const { result } = await renderSettled();

    act(() => {
      provider.emit('chainChanged', '0x89');
    });

    expect(result.current.status).toBe('connected');
  });
});

describe('switchChain', () => {
  test('adds the chain then retries when the wallet does not know it', async () => {
    let switchCalls = 0;
    const provider = installProvider(
      createMockProvider({
        accounts: [ACCOUNT],
        chainId: '0x1',
        handlers: {
          wallet_switchEthereumChain: () => {
            switchCalls += 1;
            if (switchCalls === 1) {
              throw rpcError(4902, 'Unrecognized chain ID.');
            }
            return null;
          },
        },
      })
    );

    const { result } = await renderSettled({ chainId: 137 });
    expect(result.current.status).toBe('wrong-chain');

    await act(async () => {
      await result.current.switchChain();
    });

    const order = provider.calls.map((call) => call.method);
    expect(order).toEqual(
      expect.arrayContaining([
        'wallet_switchEthereumChain',
        'wallet_addEthereumChain',
      ])
    );
    expect(order.indexOf('wallet_addEthereumChain')).toBeGreaterThan(
      order.indexOf('wallet_switchEthereumChain')
    );
    expect(switchCalls).toBe(2);
  });

  test('stays on wrong-chain when the user declines the switch', async () => {
    installProvider(
      createMockProvider({
        accounts: [ACCOUNT],
        chainId: '0x1',
        handlers: {
          wallet_switchEthereumChain: () => {
            throw rpcError(4001, 'User rejected the request.');
          },
        },
      })
    );

    const { result } = await renderSettled({ chainId: 137 });

    await act(async () => {
      await result.current.switchChain();
    });

    expect(result.current.status).toBe('wrong-chain');
    expect(result.current.error).toMatch(/rejected/i);
  });
});

describe('disconnect', () => {
  test('clears local state even when the wallet cannot revoke', async () => {
    installProvider(
      createMockProvider({
        accounts: [ACCOUNT],
        handlers: {
          wallet_revokePermissions: () => {
            throw rpcError(-32601, 'Method not supported.');
          },
        },
      })
    );

    const { result } = await renderSettled();
    expect(result.current.status).toBe('connected');

    await act(async () => {
      await result.current.disconnect();
    });

    expect(result.current.status).toBe('disconnected');
    expect(result.current.address).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe('cleanup', () => {
  test('removes both wallet listeners on unmount', async () => {
    const provider = installProvider(
      createMockProvider({ accounts: [ACCOUNT] })
    );

    const { unmount } = await renderSettled();
    expect(provider.listenerCount('accountsChanged')).toBe(1);
    expect(provider.listenerCount('chainChanged')).toBe(1);

    unmount();

    expect(provider.listenerCount('accountsChanged')).toBe(0);
    expect(provider.listenerCount('chainChanged')).toBe(0);
  });
});
