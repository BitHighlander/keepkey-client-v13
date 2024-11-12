import type { PlasmoCSConfig } from "plasmo";
import { announceProvider } from "mipd";
import { v4 as uuidv4 } from "uuid";
import KEEPKEY_ICON_RAW_SVG from "~/assets/keepkey.svg"; // Ensure this is a valid data URI

enum RequestMethod {
  ETH_REQUEST_ACCOUNTS = "eth_requestAccounts",
  ETH_CHAIN_ID = "eth_chainId",
  // ... add other methods as needed
}

enum EventMethod {
  ACCOUNTS_CHANGED = "accountsChanged",
  CONNECT = "connect",
  DISCONNECT = "disconnect",
  // ... add other events as needed
}

type RequestArguments = {
  method: string;
  params?: unknown[];
};

interface EIP1193Provider {
  isMetaMask?: boolean;
  isKeepKey?: boolean;
  request(args: RequestArguments): Promise<unknown>;
  on(event: string, listener: (...args: unknown[]) => void): void;
  removeListener(event: string, listener: (...args: unknown[]) => void): void;
  // ... include other EIP-1193 methods if needed
}

class KeepKeyProvider implements EIP1193Provider {
  isMetaMask = true; // So dApps recognize it as MetaMask
  isKeepKey = true;  // Custom flag to identify KeepKey
  _events: Record<string, ((...args: unknown[]) => void)[]> = {};

  // Simulate connected state
  isConnected() {
    return true;
  }

  async request(args: RequestArguments): Promise<unknown> {
    const { method, params } = args;
    switch (method) {
      case RequestMethod.ETH_REQUEST_ACCOUNTS:
        // Return a mock Ethereum address
        return ["0xYourEthereumAddress"];
      case RequestMethod.ETH_CHAIN_ID:
        // Return the chain ID (e.g., '0x1' for Ethereum Mainnet)
        return "0x1";
        // Handle other methods as needed
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  on(event: string, listener: (...args: unknown[]) => void): void {
    if (!this._events[event]) {
      this._events[event] = [];
    }
    this._events[event].push(listener);
  }

  removeListener(event: string, listener: (...args: unknown[]) => void): void {
    const listeners = this._events[event];
    if (!listeners) return;
    this._events[event] = listeners.filter((l) => l !== listener);
  }

  // Internal method to emit events
  _emit(event: string, data: unknown): void {
    const listeners = this._events[event];
    if (listeners && listeners.length > 0) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  }

  // Simulate connection event
  _connect(): void {
    this._emit(EventMethod.CONNECT, { chainId: "0x1" });
  }

  // Simulate disconnection event
  _disconnect(error?: { code: number; message: string }): void {
    this._emit(EventMethod.DISCONNECT, error || { code: 4900, message: "Provider disconnected" });
  }
}

// Create an instance of the provider
const keepKeyProvider = new KeepKeyProvider();

// Attach the provider to both window.ethereum and window.keepkey.ethereum
window.ethereum = keepKeyProvider;
window.keepkey = {
  ethereum: keepKeyProvider,
};

// Announce the provider using EIP-6963
announceProvider({
  info: {
    icon: 'https://pioneers.dev/coins/keepkey.png', // Ensure this is a data URI
    name: "KeepKey",
    rdns: "com.keepkey",
    uuid: uuidv4(),
  },
  provider: keepKeyProvider,
});

// Optional: Simulate the provider connecting
keepKeyProvider._connect();

// Plasmo content script configuration
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  run_at: "document_start",
};
