import { useState } from 'react';

import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';

import useWallet from './useWallet';
import { getChainName, getExplorerAddressUrl } from './chains';

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
function WalletButton({ wallet, chainId, ...buttonProps }) {
  const { address, status, error } = wallet;

  const [anchorEl, setAnchorEl] = useState(null);
  const [dismissedError, setDismissedError] = useState(null);

  const closeMenu = () => setAnchorEl(null);
  const explorerUrl = getExplorerAddressUrl(wallet.chainId, address);

  const handleCopy = async () => {
    closeMenu();
    try {
      await copyText(address);
    } catch (copyError) {
      // Copying is a convenience; a failure here is not worth interrupting for.
    }
  };

  const handleDisconnect = async () => {
    closeMenu();
    await wallet.disconnect();
  };

  const renderButton = () => {
    switch (status) {
      case 'unsupported':
        return (
          <Button
            variant="outlined"
            href={METAMASK_URL}
            target="_blank"
            rel="noopener noreferrer"
            {...buttonProps}
          >
            Install MetaMask
          </Button>
        );

      case 'connecting':
        return (
          <Button
            variant="contained"
            disabled
            startIcon={<CircularProgress size={16} color="inherit" />}
            {...buttonProps}
          >
            Connecting…
          </Button>
        );

      case 'wrong-chain':
        return (
          <Button
            variant="contained"
            color="warning"
            onClick={() => wallet.switchChain()}
            {...buttonProps}
          >
            {`Switch to ${getChainName(chainId)}`}
          </Button>
        );

      case 'connected':
        return (
          <Button
            variant="outlined"
            onClick={(event) => setAnchorEl(event.currentTarget)}
            aria-haspopup="true"
            aria-expanded={anchorEl ? 'true' : undefined}
            // MUI uppercases button labels by default, which would corrupt the
            // EIP-55 checksum casing that makes an address readable.
            sx={{
              textTransform: 'none',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
            {...buttonProps}
          >
            {truncateAddress(address)}
          </Button>
        );

      case 'disconnected':
      default:
        return (
          <Button variant="contained" onClick={wallet.connect} {...buttonProps}>
            Connect Wallet
          </Button>
        );
    }
  };

  return (
    <>
      {renderButton()}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={closeMenu}>
        <MenuItem onClick={handleCopy}>Copy address</MenuItem>
        {explorerUrl && (
          <MenuItem
            component="a"
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={closeMenu}
          >
            View on explorer
          </MenuItem>
        )}
        <MenuItem onClick={handleDisconnect}>Disconnect</MenuItem>
      </Menu>

      <Snackbar
        open={Boolean(error) && error !== dismissedError}
        autoHideDuration={6000}
        onClose={() => setDismissedError(error)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setDismissedError(error)}
        >
          {error}
        </Alert>
      </Snackbar>
    </>
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
 * Pass `wallet` — the result of a `useWallet()` call the caller already owns —
 * when other parts of the page read the same wallet. Each `useWallet()` call is
 * an independent state machine: wallet-originated events reach all of them, but
 * a local `connect()` or `disconnect()` only updates the instance it ran on. One
 * shared instance keeps the whole page consistent.
 *
 * @param {object}   [props.wallet]       An existing useWallet() result to render.
 * @param {number}   [props.chainId]      Chain the app requires.
 * @param {Function} [props.onConnect]    Called with the address on connect.
 * @param {Function} [props.onDisconnect] Called on disconnect or wallet-side revoke.
 * @param {Function} [props.onError]      Called with the raw provider error.
 * Remaining props are forwarded to the underlying MUI Button.
 */
export default function Web3Button({ wallet, ...props }) {
  if (wallet) return <WalletButton wallet={wallet} {...props} />;
  return <SelfContainedWeb3Button {...props} />;
}
