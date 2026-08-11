import { describe, expect, it } from "vitest";
import { calcularMargenReal, calcularPrecioSugerido, MARGEN_POR_DIAMETRO } from "./pricing";

describe("MARGEN_POR_DIAMETRO", () => {
  it("tiene los márgenes default de proyecto.md", () => {
    expect(MARGEN_POR_DIAMETRO[12]).toBe(0.7);
    expect(MARGEN_POR_DIAMETRO[18]).toBe(0.6);
    expect(MARGEN_POR_DIAMETRO[20]).toBe(0.5);
    expect(MARGEN_POR_DIAMETRO[22]).toBe(0.5);
    expect(MARGEN_POR_DIAMETRO[25]).toBe(0.5);
  });
});

describe("calcularPrecioSugerido", () => {
  it("regresión exacta de proyecto.md: costo 50, margen 60% -> 125", () => {
    expect(calcularPrecioSugerido(50, 0.6)).toBe(125);
  });

  it("margen 0 devuelve el mismo costo", () => {
    expect(calcularPrecioSugerido(100, 0)).toBe(100);
  });

  it("margen >= 1 lanza error explícito", () => {
    expect(() => calcularPrecioSugerido(50, 1)).toThrow(/inválido/i);
    expect(() => calcularPrecioSugerido(50, 1.2)).toThrow(/inválido/i);
  });

  it("margen negativo lanza error explícito", () => {
    expect(() => calcularPrecioSugerido(50, -0.1)).toThrow(/inválido/i);
  });
});

describe("calcularMargenReal", () => {
  it("es la inversa exacta de calcularPrecioSugerido (regresión proyecto.md: costo 50, precio 125 -> 0.6)", () => {
    expect(calcularMargenReal(50, 125)).toBeCloseTo(0.6, 10);
  });

  it("precio de venta igual al costo da margen 0", () => {
    expect(calcularMargenReal(100, 100)).toBe(0);
  });

  it("precio de venta menor al costo da margen negativo (se vendió a pérdida)", () => {
    expect(calcularMargenReal(100, 80)).toBeCloseTo(-0.25, 10);
  });

  it("precio de venta <= 0 lanza error explícito", () => {
    expect(() => calcularMargenReal(50, 0)).toThrow(/inválido/i);
    expect(() => calcularMargenReal(50, -10)).toThrow(/inválido/i);
  });
});
