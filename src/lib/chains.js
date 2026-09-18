/**
 * Chain metadata in the shape `wallet_addEthereumChain` expects, plus a
 * display name used by the UI.
 *
 * RPC endpoints are public and keyless on purpose: this package has no
 * configuration step, and a provider key baked into a client bundle is not a
 * secret anyway. An application with its own endpoints should pass them
 * through rather than rely on these.
 */
const CHAINS = {
  1: {
    chainId: '0x1',
    chainName: 'Ethereum',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://ethereum-rpc.publicnode.com'],
    blockExplorerUrls: ['https://etherscan.io'],
  },
  11155111: {
    chainId: '0xaa36a7',
    chainName: 'Sepolia',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
    blockExplorerUrls: ['https://sepolia.etherscan.io'],
  },
  137: {
    chainId: '0x89',
    chainName: 'Polygon',
    nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
    rpcUrls: ['https://polygon-bor-rpc.publicnode.com'],
    blockExplorerUrls: ['https://polygonscan.com'],
  },
  42161: {
    chainId: '0xa4b1',
    chainName: 'Arbitrum One',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://arbitrum-one-rpc.publicnode.com'],
    blockExplorerUrls: ['https://arbiscan.io'],
  },
  10: {
    chainId: '0xa',
    chainName: 'OP Mainnet',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://optimism-rpc.publicnode.com'],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
  },
  8453: {
    chainId: '0x2105',
    chainName: 'Base',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: ['https://base-rpc.publicnode.com'],
    blockExplorerUrls: ['https://basescan.org'],
  },
};

/** Full metadata for a chain id, or undefined when it is not in the table. */
export function getChain(chainId) {
  return CHAINS[chainId];
}

/** Display name for a chain id, falling back to the raw id. */
export function getChainName(chainId) {
  if (chainId == null) return 'Unknown';
  return CHAINS[chainId]?.chainName ?? `Chain ${chainId}`;
}

/** Block explorer address URL, or null when the chain is unknown. */
export function getExplorerAddressUrl(chainId, address) {
  const base = CHAINS[chainId]?.blockExplorerUrls?.[0];
  if (!base || !address) return null;
  return `${base}/address/${address}`;
}

export default CHAINS;
