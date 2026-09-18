import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import { Web3Button, useWallet, getChainName } from '../lib';

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: { default: '#0b0d12', paper: '#141821' },
    primary: { main: '#7c8cff' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
});

const USAGE = `import { Web3Button, useWallet } from 'web3-login'

// Drop-in button
<Web3Button chainId={1} onConnect={(address) => console.log(address)} />

// Or bring your own UI
const { address, chainId, status, connect, disconnect } = useWallet({
  chainId: 1,
})`;

/** The chain this demo asks for, shared so button and readout agree. */
const REQUIRED_CHAIN_ID = 1;

const STATUS_COLOR = {
  connected: 'success',
  'wrong-chain': 'warning',
  connecting: 'info',
  unsupported: 'error',
  disconnected: 'default',
};

function Code({ children }) {
  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 2,
        overflowX: 'auto',
        borderRadius: 2,
        bgcolor: '#0b0d12',
        border: '1px solid',
        borderColor: 'divider',
        fontSize: 13,
        lineHeight: 1.7,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      }}
    >
      <code>{children}</code>
    </Box>
  );
}

function Field({ label, value }) {
  return (
    <Box>
      <Typography variant="overline" color="text.secondary">
        {label}
      </Typography>
      <Typography
        sx={{
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          fontSize: 14,
          wordBreak: 'break-all',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

/**
 * The live readout exists to prove the hook and the button share one source of
 * truth: switching account or network in the wallet updates both.
 */
function LiveState({ wallet }) {
  const { address, chainId, status } = wallet;

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="overline" color="text.secondary">
          Status
        </Typography>
        <Box>
          <Chip
            size="small"
            label={status}
            color={STATUS_COLOR[status] ?? 'default'}
          />
        </Box>
      </Box>
      <Field label="Address" value={address ?? '—'} />
      <Field
        label="Chain"
        value={chainId == null ? '—' : `${getChainName(chainId)} (${chainId})`}
      />
    </Stack>
  );
}

export default function App() {
  const wallet = useWallet({ chainId: REQUIRED_CHAIN_ID });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
        <Stack spacing={1.5}>
          <Typography variant="h3" component="h1" fontWeight={700}>
            web3-login
          </Typography>
          <Typography variant="h6" color="text.secondary" fontWeight={400}>
            A MUI React button for connecting an EIP-1193 wallet. No web3
            libraries, no providers to configure — it talks to{' '}
            <Box component="code" sx={{ fontFamily: 'monospace' }}>
              window.ethereum
            </Box>{' '}
            directly.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
            <Chip size="small" label="React 19" variant="outlined" />
            <Chip size="small" label="MUI 9" variant="outlined" />
            <Chip size="small" label="Zero runtime deps" variant="outlined" />
          </Stack>
        </Stack>

        <Paper
          variant="outlined"
          sx={{ mt: 6, p: { xs: 3, md: 4 }, borderRadius: 3 }}
        >
          <Typography variant="h6" gutterBottom>
            Try it
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Requires a browser wallet such as MetaMask. Switching account or
            network in the wallet updates the readout without a reload.
          </Typography>

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={4}
            alignItems={{ xs: 'stretch', sm: 'flex-start' }}
          >
            <Box sx={{ minWidth: 200 }}>
              <Web3Button wallet={wallet} chainId={REQUIRED_CHAIN_ID} />
            </Box>
            <Divider
              flexItem
              orientation="vertical"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            />
            <Box sx={{ flex: 1 }}>
              <LiveState wallet={wallet} />
            </Box>
          </Stack>
        </Paper>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h6" gutterBottom>
            Usage
          </Typography>
          <Code>{USAGE}</Code>
        </Box>

        <Box sx={{ mt: 6 }}>
          <Typography variant="h6" gutterBottom>
            Notes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Passing <code>chainId</code> puts the button into a “Switch
            network” state whenever the wallet is on a different chain, adding
            the network first if the wallet does not know it. Disconnect clears
            local state and revokes the grant where the wallet supports it —
            EIP-1193 has no portable way to force a wallet to forget a site.
          </Typography>
        </Box>

        <Divider sx={{ mt: 6, mb: 3 }} />
        <Typography variant="body2" color="text.secondary">
          MIT licensed ·{' '}
          <Link
            href="https://github.com/clement880101/web3-login"
            target="_blank"
            rel="noopener noreferrer"
          >
            Source on GitHub
          </Link>
        </Typography>
      </Container>
    </ThemeProvider>
  );
}

