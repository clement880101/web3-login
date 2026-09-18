# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 2.x     | Yes       |
| 1.x     | No        |

Fixes land on the latest minor release. 1.x depended on MUI and is no longer
maintained; see the upgrade notes in the README.

## Reporting a vulnerability

Report privately, not in a public issue.

Use GitHub's [private vulnerability
reporting](https://github.com/clement880101/web3-login/security/advisories/new)
on this repository. If that is unavailable to you, email
clement880101@gmail.com with `web3-login` in the subject.

Please include:

- the version affected,
- what an attacker can do with it,
- a reproduction or proof of concept,
- the wallet and browser, if relevant.

You will get an acknowledgement within 7 days and an assessment within 14. If
the report is valid, a fix and an advisory follow; you will be credited unless
you would rather not be. Please give a fix a reasonable window before
disclosing publicly.

## Scope

This package asks a browser wallet for an address and renders a button. It
holds no keys, signs nothing, and makes no network requests of its own.

In scope: anything in `src/lib` — the EIP-1193 request handling, chain
switching, the injected styles, and the supply chain of the published package
(the release workflow, its provenance).

Out of scope: vulnerabilities in the user's wallet extension or in a
downstream app, phishing that merely uses this button, and the demo page's
content. A wallet that ignores `wallet_revokePermissions` is documented
behaviour, not a vulnerability.

## Verifying a release

Published versions carry npm provenance, built by
[`.github/workflows/publish.yml`](.github/workflows/publish.yml) with no npm
token in this repository.

```bash
npm audit signatures
```
