import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "WaitersPanel.tsx"), "utf8");

describe("admin waiter management", () => {
  it("exposes OAuth-based waiter onboarding without local passwords or photos", () => {
    expect(source).toContain("Adicionar Garçom");
    expect(source).toContain("ROLE = GARÇOM");
    expect(source).toContain("sem palavras-passe locais nem fotografias");
    expect(source).not.toContain("password");
    expect(source).not.toContain("photoUrl");
  });

  it("shows current assignments and service history", () => {
    expect(source).toContain("currentAssignments");
    expect(source).toContain("serviceHistory");
    expect(source).toContain("Mesas actuais");
    expect(source).toContain("Histórico de atendimento");
    expect(source).toContain("Operações auditadas");
  });

  it("keeps activation controls and disabled-state messaging", () => {
    expect(source).toContain("Desactivar");
    expect(source).toContain("Activar");
    expect(source).toContain("DESACTIVADO");
    expect(source).toContain("Nenhuma mesa em atendimento.");
  });
});
