import { createHash } from "node:crypto";
import { invokeLLM } from "./_core/llm";
import { listMenuCategories, listMenuProducts } from "./db";

type Catalog = Awaited<ReturnType<typeof listMenuProducts>>;
type CategoryCatalog = Awaited<ReturnType<typeof listMenuCategories>>;

type TranslationResult = {
  available: boolean;
  cacheKey: string;
  categories: Record<string, string>;
  products: Record<string, { name?: string; description?: string; preparation?: string }>;
};

type TranslationResponse = {
  categories: Array<{ id: string; name: string }>;
  products: Array<{ id: string; name: string; description: string; preparation: string }>;
};

const cache = new Map<string, TranslationResult>();
const MAX_CACHE_ENTRIES = 64;

const sourcePayload = (products: Catalog, categories: CategoryCatalog) => ({
  categories: categories.filter((category) => category.status === "ACTIVE").map((category) => ({ id: String(category.id), name: category.name })),
  products: products.map(({ product, category }) => ({
    id: String(product.id),
    name: product.name,
    description: product.description ?? "",
    preparation: product.preparation ?? "",
    category: category?.name ?? "",
  })),
});

const emptyResult = (cacheKey: string): TranslationResult => ({ available: false, cacheKey, categories: {}, products: {} });

export async function translateActiveMenu(): Promise<TranslationResult> {
  const [products, categories] = await Promise.all([listMenuProducts(false, true), listMenuCategories(false)]);
  const payload = sourcePayload(products, categories);
  const cacheKey = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  try {
    const response = await invokeLLM({
      model: "gpt-5-mini",
      maxTokens: 5000,
      messages: [
        { role: "system", content: "You are a restaurant menu translator. Translate Mozambican Portuguese to natural, concise English. Preserve proper names when appropriate. Return only the requested JSON. Never translate prices, IDs, quantities, dates, codes, or numbers; those are not included in the output." },
        { role: "user", content: `Translate the following restaurant catalog from Portuguese to English. Keep every id exactly unchanged and return one entry for every category and product. For empty source text, return an empty string. Source catalog JSON:\n${JSON.stringify(payload)}` },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "translated_menu_catalog",
          strict: true,
          schema: {
            type: "object",
            properties: {
              categories: { type: "array", items: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } }, required: ["id", "name"], additionalProperties: false } },
              products: { type: "array", items: { type: "object", properties: { id: { type: "string" }, name: { type: "string" }, description: { type: "string" }, preparation: { type: "string" } }, required: ["id", "name", "description", "preparation"], additionalProperties: false } },
            },
            required: ["categories", "products"],
            additionalProperties: false,
          },
        },
      },
    });
    const content = response.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("TRANSLATION_EMPTY_RESPONSE");
    const translated = JSON.parse(content) as TranslationResponse;
    const result: TranslationResult = {
      available: true,
      cacheKey,
      categories: Object.fromEntries(translated.categories.map((item) => [item.id, item.name])),
      products: Object.fromEntries(translated.products.map((item) => [item.id, { name: item.name, description: item.description, preparation: item.preparation }])),
    };
    cache.set(cacheKey, result);
    while (cache.size > MAX_CACHE_ENTRIES) cache.delete(cache.keys().next().value as string);
    return result;
  } catch (error) {
    console.warn("[MenuTranslation] Translation unavailable; using Portuguese fallback", error);
    const result = emptyResult(cacheKey);
    cache.set(cacheKey, result);
    return result;
  }
}

export function clearMenuTranslationCache() {
  cache.clear();
}
