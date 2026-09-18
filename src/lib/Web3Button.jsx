import { useCallback, useEffect, useInsertionEffect, useRef, useState } from 'react';

import useWallet from './useWallet';
import { getChainName, getExplorerAddressUrl } from './chains';
import { injectStyles } from './styles';

const METAMASK_URL = 'https://metamask.io/download/';

/** `0x1234…abcd` — enough to recognise an address, short enough for a button. */
export function truncateAddress(address) {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/**
 * The clipboard API needs a secure context. Fall back to a detached textarea
 * so copy still works over plain http and in older browsers.
 */
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.appendChild(field);
  field.select();
  document.execCommand('copy');
  document.body.removeChild(field);
}

/** Renders a wallet's state. Holds no wallet state of its own. */
function WalletButton({ wallet, chainId, className = '', ...buttonProps }) {
  const { address, status, error } = wallet;

  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  // useInsertionEffect runs before layout is read, so the first paint already
  // has the styles rather than flashing unstyled.
  useInsertionEffect(injectStyles, []);

  const close = useCallback((returnFocus = false) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  // Dismiss on outside pointer or Escape. Both listeners exist only while the
  // menu is open, so a closed button costs nothing.
  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close(true);
      }
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true);
      document.removeEventListener('keydown', onKeyDown, true);
    };
  }, [open, close]);

  // Move focus into the menu so it is reachable by keyboard at all.
  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector('[role="menuitem"]')?.focus();
  }, [open]);

  const explorerUrl = getExplorerAddressUrl(wallet.chainId, address);

  const handleCopy = async () => {
    close(true);
    try {
      await copyText(address);
    } catch (copyError) {
      // Copying is a convenience; a failure here is not worth interrupting for.
    }
  };

  const handleDisconnect = async () => {
    close(true);
    await wallet.disconnect();
  };

  /** Arrow keys walk the menu; Tab closes it, matching a native menu button. */
  const onMenuKeyDown = (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();

    const items = [...menuRef.current.querySelectorAll('[role="menuitem"]')];
    const index = items.indexOf(document.activeElement);
    const next =
      event.key === 'ArrowDown'
        ? (index + 1) % items.length
        : (index - 1 + items.length) % items.length;
    items[next]?.focus();
  };

  const cls = (...parts) => [...parts, className].filter(Boolean).join(' ');

  const renderControl = () => {
    switch (status) {
      case 'unsupported':
        return (
          <a
            className={cls('w3l-btn', 'w3l-btn--outline')}
            href={METAMASK_URL}
            target="_blank"
            rel="noopener noreferrer"
            {...buttonProps}
          >
            Install MetaMask
          </a>
        );

      case 'connecting':
        return (
          <button
            type="button"
            className={cls('w3l-btn', 'w3l-btn--primary')}
            disabled
            {...buttonProps}
          >
            <span className="w3l-spinner" aria-hidden="true" />
            Connecting…
          </button>
        );

      case 'wrong-chain':
        return (
          <button
            type="button"
            className={cls('w3l-btn', 'w3l-btn--warning')}
            onClick={() => wallet.switchChain()}
            {...buttonProps}
          >
            {`Switch to ${getChainName(chainId)}`}
          </button>
        );

      case 'connected':
        return (
          <button
            type="button"
            ref={triggerRef}
            className={cls('w3l-btn', 'w3l-btn--outline')}
            onClick={() => setOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={open}
            {...buttonProps}
          >
            {truncateAddress(address)}
            <span className="w3l-caret" aria-hidden="true" />
          </button>
        );

      case 'disconnected':
      default:
        return (
          <button
            type="button"
            className={cls('w3l-btn', 'w3l-btn--primary')}
            onClick={wallet.connect}
            {...buttonProps}
          >
            Connect Wallet
          </button>
        );
    }
  };

  return (
    <div className="w3l-root" ref={rootRef}>
      {renderControl()}

      {open && (
        <ul
          className="w3l-menu"
          role="menu"
          ref={menuRef}
          onKeyDown={onMenuKeyDown}
        >
          <li>
            <button
              type="button"
              role="menuitem"
              className="w3l-menu__item"
              onClick={handleCopy}
            >
              Copy address
            </button>
          </li>
          {explorerUrl && (
            <li>
              <a
                role="menuitem"
                className="w3l-menu__item"
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => close()}
              >
                View on explorer
              </a>
            </li>
          )}
          <li>
            <button
              type="button"
              role="menuitem"
              className="w3l-menu__item"
              onClick={handleDisconnect}
            >
              Disconnect
            </button>
          </li>
        </ul>
      )}

      {error && (
        <div className="w3l-alert" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

function SelfContainedWeb3Button({
  chainId,
  onConnect,
  onDisconnect,
  onError,
  ...buttonProps
}) {
  const wallet = useWallet({ chainId, onConnect, onDisconnect, onError });
  return <WalletButton wallet={wallet} chainId={chainId} {...buttonProps} />;
}

/**
 * Drop-in wallet connect button. Appearance is driven entirely by the wallet
 * status, so the caller never has to branch on connection state.
 *
 * Styling is plain CSS with custom properties — no CSS framework and no
 * stylesheet for the consumer to import. Override `--w3l-accent`,
 * `--w3l-radius`, `--w3l-surface` and friends to restyle it, or pass
 * `className` to target it directly.
 *
 * Pass `wallet` — the result of a `useWallet()` call the caller already owns —
 * when other parts of the page read the same wallet. Each `useWallet()` call is
 * an independent state machine: wallet-originated events reach all of them, but
 * a local `connect()` or `disconnect()` only updates the instance it ran on.
 *
 * @param {object}   [props.wallet]       An existing useWallet() result to render.
 * @param {number}   [props.chainId]      Chain the app requires.
 * @param {string}   [props.className]    Added to the control element.
 * @param {Function} [props.onConnect]    Called with the address on connect.
 * @param {Function} [props.onDisconnect] Called on disconnect or wallet-side revoke.
 * @param {Function} [props.onError]      Called with the raw provider error.
 */
export default function Web3Button({ wallet, ...props }) {
  if (wallet) return <WalletButton wallet={wallet} {...props} />;
  return <SelfContainedWeb3Button {...props} />;
}
