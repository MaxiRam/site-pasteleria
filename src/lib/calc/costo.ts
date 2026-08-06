/**
 * Costo de receta a partir de las cantidades (ya escaladas al diámetro que
 * corresponda) y el precio unitario base de cada insumo.
 * Ver proyecto.md, sección "Recetas": "Costo total de la receta = suma de
 * (cantidad insumo × precio unitario del insumo), calculado por diámetro."
 */

/** Insumo con la cantidad (en su unidad base) a costear y su precio unitario base. */
export interface InsumoCosto {
  /** Cantidad en la unidad base del insumo (típicamente ya escalada a un diámetro). */
  cantidad: number;
  /** Precio por unidad base del insumo (insumos.precioUnitarioBase). */
  precioUnitarioBase: number;
}

/**
 * Costo total de una receta: suma de (cantidad × precioUnitarioBase) de
 * cada insumo de la lista.
 */
export function calcularCostoReceta(insumos: InsumoCosto[]): number {
  return insumos.reduce((total, i) => total + i.cantidad * i.precioUnitarioBase, 0);
}
