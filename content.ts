import type { PlasmoCSConfig } from "plasmo";
import { type EIP1193Provider, announceProvider } from "mipd";
import { v4 as uuidv4 } from "uuid";
import KEEPKEY_ICON_RAW_SVG from "~/assets/keepkey.svg";
import type { PlasmoCSConfig } from "plasmo"

enum RequestMethod {
  ETH_ACCOUNTS = "eth_accounts",
  ETH_BLOB_BASE_FEE = "eth_blobBaseFee",
  ETH_BLOCK_NUMBER = "eth_blockNumber",
  ETH_CALL = "eth_call",
  ETH_CHAIN_ID = "eth_chainId",
  ETH_COINBASE = "eth_coinbase",
  ETH_DECRYPT = "eth_decrypt",
  ETH_ESTIMATE_GAS = "eth_estimateGas",
  ETH_FEE_HISTORY = "eth_feeHistory",
  ETH_GAS_PRICE = "eth_gasPrice",
  ETH_GET_BALANCE = "eth_getBalance",
  ETH_GET_BLOCK_BY_HASH = "eth_getBlockByHash",
  ETH_GET_BLOCK_BY_NUMBER = "eth_getBlockByNumber",
  ETH_GET_BLOCK_RECEIPTS = "eth_getBlockReceipts",
  ETH_GET_BLOCK_TRANSACTION_COUNT_BY_HASH = "eth_getBlockTransactionCountByHash",
  ETH_GET_BLOCK_TRANSACTION_COUNT_BY_NUMBER = "eth_getBlockTransactionCountByNumber",
  ETH_GET_CODE = "eth_getCode",
  ETH_GET_ENCRYPTION_PUBLIC_KEY = "eth_getEncryptionPublicKey",
  ETH_GET_FILTER_CHANGES = "eth_getFilterChanges",
  ETH_GET_FILTER_LOGS = "eth_getFilterLogs",
  ETH_GET_LOGS = "eth_getLogs",
  ETH_GET_PROOF = "eth_getProof",
  ETH_GET_STORAGEAT = "eth_getStorageAt",
  ETH_GET_TRANSACTION_BY_BLOCK_HASH_AND_INDEX = "eth_getTransactionByBlockHashAndIndex",
  ETH_GET_TRANSACTION_BY_BLOCK_NUMBER_AND_INDEX = "eth_getTransactionByBlockNumberAndIndex",
  ETH_GET_TRANSACTION_BY_HASH = "eth_getTransactionByHash",
  ETH_GET_TRANSACTION_COUNT = "eth_getTransactionCount",
  ETH_GET_TRANSACTION_RECEIPT = "eth_getTransactionReceipt",
  ETH_GET_UNCLE_COUNT_BY_BLOCK_HASH = "eth_getUncleCountByBlockHash",
  ETH_GET_UNCLE_COUNT_BY_BLOCK_NUMBER = "eth_getUncleCountByBlockNumber",
  ETH_MAX_PRIORITY_FEE_PER_GAS = "eth_maxPriorityFeePerGas",
  ETH_NEW_BLOCK_FILTER = "eth_newBlockFilter",
  ETH_NEW_FILTER = "eth_newFilter",
  ETH_NEW_PENDING_TRANSACTION_FILTER = "eth_newPendingTransactionFilter",
  ETH_REQUEST_ACCOUNTS = "eth_requestAccounts",
  ETH_SEND_RAW_TRANSACTION = "eth_sendRawTransaction",
  ETH_SEND_TRANSACTION = "eth_sendTransaction",
  ETH_SIGN = "eth_sign",
  ETH_SIGN_TYPED_DATA_V4 = "eth_signTypedData_v4",
  ETH_SUBSCRIBE = "eth_subscribe",
  ETH_SYNCING = "eth_syncing",
  ETH_UNINSTALL_FILTER = "eth_uninstallFilter",
  ETH_UNSUBSCRIBE = "eth_unsubscribe",
  PERSONAL_SIGN = "personal_sign",
  WALLET_ADD_ETHEREUM_CHAIN = "wallet_addEthereumChain",
  WALLET_GET_PERMISSIONS = "wallet_getPermissions",
  WALLET_REGISTER_ONBOARDING = "wallet_registerOnboarding",
  WALLET_REQUEST_PERMISSIONS = "wallet_requestPermissions",
  WALLET_REVOKE_PERMISSIONS = "wallet_revokePermissions",
  WALLET_SWITCH_ETHEREUM_CHAIN = "wallet_switchEthereumChain",
  WALLET_SCAN_QR_CODE = "wallet_scanQRCode",
  WALLET_WATCH_ASSET = "wallet_watchAsset",
  WEB3_CLIENT_VERSION = "web3_clientVersion",
}

window.addEventListener("load", () => {
  console.log(
      "You may find that having is not so pleasing a thing as wanting. This is not logical, but it is often true."
  )

  // //dark mode
  // document.body.style.background = "black"
})



export const config: PlasmoCSConfig = {
  matches: ["<all_urls>"],
  world: "MAIN",
  run_at: "document_start",
};

enum EventMethod {
  ACCOUNTS_CHANGED = "ACCOUNTS_CHANGED",
  CONNECT = "CONNECT",
  DISCONNECT = "DISCONNECT",
}

type RequestArguments = {
  method: string;
  params?: Record<string, any>[];
};

interface EthereumProvider {
  isMetaMask: boolean;
  _events: Record<string, Function[]>;
  enable(): Promise<string[]>;
  isConnected(): boolean;
  on(event: string, callback: (data: any) => void): void;
  removeListener(event: string, callback: Function): void;
  request(args: RequestArguments): Promise<string | string[]>;
  _emit(event: string, data: any): void;
  _connect(): void;
  _disconnect(error?: { code: number; message: string }): void;
}

const ethereumProvider: EthereumProvider = {
  isMetaMask: true,
  _events: {},

  isConnected: () => true,

  request: (args) => {
    return new Promise((resolve) => {
      if (args.method === RequestMethod.ETH_REQUEST_ACCOUNTS) {
        resolve(["0x141D9959cAe3853b035000490C03991eB70Fc4aC"]);
      } else if (args.method === RequestMethod.ETH_CHAIN_ID) {
        resolve("0x1"); // Mock chain ID
      } else {
        resolve("Mock response");
      }
    });
  },

  enable: () => {
    return ethereumProvider.request({ method: RequestMethod.ETH_REQUEST_ACCOUNTS });
  },

  on: (event, callback) => {
    if (!ethereumProvider._events[event]) {
      ethereumProvider._events[event] = [];
    }
    ethereumProvider._events[event].push(callback);
  },

  removeListener: (event, callback) => {
    const listeners = ethereumProvider._events[event];
    if (!listeners) return;
    ethereumProvider._events[event] = listeners.filter((listener) => listener !== callback);
  },

  _emit: (event, data) => {
    const listeners = ethereumProvider._events[event];
    if (listeners && listeners.length > 0) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} event listener:`, error);
        }
      });
    }
  },

  _connect: () => {
    ethereumProvider._emit(EventMethod.CONNECT, { chainId: "0x1" });
  },

  _disconnect: (error) => {
    ethereumProvider._emit(EventMethod.DISCONNECT, error || { code: 4900, message: "Provider disconnected" });
  },
};

ethereumProvider._connect();
window.ethereum = ethereumProvider;

announceProvider({
  info: {
    icon: KEEPKEY_ICON_RAW_SVG,
    name: "Keepkey",
    rdns: "com.keepkey",
    uuid: uuidv4(),
  },
  provider: any,
});
