import { generateAuthCode } from "../lib/totp";
import {
  getAccountByUsername,
  setStats,
  getStats,
  getSettings,
} from "../lib/storage";

const XPATHS = {
  STEAM_COMMUNITY: {
    USERNAME_XPATH:
      "/html/body/div[1]/div[7]/div[4]/div[1]/div[1]/div/div/div/div[2]/div/form/div[1]/input",

    PASSWORD_XPATH:
      "/html/body/div[1]/div[7]/div[4]/div[1]/div[1]/div/div/div/div[2]/div/form/div[2]/input",

    LOGIN_BUTTON_XPATH:
      "/html/body/div[1]/div[7]/div[4]/div[1]/div[1]/div/div/div/div[2]/div/form/div[4]/button",

    AUTH_CODE_XPATH:
      "/html/body/div[1]/div[7]/div[4]/div[1]/div[1]/div/div/div/div[2]/form/div/div[2]/div[1]/div/input[1]",
  },
};

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getElementByXPath(xpath: string): HTMLElement | null {
  const result = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );
  return result.singleNodeValue as HTMLElement | null;
}

function waitForElement<T>(xpath: string): Promise<T> {
  return new Promise((resolve) => {
    const el = getElementByXPath(xpath);
    if (el) {
      resolve(el as T);
    } else {
      const observer = new MutationObserver(() => {
        const el = getElementByXPath(xpath);
        if (el) {
          observer.disconnect();
          resolve(el as T);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  });
}

async function initialize() {
  const settings = await getSettings();
  if (!settings.enabled) {
    console.log(`[SAA] Disabled by user`);
    return;
  }

  console.log(`[SAA] Initializing...`);
  const stats = await getStats();

  let debounceTimeout: NodeJS.Timeout | null = null;

  const xpaths = XPATHS.STEAM_COMMUNITY;

  const usernameInput = await waitForElement<HTMLInputElement>(
    xpaths.USERNAME_XPATH
  );
  const passwordInput = await waitForElement<HTMLInputElement>(
    xpaths.PASSWORD_XPATH
  );
  const loginButton = await waitForElement<HTMLButtonElement>(
    xpaths.LOGIN_BUTTON_XPATH
  );

  console.log(`[SAA] Found elements`);

  usernameInput?.addEventListener("keyup", (e: KeyboardEvent) => {
    const username = (e.target as HTMLInputElement).value;

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    debounceTimeout = setTimeout(async () => {
      const account = await getAccountByUsername(username);

      if (account) {
        if (account.password) {
          passwordInput.focus();
          await wait(100);
          passwordInput.dispatchEvent(new Event("focus"));
          passwordInput.value = account.password;
          passwordInput.dispatchEvent(new Event("input", { bubbles: true }));
          await wait(500);
          loginButton.click();
        }

        if (account.sharedSecret) {
          const code = generateAuthCode(account.sharedSecret);
          const authCodeInput = await waitForElement<HTMLInputElement>(
            xpaths.AUTH_CODE_XPATH
          );
          authCodeInput.value = code;
          authCodeInput.dispatchEvent(new Event("input", { bubbles: true }));
          await wait(500);
          authCodeInput.dispatchEvent(new Event("keyup", { bubbles: true }));
        }

        if (account.password || account.sharedSecret) {
          await setStats({ totalLogins: stats.totalLogins + 1 });
        }
      }
    }, 1000);
  });
}

export default defineContentScript({
  matches: [
    "https://steamcommunity.com/login/*",
    "https://store.steampowered.com/login/*",
    "https://steamcommunity.com/openid/login*",
  ],
  exclude: ["https://steamcommunity.com/login/logout/"],
  main() {
    initialize();
  },
});
