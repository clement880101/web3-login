# web3-login

[![CI](https://github.com/clement880101/web3-login/actions/workflows/ci.yml/badge.svg)](https://github.com/clement880101/web3-login/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@clement.chang.dev/web3-login?logo=npm)](https://www.npmjs.com/package/@clement.chang.dev/web3-login)
[![Bundle size](https://img.shields.io/bundlephobia/minzip/@clement.chang.dev/web3-login)](https://bundlephobia.com/package/@clement.chang.dev/web3-login)
[![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)](https://www.npmjs.com/package/@clement.chang.dev/web3-login?activeTab=dependencies)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

A React button for connecting an EIP-1193 browser wallet.

No web3 library, no UI framework, no stylesheet to import. React is the only
peer dependency; everything else is plain HTML, CSS and JavaScript.

**[Live demo →](https://clement880101.github.io/web3-login)** ·
**[npm →](https://www.npmjs.com/package/@clement.chang.dev/web3-login)**

## Install

```bash
npm install @clement.chang.dev/web3-login
```

```bash
npm install react react-dom
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
Errors appear beneath the button in an alert.

### Props

| Prop | Type | Description |
| --- | --- | --- |
| `wallet` | `object` | An existing `useWallet()` result to render. See below. |
| `chainId` | `number` | Chain the app requires. Enables the switch-network state. |
| `className` | `string` | Added to the control element. |
| `onConnect` | `(address) => void` | Fired on connect. |
| `onDisconnect` | `() => void` | Fired on disconnect or wallet-side revoke. |
| `onError` | `(error) => void` | Fired with the raw provider error. |

Any other prop is forwarded to the underlying `<button>` or `<a>`.

## Theming

Styles are plain CSS, injected once as a single `<style>` element the first
time a button mounts. There is no stylesheet for you to import and nothing to
configure. Restyle it by overriding custom properties anywhere in your app:

```css
:root {
  --w3l-accent: #e11d48;
  --w3l-accent-fg: #ffffff;
  --w3l-fg: #f4f4f5;
  --w3l-muted: #a1a1aa;
  --w3l-surface: #18181b;
  --w3l-border: #3f3f46;
  --w3l-warning: #f59e0b;
  --w3l-danger: #ef4444;
  --w3l-radius: 2px;
  --w3l-font-family: "Inter", sans-serif;
}
```

Light and dark are handled by `prefers-color-scheme`; setting a property
yourself wins over both. For finer control, pass `className` and target the
element directly — the internals use `w3l-`-prefixed class names.

## Bring your own UI

`useWallet` holds all the logic and imports nothing from the UI layer.

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

## Upgrading from 1.x

1.x was built on MUI. 2.0 drops it for plain CSS.

- Remove `@mui/material`, `@emotion/react` and `@emotion/styled` if nothing
  else in your app uses them.
- MUI `Button` props no longer apply: `variant`, `color`, `size` and `sx` are
  gone. Use `className` or the custom properties above.
- Everything else — `useWallet`, the props, the status values, the behaviour —
  is unchanged.

## Development

```bash
npm install
npm run dev        # demo at http://localhost:3000
npm test           # vitest
npm run build      # demo site -> build/
npm run build:lib  # library -> dist/
```

```bash
npm run lint       # eslint
npm run format     # prettier --write
npm run verify     # lint + format check + tests, the same as CI
```

`src/lib` is the published package; `src/demo` is the landing page deployed to
GitHub Pages on every push to `main`. Built with Vite and Vitest.

[CONTRIBUTING.md](CONTRIBUTING.md) has the rest: layout, checks, and what
counts as a public API change. Contributors are expected to follow the
[code of conduct](CODE_OF_CONDUCT.md).

### Releasing

Releases publish from CI via npm trusted publishing (OIDC) — no npm token is
stored in this repository, and `--provenance` attaches a signed link from the
published package back to the commit it was built from.

```bash
# 1. Move the Unreleased section of CHANGELOG.md under the new version.
npm version patch          # or minor / major — commits and tags
git push --follow-tags
gh release create v2.0.1 --generate-notes
```

Publishing the release runs [`.github/workflows/publish.yml`](.github/workflows/publish.yml),
which verifies, builds, checks the tag matches `package.json`, and publishes.
Released versions carry provenance — `npm audit signatures` verifies it.

## Security

Report vulnerabilities privately. See [SECURITY.md](SECURITY.md); please do not
open a public issue.

## Changelog

[CHANGELOG.md](CHANGELOG.md).

## Licence

MIT
