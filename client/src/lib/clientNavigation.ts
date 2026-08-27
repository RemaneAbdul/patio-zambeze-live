export type ClientView = "menu" | "product" | "selection" | "confirmation" | "history";

export type ClientNavigation = {
  view: ClientView;
  productKey?: string;
};

const NAVIGATION_KEY = "patio-view";

function decode(value: string | null) {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseClientNavigation(hash: string): ClientNavigation {
  const params = new URLSearchParams(hash.replace(/^#/, ""));
  const view = params.get(NAVIGATION_KEY);
  if (view === "product") {
    return { view, productKey: decode(params.get("product")) };
  }
  if (view === "selection" || view === "confirmation" || view === "history") return { view };
  return { view: "menu" };
}

export function clientNavigationHash(navigation: ClientNavigation) {
  if (navigation.view === "menu") return "";
  const params = new URLSearchParams([[NAVIGATION_KEY, navigation.view]]);
  if (navigation.view === "product" && navigation.productKey) params.set("product", navigation.productKey);
  return `#${params.toString()}`;
}

export function clientNavigationState(navigation: ClientNavigation, depth = 0) {
  return { clientNavigation: true, clientNavigationDepth: depth, ...navigation };
}

export function isClientNavigationState(value: unknown): value is ClientNavigation {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ClientNavigation> & { clientNavigation?: boolean };
  return candidate.clientNavigation === true && (candidate.view === "menu" || candidate.view === "product" || candidate.view === "selection" || candidate.view === "confirmation" || candidate.view === "history");
}
