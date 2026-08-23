import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "WaitersPanel.tsx"), "utf8");

describe("admin waiter management", () => {
  it("exposes Supabase Auth waiter onboarding without photos", () => {
    expect(source).toContain("Adicionar Garçom");
    expect(source).toContain("type=\"password\"");
    expect(source).toContain("type=\"email\"");
    expect(source).toContain("Supabase");
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
    expect(source).toContain("INACTIVO");
    expect(source).toContain("Nenhuma mesa em atendimento.");
  });

  it("exposes a confirmed delete action without deleting history", () => {
    expect(source).toContain("Apagar garçom");
    expect(source).toContain("O histórico será preservado");
    expect(source).toContain("deleteWaiter.mutate({ id: garcon.id })");
  });
});
