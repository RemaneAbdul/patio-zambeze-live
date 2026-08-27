import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const productsSource = fs.readFileSync(path.resolve(import.meta.dirname, "ProductsPanel.tsx"), "utf8");
const homeSource = fs.readFileSync(path.resolve(import.meta.dirname, "Home.tsx"), "utf8");
const translationSource = fs.readFileSync(path.resolve(import.meta.dirname, "../../../server/menuTranslation.ts"), "utf8");
const receiptSource = fs.readFileSync(path.resolve(import.meta.dirname, "../components/ThermalReceipt.tsx"), "utf8");
const stylesSource = fs.readFileSync(path.resolve(import.meta.dirname, "../index.css"), "utf8");
const viteSource = fs.readFileSync(path.resolve(import.meta.dirname, "../../../vite.config.ts"), "utf8");

describe("Portuguese-first catalog translation", () => {
  it("removes manual English fields from the admin form and payload", () => {
    expect(productsSource).not.toContain("Nome em inglês");
    expect(productsSource).not.toContain("Descrição em inglês");
    expect(productsSource).not.toContain("Preparação (EN)");
    expect(productsSource).not.toContain("form.nameEn");
    expect(productsSource).not.toContain("form.descriptionEn");
    expect(productsSource).not.toContain("form.preparationEn");
    expect(productsSource).toContain("products-auto-translation");
  });

  it("translates by stable Supabase ids and falls back to Portuguese", () => {
    expect(homeSource).toContain("trpc.menu.translations.useQuery");
    expect(homeSource).toContain('translationsQuery.data?.products[String(product.id)]');
    expect(homeSource).toContain("|| product.name");
    expect(homeSource).toContain("|| product.description");
    expect(homeSource).toContain("|| product.preparation");
    expect(homeSource).toContain("translationsQuery.data?.categories[String(source.id)]");
  });

  it("uses the order label in both languages without changing the action", () => {
    expect(homeSource).toContain('selection: "Fazer pedido"');
    expect(homeSource).toContain('selection: "Place order"');
    expect(homeSource).toContain('onClick={() => setShowSelection(true)}');
    expect(homeSource).not.toContain('selection: "Minha Seleção"');
    expect(homeSource).not.toContain('selection: "My Selection"');
  });

  it("allows customer notes before submitting and carries notes into the receipt history", () => {
    expect(homeSource).toContain('const [orderNotes, setOrderNotes] = useState("")');
    expect(homeSource).toContain('notes: orderNotes.trim() || undefined');
    expect(homeSource).toContain('notesLabel: "Instruções especiais"');
    expect(homeSource).toContain('notesLabel: "Special instructions"');
    expect(homeSource).toContain('maxLength={1000}');
    expect(homeSource).toContain('notes: entry.notes');
    expect(receiptSource).toContain('receipt-selection-notes');
  });

  it("provides real catalog suggestions and highlights matching search text", () => {
    expect(homeSource).toContain("searchSuggestions");
    expect(homeSource).toContain('role="combobox"');
    expect(homeSource).toContain('role="listbox"');
    expect(homeSource).toContain('highlightMatch(productName(product))');
    expect(homeSource).toContain('<mark');
  });

  it("shows loading feedback and prevents duplicate order submission", () => {
    expect(homeSource).toContain("historyMutation.isPending");
    expect(homeSource).toContain("aria-busy={historyMutation.isPending}");
    expect(homeSource).toContain("A criar o pedido");
    expect(homeSource).toContain("disabled={historyMutation.isPending}");
  });

  it("keeps print CSS valid and splits third-party dependencies into chunks", () => {
    expect(stylesSource).toContain(".receipt-modal .sm\\:p-8");
    expect(stylesSource).not.toContain(".receipt-modal .sm\\\\:p-8");
    expect(viteSource).toContain("manualChunks(id)");
    expect(viteSource).toContain('return "vendor-react"');
    expect(viteSource).toContain("return undefined;");
  });

  it("uses a server-side content hash cache and does not expose manual database mutations", () => {
    expect(translationSource).toContain('createHash("sha256")');
    expect(translationSource).toContain("cache.get(cacheKey)");
    expect(translationSource).toContain('model: "gpt-5-mini"');
    expect(translationSource).toContain("listMenuProducts(false, true)");
    expect(translationSource).toContain("available: false");
  });
});
