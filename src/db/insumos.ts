import { eq } from "drizzle-orm";
import { calcularPrecioUnitarioBase } from "@/lib/calc";
import { db } from "./index";
import { insumos, recetaInsumos, recetas, type Unidad } from "./schema";

/**
 * Helpers de insert/update/delete de `insumos`. Ver proyecto.md, sección
 * "Insumos", y .claude/agents/db-schema.md (pendiente de normalización de
 * nombre).
 */

export type Insumo = typeof insumos.$inferSelect;

export interface InsumoInput {
  nombre: string;
  cantidadComprada: number;
  unidad: Unidad;
  precioCompra: number;
}

/**
 * Normaliza `nombre` (trim + lowercase) para no crear filas duplicadas por
 * distinta capitalización del mismo insumo ("Harina" vs "harina" vs
 * "HARINA"). Ver proyecto.md, sección "Insumos" > "Normalización de
 * nombre".
 */
function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase();
}

function conPrecioUnitarioBase(input: InsumoInput) {
  return {
    nombre: normalizarNombre(input.nombre),
    cantidadComprada: input.cantidadComprada,
    unidad: input.unidad,
    precioCompra: input.precioCompra,
    precioUnitarioBase: calcularPrecioUnitarioBase(
      input.cantidadComprada,
      input.unidad,
      input.precioCompra,
    ),
  };
}

export function crearInsumo(input: InsumoInput): Insumo {
  return db.insert(insumos).values(conPrecioUnitarioBase(input)).returning().get();
}

export function actualizarInsumo(id: number, input: InsumoInput): Insumo {
  const existente = db.select().from(insumos).where(eq(insumos.id, id)).get();
  if (!existente) {
    throw new Error(`No existe un insumo con id ${id}.`);
  }

  return db
    .update(insumos)
    .set(conPrecioUnitarioBase(input))
    .where(eq(insumos.id, id))
    .returning()
    .get();
}

export function getInsumoById(id: number): Insumo | undefined {
  return db.select().from(insumos).where(eq(insumos.id, id)).get();
}

/**
 * Nombres de las recetas que usan este insumo (para advertir antes de
 * borrar, ver eliminarInsumo). Puede haber más de una fila de
 * receta_insumos por receta... en realidad no, la PK de receta_insumos es
 * (recetaId, insumoId), así que a lo sumo una fila por receta — no hace
 * falta dedup.
 */
export function getRecetasQueUsanInsumo(insumoId: number): string[] {
  return db
    .select({ nombre: recetas.nombre })
    .from(recetaInsumos)
    .innerJoin(recetas, eq(recetaInsumos.recetaId, recetas.id))
    .where(eq(recetaInsumos.insumoId, insumoId))
    .all()
    .map((r) => r.nombre);
}

/**
 * `receta_insumos.insumo_id` tiene FK con `onDelete: cascade` hacia
 * `insumos` (ver src/db/schema.ts): borrar un insumo en uso borra en
 * cascada las filas de receta_insumos que lo usan, sacándolo
 * silenciosamente de esas recetas. eliminarInsumo en sí no bloquea el
 * borrado (mismo criterio que eliminarProducto: la cascada es válida,
 * solo hay que advertir antes) — la advertencia con las recetas afectadas
 * vive en la UI (ver insumos/page.tsx + delete-insumo-button.tsx), que usa
 * getRecetasQueUsanInsumo antes de mostrar el confirm().
 */
export function eliminarInsumo(id: number): void {
  db.delete(insumos).where(eq(insumos.id, id)).run();
}
