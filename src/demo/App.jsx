import { Web3Button, useWallet, getChainName } from '../lib';
import './demo.css';

/** The chain this demo asks for, shared so button and readout agree. */
const REQUIRED_CHAIN_ID = 1;

const INSTALL = 'npm install @clement.chang.dev/web3-login';

const PEERS = 'npm install react react-dom';

const USAGE = `import { Web3Button, useWallet } from '@clement.chang.dev/web3-login'

// Drop-in button
<Web3Button chainId={1} onConnect={(address) => console.log(address)} />

// Or bring your own UI
const { address, chainId, status, connect, disconnect } = useWallet({
  chainId: 1,
})`;

const THEMING = `:root {
  --w3l-accent: #e11d48;
  --w3l-radius: 2px;
  --w3l-surface: #18181b;
}`;

export default function App() {
  const wallet = useWallet({ chainId: REQUIRED_CHAIN_ID });

  return (
    <div className="wrap">
      <header>
        <h1>web3-login</h1>
        <p className="lede">
          A React button for connecting an EIP-1193 wallet. No web3 library, no
          UI framework, no provider to configure — it talks to{' '}
          <code>window.ethereum</code> directly.
        </p>
        <ul className="tags">
          <li className="tag">React 19</li>
          <li className="tag">Plain CSS</li>
          <li className="tag">No dependencies</li>
          <li className="tag">4.8 kB gzipped</li>
        </ul>
      </header>

      <section>
        <div className="panel">
          <h2>Try it</h2>
          <p className="hint">
            Requires a browser wallet such as MetaMask. Switching account or
            network in the wallet updates the readout without a reload.
          </p>

          <div className="demo">
            <div>
              <Web3Button wallet={wallet} chainId={REQUIRED_CHAIN_ID} />
            </div>

            <dl className="readout">
              <div>
                <dt>Status</dt>
                <dd>
                  <span className="pill" data-status={wallet.status}>
                    {wallet.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{wallet.address ?? '—'}</dd>
              </div>
              <div>
                <dt>Chain</dt>
                <dd>
                  {wallet.chainId == null
                    ? '—'
                    : `${getChainName(wallet.chainId)} (${wallet.chainId})`}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section>
        <h2>Install</h2>
        <pre>
          <code>{INSTALL}</code>
        </pre>
        <p className="note">
          React is the only peer dependency. If you are starting fresh:
        </p>
        <pre>
          <code>{PEERS}</code>
        </pre>
      </section>

      <section>
        <h2>Usage</h2>
        <pre>
          <code>{USAGE}</code>
        </pre>
      </section>

      <section>
        <h2>Theming</h2>
        <p className="note">
          Styles are plain CSS with custom properties, injected once on mount —
          there is no stylesheet to import. Override the properties anywhere in
          your app, or pass <code>className</code> to target the control
          directly. This page sets them to stay dark regardless of your system
          setting.
        </p>
        <pre>
          <code>{THEMING}</code>
        </pre>
      </section>

      <section>
        <h2>Notes</h2>
        <p className="note">
          Passing <code>chainId</code> puts the button into a “Switch network”
          state whenever the wallet is on a different chain, adding the network
          first if the wallet does not know it. Disconnect clears local state
          and revokes the grant where the wallet supports it — EIP-1193 has no
          portable way to force a wallet to forget a site.
        </p>
      </section>

      <footer>
        MIT licensed ·{' '}
        <a
          href="https://github.com/clement880101/web3-login"
          target="_blank"
          rel="noopener noreferrer"
        >
          Source on GitHub
        </a>{' '}
        ·{' '}
        <a
          href="https://www.npmjs.com/package/@clement.chang.dev/web3-login"
          target="_blank"
          rel="noopener noreferrer"
        >
          npm
        </a>{' '}
        ·{' '}
        <a
          href="https://clement880101.github.io/personal-web/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Clement Chang
        </a>
      </footer>
    </div>
  );
}
