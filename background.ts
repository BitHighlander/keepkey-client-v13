import type { PlasmoMessaging } from "@plasmohq/messaging";

const accountsHandler: PlasmoMessaging.MessageHandler = async (req, res) => {
    // Mock response for eth_requestAccounts
    res.send(["0xYourEthereumAddress"]);
};

const chainIdHandler: PlasmoMessaging.MessageHandler = async (req, res) => {
    // Mock response for eth_chainId
    res.send("0x1"); // Mainnet chain ID
};

// Register handlers
export const handlers = {
    "eth-request-accounts": accountsHandler,
    "eth-chain-id": chainIdHandler,
    // Add more handlers as needed
};
