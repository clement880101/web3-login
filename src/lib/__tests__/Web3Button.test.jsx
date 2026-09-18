import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import Web3Button from '../Web3Button';

const ADDRESS = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F';

/** A wallet in whatever state a test needs, with spies for the actions. */
function wallet(overrides = {}) {
  return {
    address: null,
    chainId: null,
    status: 'disconnected',
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    switchChain: vi.fn(),
    ...overrides,
  };
}

describe('rendering by status', () => {
  test('offers to install a wallet when none is present', () => {
    render(<Web3Button wallet={wallet({ status: 'unsupported' })} />);

    const link = screen.getByRole('link', { name: /install metamask/i });
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('metamask.io')
    );
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  test('prompts to connect when disconnected', () => {
    const w = wallet();
    render(<Web3Button wallet={w} />);

    fireEvent.click(screen.getByRole('button', { name: /connect wallet/i }));

    expect(w.connect).toHaveBeenCalledTimes(1);
  });

  test('disables the button while connecting', () => {
    render(<Web3Button wallet={wallet({ status: 'connecting' })} />);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('shows the truncated address when connected', () => {
    render(
      <Web3Button
        wallet={wallet({ status: 'connected', address: ADDRESS, chainId: 1 })}
      />
    );

    expect(screen.getByRole('button', { name: /0x71C7/ })).toBeInTheDocument();
    // The full address must not be mangled into upper case: EIP-55 casing is
    // a checksum, not decoration.
    expect(screen.getByRole('button').textContent).toContain('0x71C7');
  });

  test('offers to switch when on the wrong chain', () => {
    const w = wallet({ status: 'wrong-chain', address: ADDRESS, chainId: 137 });
    render(<Web3Button wallet={w} chainId={1} />);

    const button = screen.getByRole('button', { name: /switch to ethereum/i });
    fireEvent.click(button);

    expect(w.switchChain).toHaveBeenCalledTimes(1);
  });

  test('surfaces an error message', () => {
    render(
      <Web3Button
        wallet={wallet({ error: 'Request rejected in your wallet.' })}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent(/rejected/i);
  });
});

describe('connected menu', () => {
  function renderConnected(extra = {}) {
    const w = wallet({
      status: 'connected',
      address: ADDRESS,
      chainId: 1,
      ...extra,
    });
    render(<Web3Button wallet={w} />);
    return w;
  }

  test('opens on click and offers the account actions', async () => {
    renderConnected();

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: /copy address/i })
      ).toBeVisible()
    );
    expect(
      screen.getByRole('menuitem', { name: /view on explorer/i })
    ).toHaveAttribute('href', `https://etherscan.io/address/${ADDRESS}`);
    expect(screen.getByRole('menuitem', { name: /disconnect/i })).toBeVisible();
  });

  test('omits the explorer link for an unknown chain', async () => {
    renderConnected({ chainId: 999999 });

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: /disconnect/i })
      ).toBeVisible()
    );
    expect(
      screen.queryByRole('menuitem', { name: /view on explorer/i })
    ).not.toBeInTheDocument();
  });

  test('disconnects from the menu', async () => {
    const w = renderConnected();

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: /disconnect/i })
      ).toBeVisible()
    );
    fireEvent.click(screen.getByRole('menuitem', { name: /disconnect/i }));

    expect(w.disconnect).toHaveBeenCalledTimes(1);
  });

  test('closes on Escape', async () => {
    renderConnected();

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: /disconnect/i })
      ).toBeVisible()
    );

    fireEvent.keyDown(document.activeElement || document.body, {
      key: 'Escape',
    });

    await waitFor(() =>
      expect(
        screen.queryByRole('menuitem', { name: /disconnect/i })
      ).not.toBeInTheDocument()
    );
  });

  test('marks the trigger as expanded while open', async () => {
    renderConnected();
    const trigger = screen.getByRole('button');

    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);

    await waitFor(() =>
      expect(trigger).toHaveAttribute('aria-expanded', 'true')
    );
  });
});
