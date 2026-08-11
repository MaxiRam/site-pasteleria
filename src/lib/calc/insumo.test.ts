import { describe, expect, it } from "vitest";
import { calcularPrecioUnitarioBase } from "./insumo";

describe("calcularPrecioUnitarioBase", () => {
  it("1kg de harina a $2000 (regresión proyecto.md) → $2/g", () => {
    expect(calcularPrecioUnitarioBase(1, "kg", 2000)).toBe(2);
  });

  it("'unidad' usa la misma unidad como base (ej. 12 huevos a $600 → $50/unidad)", () => {
    expect(calcularPrecioUnitarioBase(12, "unidad", 600)).toBe(50);
  });

  it("'g' usa la misma unidad como base, sin conversión x1000", () => {
    expect(calcularPrecioUnitarioBase(500, "g", 1000)).toBe(2);
  });

  it("'ml' usa la misma unidad como base, sin conversión x1000", () => {
    expect(calcularPrecioUnitarioBase(250, "ml", 500)).toBe(2);
  });
});
