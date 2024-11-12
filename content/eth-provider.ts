import type { PlasmoCSConfig } from "plasmo";
import { sendToBackground } from "@plasmohq/messaging";
import { announceProvider } from "mipd";
import { v4 as uuidv4 } from "uuid";
import KEEPKEY_ICON_RAW_SVG from "~/assets/keepkey.svg";

enum RequestMethod {
    ETH_REQUEST_ACCOUNTS = "eth_requestAccounts",
    ETH_CHAIN_ID = "eth_chainId",
}

enum EventMethod {
    ACCOUNTS_CHANGED = "accountsChanged",
    CONNECT = "connect",
    DISCONNECT = "disconnect",
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
}

class KeepKeyProvider implements EIP1193Provider {
    isMetaMask = true;
    isKeepKey = true;
    _events: Record<string, ((...args: unknown[]) => void)[]> = {};

    isConnected() {
        return true;
    }

    async request(args: RequestArguments): Promise<unknown> {
        const { method, params } = args;
        try {

            //const assetContextResponse = await sendToBackground({ name: "keepkey-request", body: { type: 'GET_ASSET_CONTEXT' } });
            //@ts-ignore
            const response = await sendToBackground({
                name: `keepkey-request`,
                body: { params },
            });
            console.log('response', response)

            return response;
        } catch (error) {
            throw new Error(`Error handling method ${method}: ${error.message}`);
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

    _connect(): void {
        this._emit(EventMethod.CONNECT, { chainId: "0x1" });
    }

    _disconnect(error?: { code: number; message: string }): void {
        this._emit(EventMethod.DISCONNECT, error || { code: 4900, message: "Provider disconnected" });
    }
}

const keepKeyProvider = new KeepKeyProvider();

window.ethereum = keepKeyProvider;
window.keepkey = { ethereum: keepKeyProvider };

announceProvider({
    info: {
        icon: KEEPKEY_ICON_RAW_SVG,
        name: "KeepKey",
        rdns: "com.keepkey",
        uuid: uuidv4(),
    },
    provider: keepKeyProvider,
});

keepKeyProvider._connect();

export const config: PlasmoCSConfig = {
    matches: ["<all_urls>"],
    world: "MAIN",
    run_at: "document_start",
};
