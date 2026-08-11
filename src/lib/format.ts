/**
 * Formateo compartido de UI. Moneda ARS (proyecto.md, sección "Imágenes y
 * moneda").
 */

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});

export function formatARS(value: number): string {
  return arsFormatter.format(value);
}
