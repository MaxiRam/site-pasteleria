import type { Diametro } from "@/db/schema";

/**
 * Pricing por margen real. Ver proyecto.md, sección "Precios".
 *
 * "Margen real" es margen sobre el precio de venta (no markup sobre costo):
 * `precio_sugerido = costo / (1 - margen%)`.
 * Ejemplo de regresión (proyecto.md): costo 50, margen 60% → precio 125.
 */

/** Margen default por diámetro, editable por el admin (proyecto.md). */
export const MARGEN_POR_DIAMETRO: Record<Diametro, number> = {
  12: 0.7,
  18: 0.6,
  20: 0.5,
  22: 0.5,
  25: 0.5,
};

/**
 * Precio sugerido = costo / (1 - margenPct).
 *
 * margenPct se espera en el rango [0, 1). Un margen >= 100% (>= 1) o
 * negativo no es válido para esta fórmula: en >=1 el denominador es <= 0,
 * lo que da un precio infinito o negativo (matemáticamente sin sentido
 * como "margen real"). En vez de devolver Infinity/NaN/negativo en
 * silencio, se lanza un error explícito para que el caller lo detecte
 * apenas ocurra, en vez de propagar un precio corrupto hasta la UI.
 */
export function calcularPrecioSugerido(costo: number, margenPct: number): number {
  if (margenPct >= 1 || margenPct < 0) {
    throw new Error(
      `Margen inválido: ${margenPct}. Debe estar en el rango [0, 1) — un margen >= 100% ` +
        "es inválido matemáticamente para la fórmula costo / (1 - margen) " +
        "(denominador <= 0).",
    );
  }

  return costo / (1 - margenPct);
}
