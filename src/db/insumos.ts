import { eq } from "drizzle-orm";
import { calcularPrecioUnitarioBase } from "@/lib/calc";
import { db } from "./index";
import {
  insumos,
  productoInsumos,
  productos,
  recetaInsumos,
  recetas,
  type TipoInsumo,
  type Unidad,
} from "./schema";

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
  tipo: TipoInsumo;
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
    tipo: input.tipo,
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

/**
 * PENDIENTE: no valida que cambiar `tipo` (ingrediente <-> packaging) sea
 * seguro para los usos existentes del insumo. Si un insumo usado en una
 * receta (receta_insumos) se reclasifica a 'packaging', el `<select>` de
 * insumos de esa receta (que solo lista tipo='ingrediente', ver
 * recetas/nuevo|editar/page.tsx) deja de incluirlo — la fila queda con un
 * `insumoId` que no matchea ningún `<option>`, lo que puede confundir al
 * admin o, si toca ese `<select>` sin querer, cambiar sin darse cuenta a
 * qué insumo apunta esa fila al guardar. No es una corrupción de cálculo
 * (calcularCostoReceta no le importa el tipo), es un riesgo de UX. Si esto
 * se vuelve un problema real, la fix más simple es bloquear el cambio de
 * tipo mientras el insumo esté en uso (mismo espíritu que eliminarReceta
 * bloqueando por productos dependientes).
 */
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
 * Insumos de un solo tipo ('ingrediente' o 'packaging'), ordenados por
 * nombre (mismo criterio que getInsumos() en src/db/index.ts). Usado para
 * poblar selects que solo deben ofrecer un tipo: recetas solo usan
 * ingredientes, el packaging de un producto solo usa insumos de tipo
 * packaging (ver proyecto.md y src/db/producto-insumos.ts).
 */
export function getInsumosPorTipo(tipo: TipoInsumo): Insumo[] {
  return db
    .select()
    .from(insumos)
    .where(eq(insumos.tipo, tipo))
    .orderBy(insumos.nombre)
    .all();
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
 * Nombres de los productos que tienen este insumo asignado como packaging
 * (tabla producto_insumos), para advertir antes de borrar (ver
 * eliminarInsumo) — mismo criterio que getRecetasQueUsanInsumo, pero para
 * la relación producto_insumos en vez de receta_insumos. La PK de
 * producto_insumos es (productoId, insumoId), así que a lo sumo una fila
 * por producto — no hace falta dedup.
 */
export function getProductosQueUsanPackaging(insumoId: number): string[] {
  return db
    .select({ nombre: productos.nombrePublico })
    .from(productoInsumos)
    .innerJoin(productos, eq(productoInsumos.productoId, productos.id))
    .where(eq(productoInsumos.insumoId, insumoId))
    .all()
    .map((r) => r.nombre);
}

/**
 * `receta_insumos.insumo_id` y `producto_insumos.insumo_id` tienen FK con
 * `onDelete: cascade` hacia `insumos` (ver src/db/schema.ts): borrar un
 * insumo en uso borra en cascada las filas de receta_insumos y/o
 * producto_insumos que lo usan, sacándolo silenciosamente de esas recetas
 * y/o productos. eliminarInsumo en sí no bloquea el borrado (mismo criterio
 * que eliminarProducto: la cascada es válida, solo hay que advertir antes)
 * — la advertencia combinada (recetas afectadas + productos afectados) vive
 * en la UI (ver insumos/page.tsx + delete-insumo-button.tsx), que usa
 * getRecetasQueUsanInsumo y getProductosQueUsanPackaging antes de mostrar
 * el confirm().
 */
export function eliminarInsumo(id: number): void {
  db.delete(insumos).where(eq(insumos.id, id)).run();
}
