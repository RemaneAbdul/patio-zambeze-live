import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const pagesDir = path.resolve(import.meta.dirname);
const products = fs.readFileSync(path.join(pagesDir, "ProductsPanel.tsx"), "utf8");
const waiters = fs.readFileSync(path.join(pagesDir, "WaitersPanel.tsx"), "utf8");
const waiterPanel = fs.readFileSync(path.join(pagesDir, "WaiterPanel.tsx"), "utf8");
const router = fs.readFileSync(path.resolve(import.meta.dirname, "../../../server/routers.ts"), "utf8");

describe("Anexo 04 — feedback e validação dos painéis", () => {
  it("mantém feedback global de sucesso e erro no catálogo", () => {
    expect(products).toContain('import { toast } from "sonner";');
    expect(products).toContain("toast.success(message");
    expect(products).toContain("toast.error(message");
    expect(products).toContain("até 10 MB");
  });

  it("não deixa inputs nativos de ficheiro visíveis no formulário de pratos", () => {
    expect(products).toContain('className="hidden"');
    expect(products).toContain("Galeria do dispositivo");
    expect(products).toContain("Tirar foto");
  });

  it("padroniza sucesso e falhas das operações de garçons e mesas", () => {
    expect(waiters).toContain("toast.success(\"Garçom criado com sucesso.\")");
    expect(waiters).toContain("toast.error(mapPanelActionError(error))");
    expect(waiterPanel).toContain("toast.success(\"Pedido marcado como visto.\")");
    expect(waiterPanel).toContain("mapOperationalError");
  });

  it("normaliza username e valida telefone no servidor", () => {
    expect(waiters).toContain('value={form.username}');
    expect(router).toContain("username: z.string().trim().toLowerCase().min(1).max(64)");
    expect(router).toContain("TELEFONE_INVALIDO");
    expect(router).toContain("/^\\+?\\d{7,15}$/");
  });
});
