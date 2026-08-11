import { eq } from "drizzle-orm";
import { db } from "./index";
import type { Insumo } from "./insumos";
import { insumos, recetaInsumos, recetas, type Diametro } from "./schema";

/**
 * Helpers de insert/update/delete/read de `recetas` + `receta_insumos`. Ver
 * proyecto.md, sección "Recetas".
 */

export type Receta = typeof recetas.$inferSelect;

/** Fila de receta_insumos "enriquecida" con el insumo completo (para poder
 * costear/mostrar nombre y precioUnitarioBase sin una segunda consulta). */
export interface RecetaInsumoConInsumo {
  insumoId: number;
  cantidad: number;
  esHuevo: boolean;
  insumo: Insumo;
}

export interface RecetaConInsumos extends Receta {
  insumos: RecetaInsumoConInsumo[];
}

export interface RecetaInput {
  nombre: string;
  diametroBase: Diametro;
  insumos: { insumoId: number; cantidad: number; esHuevo: boolean }[];
}

/**
 * Normaliza `nombre` (trim + lowercase), mismo criterio que insumos. Ver
 * proyecto.md, sección "Insumos" > "Normalización de nombre" (la sección de
 * Recetas no lo menciona explícitamente, pero el mismo razonamiento —evitar
 * duplicados por capitalización— aplica igual).
 */
function normalizarNombre(nombre: string): string {
  return nombre.trim().toLowerCase();
}

/**
 * Valida "a lo sumo un huevo por receta" en la capa de aplicación. El índice
 * único parcial `receta_insumos_una_receta_un_huevo` (src/db/schema.ts) ya
 * garantiza esto a nivel DB, pero fallar acá con un mensaje de negocio es
 * mejor UX que dejar propagar un error crudo de constraint de SQLite.
 */
function validarUnHuevo(items: RecetaInput["insumos"]): void {
  const huevos = items.filter((i) => i.esHuevo);
  if (huevos.length > 1) {
    throw new Error(
      "Una receta puede tener a lo sumo un insumo marcado como huevo (esHuevo: true).",
    );
  }
}

function getInsumosDeReceta(recetaId: number): RecetaInsumoConInsumo[] {
  return db
    .select({
      insumoId: recetaInsumos.insumoId,
      cantidad: recetaInsumos.cantidad,
      esHuevo: recetaInsumos.esHuevo,
      insumo: insumos,
    })
    .from(recetaInsumos)
    .innerJoin(insumos, eq(recetaInsumos.insumoId, insumos.id))
    .where(eq(recetaInsumos.recetaId, recetaId))
    .all();
}

function reemplazarInsumosDeReceta(recetaId: number, items: RecetaInput["insumos"]): void {
  db.delete(recetaInsumos).where(eq(recetaInsumos.recetaId, recetaId)).run();

  if (items.length === 0) {
    return;
  }

  db.insert(recetaInsumos)
    .values(
      items.map((i) => ({
        recetaId,
        insumoId: i.insumoId,
        cantidad: i.cantidad,
        esHuevo: i.esHuevo,
      })),
    )
    .run();
}

/**
 * Crea la receta y sus receta_insumos en una única transacción (better-sqlite3
 * soporta transacciones sync). Si algo falla a mitad de camino (ej. el
 * índice único parcial de "un huevo por receta", o una FK inválida), la
 * transacción entera se revierte: no queda una receta a medio insertar.
 */
export function crearReceta(input: RecetaInput): RecetaConInsumos {
  validarUnHuevo(input.insumos);

  const recetaId = db.transaction((tx) => {
    const receta = tx
      .insert(recetas)
      .values({
        nombre: normalizarNombre(input.nombre),
        diametroBase: input.diametroBase,
      })
      .returning()
      .get();

    if (input.insumos.length > 0) {
      tx.insert(recetaInsumos)
        .values(
          input.insumos.map((i) => ({
            recetaId: receta.id,
            insumoId: i.insumoId,
            cantidad: i.cantidad,
            esHuevo: i.esHuevo,
          })),
        )
        .run();
    }

    return receta.id;
  });

  const creada = getRecetaById(recetaId);
  if (!creada) {
    throw new Error(`No se pudo leer la receta recién creada (id ${recetaId}).`);
  }
  return creada;
}

/**
 * Actualiza la fila de receta y reemplaza por completo las filas de
 * receta_insumos asociadas (delete + insert). Más simple que un diff fila
 * por fila, y el volumen de insumos por receta es chico.
 */
export function actualizarReceta(id: number, input: RecetaInput): RecetaConInsumos {
  validarUnHuevo(input.insumos);

  const existente = db.select().from(recetas).where(eq(recetas.id, id)).get();
  if (!existente) {
    throw new Error(`No existe una receta con id ${id}.`);
  }

  db.transaction((tx) => {
    tx.update(recetas)
      .set({
        nombre: normalizarNombre(input.nombre),
        diametroBase: input.diametroBase,
      })
      .where(eq(recetas.id, id))
      .run();

    tx.delete(recetaInsumos).where(eq(recetaInsumos.recetaId, id)).run();

    if (input.insumos.length > 0) {
      tx.insert(recetaInsumos)
        .values(
          input.insumos.map((i) => ({
            recetaId: id,
            insumoId: i.insumoId,
            cantidad: i.cantidad,
            esHuevo: i.esHuevo,
          })),
        )
        .run();
    }
  });

  const actualizada = getRecetaById(id);
  if (!actualizada) {
    throw new Error(`No se pudo leer la receta actualizada (id ${id}).`);
  }
  return actualizada;
}

/**
 * PENDIENTE (ver comentario en src/db/schema.ts sobre `productos.recetaId`):
 * sin onDelete cascade a propósito. Si hay productos usando esta receta, el
 * DELETE falla con un error crudo de FK constraint de SQLite; se deja
 * propagar tal cual — es responsabilidad de la capa de Server Actions
 * traducirlo a un mensaje de negocio antes de mostrarlo al admin.
 */
export function eliminarReceta(id: number): void {
  db.delete(recetas).where(eq(recetas.id, id)).run();
}

export function getRecetaById(id: number): RecetaConInsumos | undefined {
  const receta = db.select().from(recetas).where(eq(recetas.id, id)).get();
  if (!receta) {
    return undefined;
  }

  return { ...receta, insumos: getInsumosDeReceta(receta.id) };
}

/**
 * Recetas ordenadas por nombre (mismo criterio que getInsumos()), cada una
 * con sus insumos ya resueltos: la lista de admin necesita mostrar "cantidad
 * de insumos" por receta, y no vale la pena una consulta aparte para eso
 * dado el volumen chico de datos de este proyecto.
 */
export function getRecetas(): RecetaConInsumos[] {
  const filas = db.select().from(recetas).orderBy(recetas.nombre).all();
  return filas.map((receta) => ({ ...receta, insumos: getInsumosDeReceta(receta.id) }));
}
