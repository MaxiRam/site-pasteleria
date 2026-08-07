import { describe, expect, it } from "vitest";
import { calcularCantidadesEscaladas, calcularFactorEscalado } from "./escalado";

describe("calcularFactorEscalado", () => {
  it("sin huevos: factor = R_t^2 / R^2 (12cm -> 18cm)", () => {
    // R = 6, R_t = 9 -> factor = 81/36 = 2.25 (exacto)
    expect(calcularFactorEscalado(12, 18)).toBe(2.25);
  });

  it("sin huevos: diámetro destino igual al base da factor 1", () => {
    expect(calcularFactorEscalado(20, 20)).toBe(1);
  });

  it("con huevos: aplica redondeo de huevos sobre el factor geométrico (12cm -> 18cm, H=2)", () => {
    // factor geométrico = 2.25; H * factor = 4.5 -> round -> 5; factor huevo = 5/2 = 2.5
    expect(calcularFactorEscalado(12, 18, 2)).toBe(2.5);
  });

  it("con huevos: cantidadHuevosBase inválida (<=0) lanza error", () => {
    expect(() => calcularFactorEscalado(12, 18, 0)).toThrow();
    expect(() => calcularFactorEscalado(12, 18, -3)).toThrow();
  });
});

describe("calcularCantidadesEscaladas", () => {
  it("sin huevos: escala todos los insumos con el factor geométrico limpio", () => {
    const resultado = calcularCantidadesEscaladas(
      [
        { id: "harina", cantidad: 100 },
        { id: "azucar", cantidad: 50 },
      ],
      12,
      18,
    );

    expect(resultado).toEqual([
      { id: "harina", cantidad: 225 }, // 100 * 2.25
      { id: "azucar", cantidad: 112.5 }, // 50 * 2.25
    ]);
  });

  it("con huevos: el factor ajustado por redondeo de huevos se aplica a TODOS los insumos", () => {
    const resultado = calcularCantidadesEscaladas(
      [
        { id: "harina", cantidad: 100 },
        { id: "huevo", cantidad: 2, esHuevo: true },
        { id: "azucar", cantidad: 50 },
      ],
      12,
      18,
    );

    // factor con huevo redondeado = 2.5 (ver test de calcularFactorEscalado)
    expect(resultado).toEqual([
      { id: "harina", cantidad: 250 }, // 100 * 2.5, NO 225 (factor geométrico puro)
      { id: "huevo", cantidad: 5 }, // 2 * 2.5 = 5 huevos exactos, sin fracción
      { id: "azucar", cantidad: 125 }, // 50 * 2.5
    ]);
  });

  it("no infiere huevo por unidad: un insumo por 'unidad' que no es huevo (ej. packaging) no dispara redondeo", () => {
    // Sin esHuevo marcado, aunque haya un insumo medido por unidad (ej. una caja),
    // se usa el factor geométrico puro, no el de huevos.
    const resultado = calcularCantidadesEscaladas(
      [
        { id: "caja", cantidad: 1 }, // packaging medido en 'unidad', NO es huevo
        { id: "harina", cantidad: 100 },
      ],
      12,
      18,
    );

    expect(resultado).toEqual([
      { id: "caja", cantidad: 2.25 },
      { id: "harina", cantidad: 225 },
    ]);
  });

  it("lanza error si hay más de un insumo marcado como esHuevo", () => {
    expect(() =>
      calcularCantidadesEscaladas(
        [
          { id: "huevo1", cantidad: 2, esHuevo: true },
          { id: "huevo2", cantidad: 1, esHuevo: true },
        ],
        12,
        18,
      ),
    ).toThrow();
  });
});
