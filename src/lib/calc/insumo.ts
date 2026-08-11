import type { Unidad } from "@/db/schema";

/**
 * Precio unitario base de un insumo. Ver proyecto.md, sección "Insumos":
 * "Precio unitario calculado en la unidad de medida base (ml, g o unidad) →
 * precio_compra / cantidad_comprada normalizado a la unidad base."
 *
 * Ejemplo (proyecto.md): se compran 1kg de harina a $2000 → precio unitario
 * base = $2/g.
 */

/**
 * Calcula el precio unitario base de un insumo, en su unidad base (g, ml o
 * unidad — 'kg' se normaliza a gramos, x1000, porque no existe unidad base
 * "kg").
 */
export function calcularPrecioUnitarioBase(
  cantidadComprada: number,
  unidad: Unidad,
  precioCompra: number,
): number {
  if (unidad === "kg") {
    return precioCompra / (cantidadComprada * 1000);
  }

  return precioCompra / cantidadComprada;
}
