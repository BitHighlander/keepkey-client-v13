import type { PlasmoCSConfig } from "plasmo";
import { announceProvider } from "mipd";
import { v4 as uuidv4 } from "uuid";
import { JsonRpcProvider } from 'ethers';
import KEEPKEY_ICON_RAW_SVG from "~/assets/keepkey.svg"; // Ensure this is a valid data URI

const EIP155_CHAINS: any = {
  'eip155:1': {
    chainId: '0x1',
    name: 'Ethereum',
    logo: '/chain-logos/eip155-1.png',
    rgb: '99, 125, 234',
    rpc: 'https://ethereum-rpc.publicnode.com',
    namespace: 'eip155',
    caip: 'eip155:1/slip44:60',
  }
}
let CURRENT_PROVIDER = EIP155_CHAINS['eip155:1'] as any;
CURRENT_PROVIDER.provider = new JsonRpcProvider(CURRENT_PROVIDER.rpc);

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

const convertHexToDecimalChainId = (hexChainId: string): number => {
  return parseInt(hexChainId, 16);
};

let ADDRESS = "0x141D9959cAe3853b035000490C03991eB70Fc4aC"

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
      case 'eth_requestAccounts':
        return [ADDRESS];
      case 'eth_chainId':
        return "0x1";
      case 'net_version':
        const netVersion = CURRENT_PROVIDER.chainId.toString();
        return convertHexToDecimalChainId(netVersion).toString();
      case 'eth_getBlockByNumber': {
        const blockByNumber = await CURRENT_PROVIDER.provider.getBlock(params[0]);
        return blockByNumber;
      }
      case 'eth_blockNumber': {
        const blockNumber = await CURRENT_PROVIDER.provider.getBlockNumber();
        return '0x' + blockNumber.toString(16);
      }
      case 'eth_getBalance': {
        const balance = await CURRENT_PROVIDER.provider.getBalance(params[0], params[1]);
        return '0x' + balance.toString(16);
      }
      case 'eth_getTransactionReceipt': {
        const transactionReceipt = await CURRENT_PROVIDER.provider.getTransactionReceipt(params[0]);
        return transactionReceipt;
      }
      case 'eth_getTransactionByHash': {
        const transactionByHash = await CURRENT_PROVIDER.provider.getTransaction(params[0]);
        return transactionByHash;
      }
      case 'eth_call': {
        const [callParams, blockTag, stateOverride] = params;
        const callResult = await CURRENT_PROVIDER.provider.call(callParams, blockTag, stateOverride);
        return callResult;
      }
      case 'eth_maxPriorityFeePerGas': {
        const feeData = await CURRENT_PROVIDER.provider.getFeeData();
        return feeData.maxPriorityFeePerGas ? '0x' + feeData.maxPriorityFeePerGas.toString(16) : '0x0';
      }
      case 'eth_maxFeePerGas': {
        const feeData = await CURRENT_PROVIDER.provider.getFeeData();
        return feeData.maxFeePerGas ? '0x' + feeData.maxFeePerGas.toString(16) : '0x0';
      }
      case 'eth_estimateGas': {
        const estimateGas = await CURRENT_PROVIDER.provider.estimateGas(params[0]);
        return '0x' + estimateGas.toString(16);
      }
      case 'eth_gasPrice': {
        const gasPrice = await CURRENT_PROVIDER.provider.getGasPrice();
        return '0x' + gasPrice.toString(16);
      }
      case 'eth_getCode': {
        const code = await CURRENT_PROVIDER.provider.getCode(params[0], params[1]);
        return code;
      }
      case 'eth_getStorageAt': {
        const storage = await CURRENT_PROVIDER.provider.getStorage(params[0], params[1], params[2]);
        return storage;
      }
      case 'eth_getTransactionCount': {
        const transactionCount = await CURRENT_PROVIDER.provider.getTransactionCount(params[0], params[1]);
        return '0x' + transactionCount.toString(16);
      }
      case 'eth_sendRawTransaction': {
        const txResponse = await CURRENT_PROVIDER.provider.sendTransaction(params[0]);
        return txResponse.hash;
      }
      case 'wallet_addEthereumChain':
      case 'wallet_switchEthereumChain':
        return true
      case 'wallet_getSnaps': {
        return [];
      }
      case 'wallet_watchAsset': {
        return true;
      }
      case 'wallet_getPermissions':
      case 'wallet_requestPermissions': {
        const permissions = [{ parentCapability: 'eth_accounts' }];
        return permissions;
      }
      case 'eth_accounts': {
        const accounts = [ADDRESS];
        return accounts;
      }
      case 'eth_requestAccounts': {
        const requestAccounts = [ADDRESS];
        return requestAccounts;
      }
      case 'eth_sendTransaction':
      case 'eth_signTransaction':
      case 'personal_sign':
      case 'eth_sign':
      case 'eth_signTypedData':
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4': {
        return {foo: 'bar'};
      }
      case 'eth_getEncryptionPublicKey': {
        return '0x';
      }
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
// keepKeyProvider._connect();

// Plasmo content script configuration
export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  run_at: "document_start",
};
