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
 *   Excepción: si `diametroDestino` es 25cm, se usa `ceil` en lugar de
 *   `round` (`factor = ceil(H * R_t^2 / R^2) / H`). A 25cm conviene
 *   redondear siempre para arriba en vez de al más cercano, para no
 *   quedarse corto de huevos en la torta más grande. Esto es un cambio
 *   fijo de la fórmula, no un flag: aplica siempre que se escale huevos
 *   a destino=25, sin importar el diámetro base.
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

  const huevosEscalados =
    diametroDestino === 25
      ? Math.ceil(cantidadHuevosBase * factorGeometrico)
      : Math.round(cantidadHuevosBase * factorGeometrico);

  return huevosEscalados / cantidadHuevosBase;
}

/**
 * Escala la lista completa de insumos de una receta desde diametroBase a
 * diametroDestino. Si algún ítem tiene `esHuevo: true`, su cantidad se usa
 * como H para el redondeo de huevos y el mismo factor resultante se aplica
 * a todos los insumos (incluido el propio huevo).
 *
 * `opciones.menosCapaEn12` (opt-in por receta, NO es un comportamiento
 * global): algunas recetas, al hornearse en 12cm, usan una capa menos que
 * en el resto de los tamaños (para que la torta no quede desproporcionada
 * de alta). En esos casos la torta real de 12cm usa solo 2/3 de lo que el
 * escalado geométrico puro calcularía, así que se aplica un factor
 * adicional de 2/3 por encima del factor ya calculado (geométrico o
 * ajustado por huevos, sin cambios).
 *
 * La corrección solo aplica cuando `diametroDestino === 12 &&
 * diametroBase !== 12`. La guarda `diametroBase !== 12` es clave: si la
 * receta está cargada justamente con base 12cm, lo que se ingresó ahí ya
 * refleja la cantidad real de capas que esa receta usa a 12cm. Ver/costear
 * la receta en su propio diámetro base siempre debe reproducir exactamente
 * lo que se cargó, sin volver a aplicarle la reducción encima. La
 * corrección solo tiene sentido cuando de verdad se está escalando DESDE
 * otro diámetro HACIA 12cm.
 */
export function calcularCantidadesEscaladas<TId>(
  insumos: InsumoCantidadBase<TId>[],
  diametroBase: Diametro,
  diametroDestino: Diametro,
  opciones?: { menosCapaEn12?: boolean },
): InsumoCantidadEscalada<TId>[] {
  const huevos = insumos.filter((i) => i.esHuevo);

  if (huevos.length > 1) {
    throw new Error(
      "Más de un insumo marcado con esHuevo: true en la misma receta; solo puede haber uno.",
    );
  }

  const huevo = huevos[0];
  const factor = calcularFactorEscalado(diametroBase, diametroDestino, huevo?.cantidad);

  const factorCapaMenos =
    diametroDestino === 12 && diametroBase !== 12 && opciones?.menosCapaEn12 ? 2 / 3 : 1;
  const factorFinal = factor * factorCapaMenos;

  return insumos.map((i) => ({ id: i.id, cantidad: i.cantidad * factorFinal }));
}
