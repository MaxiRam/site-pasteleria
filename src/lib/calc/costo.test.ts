import { describe, expect, it } from "vitest";
import { calcularCostoReceta } from "./costo";

describe("calcularCostoReceta", () => {
  it("suma cantidad x precioUnitarioBase de cada insumo", () => {
    const costo = calcularCostoReceta([
      { cantidad: 500, precioUnitarioBase: 2 }, // harina: 500g * $2/g = 1000
      { cantidad: 3, precioUnitarioBase: 50 }, // huevos: 3 * $50 = 150
    ]);

    expect(costo).toBe(1150);
  });

  it("lista vacía da costo 0", () => {
    expect(calcularCostoReceta([])).toBe(0);
  });

  it("costo 50 (regresión proyecto.md) puede alimentar directo a calcularPrecioSugerido", () => {
    const costo = calcularCostoReceta([{ cantidad: 25, precioUnitarioBase: 2 }]);
    expect(costo).toBe(50);
  });
});
