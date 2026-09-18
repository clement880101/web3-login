# Contributing

Thanks for taking the time. Bug reports, small fixes and documentation
corrections are all welcome.

## Before you start

For anything beyond a bug fix or a typo, open an issue first. This package
deliberately has no runtime dependencies and a small API surface, so a feature
that fits your app may still not belong here — it is worth agreeing on the
shape before you write it.

## Setup

```bash
npm install
npm run dev        # demo at http://localhost:3000
```

Node 22.12 or newer is required. `.nvmrc` pins the version CI uses.

## Layout

| Path        | What it is                                                  |
| ----------- | ----------------------------------------------------------- |
| `src/lib`   | The published package. Everything here ships to npm.         |
| `src/demo`  | The landing page deployed to GitHub Pages. Not published.    |
| `docs`      | Design notes and specs.                                      |

`src/lib/useWallet.js` holds all the wallet logic and imports nothing from the
UI layer; `src/lib/Web3Button.jsx` renders it. Keep that split — people use the
hook on its own.

## Checks

Run this before opening a pull request. CI runs the same thing.

```bash
npm run verify
```

That is `npm run lint`, `npm run format:check` and `npm test`. Formatting is
Prettier's job, not yours — `npm run format` fixes it.

New behaviour needs a test. Tests use Vitest with Testing Library and a fake
EIP-1193 provider (`src/lib/testUtils/mockProvider.js`); there is no real
wallet in the test environment. `npm run test:coverage` enforces a floor on
`src/lib`.

## Pull requests

- One topic per pull request.
- Write the commit subject in the imperative mood, as a sentence that completes
  "this commit will…". Match the existing log.
- Say what you changed and why. If the behaviour is visible, show it.
- CI must be green. Review is requested from the repository owner
  automatically.

## Public API changes

`src/lib/index.js` is the package's entry point, and anything it exports is
public. Adding an export is a minor release; changing or removing one is a
major release and needs a note in `CHANGELOG.md` and an upgrade section in the
README.

## Reporting bugs

Include the wallet and browser, the chain, what you expected, and what
happened. A minimal reproduction saves a round trip. Security issues go to
[SECURITY.md](SECURITY.md) instead — not to the issue tracker.
