import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const component = fs.readFileSync(path.resolve(import.meta.dirname, "REMAFooter.tsx"), "utf8");
const dashboard = fs.readFileSync(path.resolve(import.meta.dirname, "DashboardLayout.tsx"), "utf8");
const home = fs.readFileSync(path.resolve(import.meta.dirname, "../pages/Home.tsx"), "utf8");
const styles = fs.readFileSync(path.resolve(import.meta.dirname, "../index.css"), "utf8");

describe("REMA footer", () => {
  it("uses the supplied persistent icon and exact signature", () => {
    expect(component).toContain("/manus-storage/rema-logo-source_cfb182ff.png");
    expect(component).toContain("Desenvolvido por REMA | Sistema de Gestão de Menu Digital");
    expect(component).toContain('alt="REMA"');
  });

  it("is shared by the customer menu and dashboard layout", () => {
    expect(dashboard).toContain('import REMAFooter from "./REMAFooter"');
    expect(dashboard).toContain("<REMAFooter />");
    expect(home).toContain('import REMAFooter from "@/components/REMAFooter"');
    expect(home).toContain("<REMAFooter />");
  });

  it("has responsive, overflow-safe styling", () => {
    expect(styles).toContain(".rema-footer");
    expect(styles).toContain("overflow-wrap: anywhere");
    expect(styles).toContain("@media (max-width: 640px)");
  });
});
