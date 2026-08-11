/**
 * Módulo de cálculo puro (escalado de recetas y pricing por margen real).
 * Ver proyecto.md. Dueño exclusivo: agente calc-engine.
 *
 * Sin acceso a DB ni UI — el resto del código importa desde acá.
 */

export type { InsumoCantidadBase, InsumoCantidadEscalada } from "./escalado";
export { calcularFactorEscalado, calcularCantidadesEscaladas } from "./escalado";

export type { InsumoCosto } from "./costo";
export { calcularCostoReceta } from "./costo";

export { MARGEN_POR_DIAMETRO, calcularMargenReal, calcularPrecioSugerido } from "./pricing";

export { calcularPrecioUnitarioBase } from "./insumo";
