import { handlers } from "./messages";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handler = handlers[message.name];
    if (handler) {
        handler(message, sender, sendResponse);
        return true; // Keep the message channel open for asynchronous responses
    } else {
        console.warn(`No handler found for message: ${message.name}`);
    }
});
