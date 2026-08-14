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

  describe("caso especial: diametroDestino = 25cm usa ceil() en vez de round()", () => {
    it("con huevos: cuando round() y ceil() ya coincidían (parte fraccionaria >= 0.5), el resultado no cambia", () => {
      // R = 10, R_t = 12.5 -> factorGeometrico = 156.25/100 = 1.5625
      // round(1 * 1.5625) = 2, ceil(1 * 1.5625) = 2 -> coinciden, factor = 2/1 = 2
      expect(calcularFactorEscalado(20, 25, 1)).toBe(2);
    });

    it("con huevos: usa ceil() en vez de round() cuando difieren (parte fraccionaria < 0.5)", () => {
      // R = 6, R_t = 12.5 -> factorGeometrico = 156.25/36 ≈ 4.3403
      // round(1 * 4.3403) = 4, pero ceil(1 * 4.3403) = 5 -> difieren
      // factor = ceil(H * factorGeometrico) / H = 5 / 1 = 5 (ya no 4)
      expect(calcularFactorEscalado(12, 25, 1)).toBe(5);
    });

    it("con huevos: destinos 12/18/20/22 siguen usando round() sin cambios", () => {
      // factor geométrico = 2.25; H * factor = 4.5 -> round -> 5; factor huevo = 5/2 = 2.5
      // (mismo resultado que antes de agregar el caso especial de destino=25)
      expect(calcularFactorEscalado(12, 18, 2)).toBe(2.5);
    });
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

describe("calcularCantidadesEscaladas: opciones.menosCapaEn12", () => {
  it("menosCapaEn12: aplica un factor adicional de 2/3 al escalar a 12cm desde otro diámetro base", () => {
    const resultado = calcularCantidadesEscaladas(
      [
        { id: "harina", cantidad: 121 },
        { id: "azucar", cantidad: 242 },
      ],
      22,
      12,
      { menosCapaEn12: true },
    );

    // factorGeometrico(22 -> 12) = R_t^2/R^2 = 6^2/11^2 = 36/121
    // factorFinal = (36/121) * (2/3) = 24/121
    // harina: 121 * 24/121 = 24 (equivalente a 121 * 36/121 = 36, luego 36 * 2/3 = 24)
    // azucar: 242 * 24/121 = 48
    expect(resultado).toEqual([
      { id: "harina", cantidad: 24 },
      { id: "azucar", cantidad: 48 },
    ]);
  });

  it("menosCapaEn12: NO aplica la corrección si diametroBase ya es 12cm (caso identidad)", () => {
    const resultado = calcularCantidadesEscaladas(
      [
        { id: "harina", cantidad: 100 },
        { id: "azucar", cantidad: 50 },
      ],
      12,
      12,
      { menosCapaEn12: true },
    );

    // diametroBase === diametroDestino === 12: la guarda "diametroBase !== 12" evita
    // aplicar el 2/3 sobre una receta que ya está cargada con sus capas reales a 12cm.
    // El resultado debe ser exactamente igual a las cantidades de entrada.
    expect(resultado).toEqual([
      { id: "harina", cantidad: 100 },
      { id: "azucar", cantidad: 50 },
    ]);
  });

  it("menosCapaEn12: NO aplica la corrección si diametroDestino no es 12cm", () => {
    const resultado = calcularCantidadesEscaladas([{ id: "harina", cantidad: 121 }], 22, 18, {
      menosCapaEn12: true,
    });

    // factorGeometrico(22 -> 18) = 9^2/11^2 = 81/121; 121 * 81/121 = 81
    // La corrección solo dispara cuando diametroDestino === 12, así que el factor
    // queda sin modificar aunque menosCapaEn12 esté en true.
    expect(resultado).toEqual([{ id: "harina", cantidad: 81 }]);
  });

  it("sin opciones (llamado con los mismos 3 args de siempre): comportamiento idéntico al de antes de este cambio", () => {
    const resultado = calcularCantidadesEscaladas([{ id: "harina", cantidad: 121 }], 22, 12);

    // Sin opciones, opciones?.menosCapaEn12 es undefined -> factorCapaMenos = 1, factor
    // geométrico puro sin corrección. 121 * 36/121 = 36 (no 24, que sería con la corrección).
    expect(resultado).toEqual([{ id: "harina", cantidad: 36 }]);
  });

  it("menosCapaEn12 + huevos: el 2/3 se aplica sobre el factor ya ajustado por redondeo de huevos, a todos los insumos", () => {
    const resultado = calcularCantidadesEscaladas(
      [
        { id: "harina", cantidad: 90 },
        { id: "huevo", cantidad: 3, esHuevo: true },
        { id: "azucar", cantidad: 45 },
      ],
      22,
      12,
      { menosCapaEn12: true },
    );

    // factorGeometrico(22 -> 12) = 36/121 ≈ 0.297521
    // H = 3: H * factorGeometrico = 3 * 36/121 = 108/121 ≈ 0.892562 -> round -> 1
    // factor huevo (sin la corrección de capas) = 1/3 ≈ 0.333333
    // factorFinal = (1/3) * (2/3) = 2/9 ≈ 0.222222
    // harina: 90 * 2/9 = 20
    // huevo: 3 * 2/9 = 0.6666... (la corrección de capas rompe el entero de huevos que
    //   había dejado el redondeo: con una capa menos, se necesita menos de la cantidad
    //   "entera" de huevos que calculó el redondeo)
    // azucar: 45 * 2/9 = 10
    expect(resultado).toEqual([
      { id: "harina", cantidad: 20 },
      { id: "huevo", cantidad: 0.6666666666666666 },
      { id: "azucar", cantidad: 10 },
    ]);
  });
});
