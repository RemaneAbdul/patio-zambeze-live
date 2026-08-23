import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

const PUBLIC_OAUTH_PORTAL = "https://manus.im";
const PUBLIC_APP_ID = "8XUHoHCp7FLwnEffAV7Tmy";

function createOAuthNonce() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  const random = Math.random().toString(36).slice(2);
  return `${Date.now().toString(36)}-${random}-${Math.random().toString(36).slice(2)}`;
}

function getPublicOAuthConfig() {
  // OAuth portal and app ID are public identifiers. Keep them explicit here so
  // a misconfigured Vercel VITE_* variable can never inject a server secret.
  return { portal: PUBLIC_OAUTH_PORTAL, appId: PUBLIC_APP_ID };
}

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
export const startLogin = () => {
  const { portal, appId } = getPublicOAuthConfig();
  const redirectUri = `${window.location.origin}/api/oauth/callback`;
  const nonce = createOAuthNonce();

  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=None; Secure`;
  const state = encodeOAuthState({ redirectUri, nonce });

  const url = new URL(`${portal}/app-auth`);
  url.searchParams.set("appId", appId);
  url.searchParams.set("redirectUri", redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("type", "signIn");

  window.location.assign(url.toString());
};
