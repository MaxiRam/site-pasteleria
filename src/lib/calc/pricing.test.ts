import { describe, expect, it } from "vitest";
import { calcularPrecioSugerido, MARGEN_POR_DIAMETRO } from "./pricing";

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
