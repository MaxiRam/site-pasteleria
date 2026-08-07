import type { Diametro } from "@/db/schema";

/**
 * Escalado de cantidades de insumos entre diámetros de torta.
 * Ver proyecto.md, sección "Recetas" > "Escalado por tamaño".
 *
 * Módulo puro: sin acceso a DB ni UI. El caller (quien conoce el catálogo
 * de insumos, ej. admin-ui-builder) es responsable de indicar qué insumo
 * de la receta es el huevo.
 */

/**
 * Decisión de diseño (huevo vs. unidad === 'unidad'):
 *
 * proyecto.md describe el caso especial como "si la receta tiene huevos
 * (insumo medido en unidades)". Pero en src/db/schema.ts la unidad
 * `'unidad'` también se usa para packaging (cajas, moldes, bandejas, etc.)
 * que NO son huevos y no deben disparar el redondeo especial.
 *
 * Inferir "es huevo" a partir de `unidad === 'unidad'` (o peor, del nombre
 * del insumo) sería frágil: se rompería con cualquier otro insumo por
 * unidad en la receta, y le daría a este módulo de cálculo puro
 * conocimiento implícito del catálogo de insumos, que no es su
 * responsabilidad.
 *
 * En cambio, calc-engine no adivina: el caller marca explícitamente cuál
 * insumo de la lista es el huevo (campo `esHuevo` por ítem). Si ninguno
 * está marcado, se aplica el factor general (sin redondeo). Si hay más
 * de uno marcado, es un error de uso del caller (una receta no puede
 * tener dos insumos "huevo").
 */

/** Insumo de receta con su cantidad en la unidad base, a diametroBase. */
export interface InsumoCantidadBase<TId = number> {
  /** Identificador del insumo (lo que use el caller, típicamente insumoId). */
  id: TId;
  /** Cantidad en la unidad base del insumo, en la receta cargada a diametroBase. */
  cantidad: number;
  /**
   * Marca explícita del caller: este ítem es el/los huevo(s) de la receta.
   * A lo sumo un ítem de la lista puede tener esHuevo = true.
   */
  esHuevo?: boolean;
}

/** Insumo con su cantidad ya escalada al diámetro destino. */
export interface InsumoCantidadEscalada<TId = number> {
  id: TId;
  cantidad: number;
}

/**
 * Calcula el factor de escalado entre un diámetro base y uno destino.
 *
 * - `cantidadHuevosBase` ausente (undefined) → receta sin huevos:
 *   `factor = R_t^2 / R^2`.
 * - `cantidadHuevosBase` = H (cantidad de huevos en la receta base) →
 *   `factor = round(H * R_t^2 / R^2) / H`, de forma que `H * factor` sea
 *   siempre un entero (no hay fracciones de huevo).
 */
export function calcularFactorEscalado(
  diametroBase: Diametro,
  diametroDestino: Diametro,
  cantidadHuevosBase?: number,
): number {
  const R = diametroBase / 2;
  const Rt = diametroDestino / 2;
  const factorGeometrico = (Rt * Rt) / (R * R);

  if (cantidadHuevosBase === undefined) {
    return factorGeometrico;
  }

  if (!(cantidadHuevosBase > 0)) {
    throw new Error(
      `cantidadHuevosBase inválida: ${cantidadHuevosBase}. Debe ser un número mayor a 0.`,
    );
  }

  return Math.round(cantidadHuevosBase * factorGeometrico) / cantidadHuevosBase;
}

/**
 * Escala la lista completa de insumos de una receta desde diametroBase a
 * diametroDestino. Si algún ítem tiene `esHuevo: true`, su cantidad se usa
 * como H para el redondeo de huevos y el mismo factor resultante se aplica
 * a todos los insumos (incluido el propio huevo).
 */
export function calcularCantidadesEscaladas<TId>(
  insumos: InsumoCantidadBase<TId>[],
  diametroBase: Diametro,
  diametroDestino: Diametro,
): InsumoCantidadEscalada<TId>[] {
  const huevos = insumos.filter((i) => i.esHuevo);

  if (huevos.length > 1) {
    throw new Error(
      "Más de un insumo marcado con esHuevo: true en la misma receta; solo puede haber uno.",
    );
  }

  const huevo = huevos[0];
  const factor = calcularFactorEscalado(diametroBase, diametroDestino, huevo?.cantidad);

  return insumos.map((i) => ({ id: i.id, cantidad: i.cantidad * factor }));
}
