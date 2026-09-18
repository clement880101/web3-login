/**
 * A stand-in for an injected EIP-1193 provider (`window.ethereum`).
 *
 * Only the surface `useWallet` actually touches is implemented: `request`,
 * `on` and `removeListener`. `emit` and `listenerCount` are test affordances
 * and are not part of the EIP-1193 interface.
 */
export function createMockProvider({
  accounts = [],
  chainId = '0x1',
  handlers = {},
} = {}) {
  const listeners = {};

  const provider = {
    calls: [],

    request: jest.fn(async ({ method, params }) => {
      provider.calls.push({ method, params });

      if (handlers[method]) {
        return handlers[method]({ method, params });
      }

      switch (method) {
        case 'eth_accounts':
        case 'eth_requestAccounts':
          return accounts;
        case 'eth_chainId':
          return chainId;
        default:
          return null;
      }
    }),

    on: jest.fn((event, handler) => {
      listeners[event] = listeners[event] || [];
      listeners[event].push(handler);
    }),

    removeListener: jest.fn((event, handler) => {
      listeners[event] = (listeners[event] || []).filter((h) => h !== handler);
    }),

    emit(event, payload) {
      (listeners[event] || []).slice().forEach((handler) => handler(payload));
    },

    listenerCount(event) {
      return (listeners[event] || []).length;
    },

    methodCalls(method) {
      return provider.calls.filter((call) => call.method === method);
    },
  };

  return provider;
}

/** Build a provider error carrying an EIP-1193 / EIP-1474 numeric code. */
export function rpcError(code, message = `error ${code}`) {
  const error = new Error(message);
  error.code = code;
  return error;
}

export function installProvider(provider) {
  window.ethereum = provider;
  return provider;
}

export function removeProvider() {
  delete window.ethereum;
}
