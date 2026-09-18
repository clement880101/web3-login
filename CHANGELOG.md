# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2026-09-18

The dependency-free rewrite. The API is unchanged; only the styling layer is
different. See [Upgrading from 1.x](README.md#upgrading-from-1x).

### Changed

- **Breaking.** Dropped MUI. The button is plain HTML, CSS and JavaScript, and
  the styles are injected once as a single `<style>` element — there is no
  stylesheet to import. `@mui/material`, `@emotion/react` and
  `@emotion/styled` are no longer dependencies of any kind.
- **Breaking.** MUI `Button` props no longer apply. `variant`, `color`, `size`
  and `sx` are gone; theme with the `--w3l-*` custom properties or pass
  `className`.
- React and React DOM are the only peer dependencies, at `>=18`.
- The address button keeps a monospace face; the rest of the UI does not.

### Added

- Theming through `--w3l-*` custom properties, honouring
  `prefers-color-scheme` for light and dark.

### Unchanged

- `useWallet`, the `Web3Button` props, the status values and every documented
  behaviour.

## [1.0.1] - 2026-09-18

### Added

- Install instructions and footer links on the landing page.
- `CODEOWNERS`, so pull requests request review from the repository owner.

### Changed

- Published under the `@clement.chang.dev` scope.
- Normalized `repository.url` in `package.json`.

## [1.0.0] - 2026-09-18

### Added

- `Web3Button`, a React button that renders itself from the wallet's state:
  install, connect, connecting, wrong chain, and connected with a menu for
  copy address, view on explorer, and disconnect.
- `useWallet`, the hook holding all the logic, usable without the button.
- Silent session resume via `eth_accounts`, late `window.ethereum` injection
  handling, and live `accountsChanged` / `chainChanged` subscriptions.
- `switchChain`, which adds an unknown network with `wallet_addEthereumChain`
  on error `4902` and retries. Ethereum, Sepolia, Polygon, Arbitrum One,
  OP Mainnet and Base ship with metadata.
- Best-effort `disconnect`, calling `wallet_revokePermissions` where supported.
- CI, GitHub Pages deployment, and npm publishing from CI with trusted
  publishing (OIDC) and `--provenance`.

[unreleased]: https://github.com/clement880101/web3-login/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/clement880101/web3-login/compare/v1.0.1...v2.0.0
[1.0.1]: https://github.com/clement880101/web3-login/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/clement880101/web3-login/releases/tag/v1.0.0
