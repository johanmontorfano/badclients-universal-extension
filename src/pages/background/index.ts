import { cookies, tabs } from "webextension-polyfill";

const SUPABASE_NAMESPACE = "piygqlymojnixmmpjfbl";
const DOMAIN = "http://localhost:3000";

console.log("background script loaded");

chrome.tabs.onUpdated.addListener(async (tabId) => {
    const cookie0 = await cookies.get({
        name: `sb-${SUPABASE_NAMESPACE}-auth-token.0`,
        url: DOMAIN,
    });
    const cookie1 = await cookies.get({
        name: `sb-${SUPABASE_NAMESPACE}-auth-token.1`,
        url: DOMAIN,
    });

    if (cookie0 === null || cookie1 === null)
        tabs.sendMessage(tabId, "no-auth-token-found");
    else {
        chrome.cookies.set({
            url: "chrome-extension://eoeeeeakodfjpfiabdkeanhonmpalgpl/",
            name: cookie0.name,
            value: cookie0.value,
            sameSite: "strict",
        });
    }
});
