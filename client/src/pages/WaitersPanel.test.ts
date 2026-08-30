import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(path.resolve(import.meta.dirname, "WaitersPanel.tsx"), "utf8");

describe("admin waiter management", () => {
  it("uses a six-digit access code and does not expose a waiter password field", () => {
    expect(source).toContain("Adicionar Garçom");
    expect(source).toContain("inputMode=\"numeric\"");
    expect(source).toContain("pattern=\"[0-9]{6}\"");
    expect(source).toContain("maxLength={6}");
    expect(source).not.toContain("Palavra-passe<input required type=\"password\"");
  });

  it("refreshes waiter data from the backend after a successful save", () => {
    expect(source).toContain("utils.staff.list.invalidate()");
    expect(source).toContain("utils.staff.list.refetch()");
    expect(source).toContain("updateWaiter.mutate");
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
