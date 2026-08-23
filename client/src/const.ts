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
  const configuredPortal = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const configuredAppId = import.meta.env.VITE_APP_ID;
  const portal = configuredPortal?.trim() || PUBLIC_OAUTH_PORTAL;
  const appId = configuredAppId?.trim() || PUBLIC_APP_ID;

  // Never allow a database URL or another server-side value to become an OAuth
  // parameter if a deployment variable was entered in the wrong Vercel field.
  const safePortal = /^https:\/\/(?:[a-z0-9-]+\.)*manus\.im(?:\/[^\s]*)?$/i.test(portal)
    ? portal.replace(/\/+$/, "")
    : PUBLIC_OAUTH_PORTAL;
  const safeAppId = /^[A-Za-z0-9_-]{16,128}$/.test(appId) ? appId : PUBLIC_APP_ID;

  return { portal: safePortal, appId: safeAppId };
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
