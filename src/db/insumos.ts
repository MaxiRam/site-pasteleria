import { eq } from "drizzle-orm";
import { calcularPrecioUnitarioBase } from "@/lib/calc";
import { db } from "./index";
import { insumos, type Unidad } from "./schema";

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
 * PENDIENTE (revisar cuando exista UI de Recetas): `receta_insumos.insumo_id`
 * tiene FK con `onDelete: cascade` hacia `insumos` (ver src/db/schema.ts), así
 * que borrar un insumo en uso borra silenciosamente las filas de
 * receta_insumos que lo usan. Sin UI de Recetas todavía no hay forma de
 * advertir al admin de ese impacto (similar al pendiente ya documentado para
 * productos.receta_id); cuando exista, conviene chequear uso previo y
 * advertir antes de borrar en vez de dejarlo pasar en silencio como ahora.
 */
export function eliminarInsumo(id: number): void {
  db.delete(insumos).where(eq(insumos.id, id)).run();
}
