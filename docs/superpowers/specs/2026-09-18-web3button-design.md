# Web3Button Design

Date: 2026-09-18
Status: Approved

## Problem

`web3-login` is packaged and described as a "MUI React component for web3 wallet
connection", but `src/lib/Web3Button.js` returns `<p>Hello</p>`. Nothing in the
repository connects a wallet or uses MUI. This spec covers implementing the
component, a landing page that demonstrates it, and CI/CD that builds, tests and
deploys that page to GitHub Pages.

## Constraints

- No new runtime dependencies. Wallet access goes through the injected
  EIP-1193 provider at `window.ethereum`.
- React 18 and MUI 5, both already in `dependencies`.
- Test libraries are the only permitted new devDependencies.
- Out of scope: upgrading React/MUI/react-scripts, resolving the existing
  `npm audit` findings, and fixing the `dist/` entry-point mismatch in
  `package.json`. These are known and deliberately deferred.

## Architecture

Logic is separated from presentation so the wallet state machine can be tested
without rendering MUI.

```
src/lib/useWallet.js    EIP-1193 state machine. No UI imports.
src/lib/chains.js       Chain metadata keyed by chain id.
src/lib/Web3Button.js   MUI component. Consumes useWallet, renders states.
src/lib/index.js        Public exports: Web3Button, useWallet.
src/demo/App.js         Landing page.
src/index.js            Mounts the demo with createRoot.
```

Consumers choose their level: `useWallet()` for custom UI, `<Web3Button />` for
a drop-in.

## useWallet

### Signature

```js
const { address, chainId, status, error, connect, disconnect, switchChain } =
  useWallet({ chainId: 1 })
```

`options.chainId` is optional. When omitted the hook never reports `wrong-chain`
and `switchChain` is a no-op.

### Status values

| status | Meaning |
|---|---|
| `unsupported` | No injected provider found |
| `disconnected` | Provider present, no authorized account |
| `connecting` | `eth_requestAccounts` in flight |
| `connected` | Account authorized, on the required chain (or none required) |
| `wrong-chain` | Account authorized, `chainId` differs from the required one |

`status` is the single source of truth for what the UI renders. `address` is
`null` unless status is `connected` or `wrong-chain`.

### Provider detection

Read `window.ethereum` behind a `typeof window !== 'undefined'` guard so the
module does not throw if imported in a non-browser environment. Absent provider
means `status: 'unsupported'` and every action becomes a no-op.

### Session restore

On mount, call `eth_accounts`. This returns already-authorized accounts without
prompting, so a returning user appears connected without a wallet popup. A
non-empty result also triggers an `eth_chainId` read to populate `chainId`.

### connect()

Calls `eth_requestAccounts`. Errors that must be handled by code, not surfaced
raw:

- `4001` — user rejected. Return to `disconnected` with a plain-language error.
  This is a normal outcome, not a failure.
- `-32002` — a request is already pending in the wallet. Do not issue a second
  request; tell the user to check their wallet.

On success, set `address`, read `eth_chainId`, evaluate the required chain, and
fire `onConnect`.

### Events

Subscribe on mount, unsubscribe in the effect's cleanup:

- `accountsChanged` — empty array means the user revoked access in the wallet;
  transition to `disconnected` and fire `onDisconnect`. A non-empty array
  means the active account changed; update `address`.
- `chainChanged` — update `chainId` and re-evaluate the required chain.

Removing listeners on unmount is required; without it a remounting consumer
leaks handlers and updates unmounted state.

### switchChain()

Calls `wallet_switchEthereumChain` with the required chain. Error `4902` means
the wallet does not know the chain: call `wallet_addEthereumChain` with metadata
from `chains.js`, then retry the switch. `4001` on either call means the user
declined; stay in `wrong-chain`.

If a required `chainId` has no entry in `chains.js`, `switchChain` still
attempts `wallet_switchEthereumChain` and reports the `4902` as an error rather
than failing silently.

### disconnect()

EIP-1193 has no portable disconnect. The implementation is best-effort:

1. Attempt `wallet_revokePermissions` with `[{ eth_accounts: {} }]`. Wallets
   that do not implement it throw; that error is swallowed deliberately.
2. Reset local state to `disconnected` and fire `onDisconnect`.

Documented in the README as a local reset that revokes only where the wallet
supports it.

## chains.js

A map of chain id to the fields `wallet_addEthereumChain` requires, plus a
display name and block explorer used by the UI:

```js
{ 1: { chainId: '0x1', chainName: 'Ethereum', nativeCurrency: {...},
       rpcUrls: [...], blockExplorerUrls: [...] }, ... }
```

Covers Ethereum, Sepolia, Polygon, Arbitrum One, Optimism and Base. Only public
RPC endpoints, no API keys.

## Web3Button

A single MUI `Button` whose appearance is driven entirely by `status`:

| status | Render |
|---|---|
| `unsupported` | "Install MetaMask", links to metamask.io in a new tab with `rel="noopener noreferrer"` |
| `disconnected` | "Connect Wallet" |
| `connecting` | Disabled, `CircularProgress` start icon |
| `wrong-chain` | `color="warning"`, "Switch to {chainName}", calls `switchChain` |
| `connected` | Truncated address `0x1234…abcd`, opens a Menu |

The connected Menu offers: copy address (via `navigator.clipboard`, with a
fallback when unavailable), view on explorer (omitted when the chain is unknown),
and disconnect.

Errors render in a dismissible MUI `Snackbar` with an `Alert`. Address
truncation is first 6 and last 4 characters.

### Props

| Prop | Type | Purpose |
|---|---|---|
| `chainId` | number | Required chain; enables `wrong-chain` and switching |
| `onConnect` | (address) => void | Fired on successful connect |
| `onDisconnect` | () => void | Fired on disconnect or wallet-side revoke |
| `onError` | (error) => void | Fired for every surfaced error |
| ...rest | | Spread onto the MUI Button |

## Landing page

Served at `https://clement880101.github.io/web3-login`. Sections: hero with the
package name and one-line description, a live `Web3Button`, a readout of
`address` / `chainId` / `status` proving the hook is live, and an install plus
usage snippet. MUI theme, responsive down to phone width.

`src/index.js` migrates from `ReactDOM.render` to `createRoot`. React 18
prints a console error for the former and silently runs in React 17 compat mode,
which would be visible on the deployed page.

`package.json` gains `"homepage": "https://clement880101.github.io/web3-login"`
so the CRA build emits asset paths under `/web3-login/` rather than `/`.

## Testing

devDependencies: `@testing-library/react`, `@testing-library/jest-dom`.

`useWallet` is tested against a mock EIP-1193 provider — an object with
`request`, `on` and `removeListener` — installed on `window.ethereum` per test.
Cases:

1. No provider yields `unsupported`.
2. `eth_accounts` returning an account restores the session with no prompt.
3. `connect()` success sets address and status.
4. `connect()` rejected with `4001` returns to `disconnected` with an error.
5. `connect()` rejected with `-32002` reports the pending-request message and
   does not re-request.
6. `accountsChanged` with `[]` transitions to `disconnected`.
7. `accountsChanged` with a new account updates `address`.
8. `chainChanged` to a non-required chain yields `wrong-chain`.
9. `switchChain()` on `4902` calls `wallet_addEthereumChain` then retries.
10. Unmount calls `removeListener` for both events.

Web3Button rendering is not tested; its output is a direct function of `status`.

## CI/CD

`.github/workflows/ci.yml` — on pull request and push to `main`: checkout,
setup-node 20 with npm cache, `npm ci`, `npm test` (with `CI=true`),
`npm run build`.

`.github/workflows/deploy.yml` — on push to `main`: build, then
`actions/upload-pages-artifact` on `build/` and `actions/deploy-pages`.
Permissions `contents: read`, `pages: write`, `id-token: write`, with a
`concurrency` group so overlapping deploys do not race.

Pages source must be set to "GitHub Actions" on the repository.

### Known blocker

The active `gh` token carries scopes `gist, read:org, repo` and lacks
`workflow`. Pushing files under `.github/workflows/` will be refused. Before the
push, the repository owner must run:

```
gh auth refresh -h github.com -s workflow
```

This is interactive and cannot be performed on their behalf.

## Success criteria

- `npm test` and `npm run build` both pass locally.
- The ten `useWallet` cases pass.
- The deployed page loads with correct asset paths and a clean console.
- CI runs green on the pull request.

---

## Addendum — dependency upgrade and packaging

Added after the original design, at the user's request, superseding the "out of
scope" list above.

All 73 `npm audit` findings traced to a single direct dependency,
`react-scripts`, which has no fixed release. Clearing them therefore required
replacing the build tooling rather than bumping a version:

- React 18.2 → 19.3, MUI 5.10 → 9.4, Testing Library 14 → 16.
- `react-scripts` → Vite 8; Jest → Vitest 5. `npm audit` now reports 0
  vulnerabilities and `node_modules` fell from 1434 packages to 179.
- JSX-bearing modules renamed to `.jsx`, `index.html` moved to the project root,
  and the CRA `homepage` field replaced by Vite's `base` for the Pages path.

Packaging, so the library is installable:

- `private: true` removed — it would have blocked `npm publish` outright.
- A library build (`vite.lib.config.js`) emits `dist/index.js` (ESM) and
  `dist/index.cjs`, resolving the entry points `package.json` had always
  advertised but never produced.
- React, MUI and Emotion moved from `dependencies` to `peerDependencies`;
  bundling them would hand a consumer a second React (breaking hooks) and a
  second Emotion cache (breaking theming).
- Verified by packing the tarball and installing it into a clean app: both entry
  points resolve, all seven exports are present, and only one copy of React is
  installed.

Still outstanding: the project has no linter. CRA provided one via
`eslint-config-react-app`, which left with `react-scripts`.
