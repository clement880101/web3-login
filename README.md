# web3-login

A MUI React button for connecting an EIP-1193 browser wallet.

No web3 library, no provider to configure, no runtime dependencies beyond React
and MUI — it talks to `window.ethereum` directly.

**[Live demo →](https://clement880101.github.io/web3-login)** ·
**[npm →](https://www.npmjs.com/package/@clement.chang.dev/web3-login)**

## Install

```bash
npm install @clement.chang.dev/web3-login
```

React, MUI and Emotion are peer dependencies — the package uses whichever copy
your app already has, rather than bundling its own:

```bash
npm install react react-dom @mui/material @emotion/react @emotion/styled
```

## Usage

```jsx
import { Web3Button } from '@clement.chang.dev/web3-login';

<Web3Button chainId={1} onConnect={(address) => console.log(address)} />;
```

The button renders itself from the wallet's state, so there is nothing to
branch on:

| Wallet state | Button |
| --- | --- |
| No wallet installed | **Install MetaMask** (links out) |
| Not connected | **Connect Wallet** |
| Request in flight | Disabled, with a spinner |
| Connected, wrong chain | **Switch to _network_** |
| Connected | `0x1234…abcd`, opening a menu |

The connected menu offers copy address, view on explorer, and disconnect.
Errors appear in a snackbar.

### Props

| Prop | Type | Description |
| --- | --- | --- |
| `wallet` | `object` | An existing `useWallet()` result to render. See below. |
| `chainId` | `number` | Chain the app requires. Enables the switch-network state. |
| `onConnect` | `(address) => void` | Fired on connect. |
| `onDisconnect` | `() => void` | Fired on disconnect or wallet-side revoke. |
| `onError` | `(error) => void` | Fired with the raw provider error. |

Any other prop is forwarded to the underlying MUI `Button`.

## Bring your own UI

`useWallet` holds all the logic; the button is a thin consumer of it.

```jsx
import { useWallet } from '@clement.chang.dev/web3-login';

function Account() {
  const { address, chainId, status, error, connect, disconnect, switchChain } =
    useWallet({ chainId: 1 });

  if (status === 'unsupported') return <p>No wallet found.</p>;
  if (status === 'wrong-chain') {
    return <button onClick={switchChain}>Switch network</button>;
  }
  if (status !== 'connected') {
    return <button onClick={connect}>Connect</button>;
  }

  return <button onClick={disconnect}>{address}</button>;
}
```

`status` is one of `unsupported`, `disconnected`, `connecting`, `connected`, or
`wrong-chain`.

### Sharing one instance

Every `useWallet()` call is an independent state machine. Wallet-originated
events reach all of them, but a local `connect()` or `disconnect()` only updates
the instance it ran on — so a page with its own hook *and* a self-contained
`Web3Button` can disagree after a disconnect. Pass the hook result in to keep
them in step:

```jsx
const wallet = useWallet({ chainId: 1 });

<Web3Button wallet={wallet} chainId={1} />
<p>{wallet.address}</p>
```

## Behaviour worth knowing

**Sessions resume silently.** On mount the hook calls `eth_accounts`, which
returns already-authorized accounts without prompting. A returning user is
connected with no wallet popup.

**Late injection is handled.** Wallet extensions do not always inject
`window.ethereum` before the app mounts, so the hook also listens for
`ethereum#initialized` rather than deciding once that no wallet exists.

**The wallet is the source of truth.** `accountsChanged` and `chainChanged` are
subscribed for the lifetime of the component, so switching account or network
inside the wallet updates the UI without a reload.

**Unknown networks are added, not just requested.** `switchChain` calls
`wallet_switchEthereumChain`, and on error `4902` adds the chain with
`wallet_addEthereumChain` before retrying. Ethereum, Sepolia, Polygon, Arbitrum
One, OP Mainnet and Base ship with metadata.

**Disconnect is best-effort.** EIP-1193 has no portable disconnect — a site
cannot force a wallet to forget it. `disconnect()` clears local state and calls
`wallet_revokePermissions` where the wallet supports it (MetaMask does); other
wallets keep the site authorized, and a later `connect()` will not re-prompt.

## Development

```bash
npm install
npm run dev        # demo at http://localhost:3000
npm test           # vitest
npm run build      # demo site -> build/
npm run build:lib  # library -> dist/
```

`src/lib` is the published package; `src/demo` is the landing page deployed to
GitHub Pages on every push to `main`. Built with Vite and Vitest, on React 19
and MUI 9.

### Releasing

Releases publish from CI via npm trusted publishing (OIDC) — no npm token is
stored in this repository, and `--provenance` attaches a signed link from the
published package back to the commit it was built from.

```bash
npm version patch          # or minor / major — commits and tags
git push --follow-tags
gh release create v1.0.1 --generate-notes
```

Publishing the release runs `.github/workflows/publish.yml`, which tests,
builds, checks the tag matches `package.json`, and publishes.

One-time setup on npmjs.com, under the package's *Settings → Trusted Publisher*:
point it at this repository with workflow `publish.yml`. npm only allows this on
a package that already exists, so the very first version has to be published by
hand with `npm publish --otp=<code>`.

## Licence

MIT
