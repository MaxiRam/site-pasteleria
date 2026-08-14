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
  // Ver src/lib/calc/escalado.ts > calcularCantidadesEscaladas: opt-in por
  // receta, aplica un factor 2/3 extra al escalar a 12cm (una capa menos).
  menosCapaEn12: boolean;
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

async function getInsumosDeReceta(recetaId: number): Promise<RecetaInsumoConInsumo[]> {
  return db
    .select({
      insumoId: recetaInsumos.insumoId,
      cantidad: recetaInsumos.cantidad,
      esHuevo: recetaInsumos.esHuevo,
      insumo: insumos,
    })
    .from(recetaInsumos)
    .innerJoin(insumos, eq(recetaInsumos.insumoId, insumos.id))
    .where(eq(recetaInsumos.recetaId, recetaId));
}

/**
 * Crea la receta y sus receta_insumos en una única transacción. Si algo
 * falla a mitad de camino (ej. el índice único parcial de "un huevo por
 * receta", o una FK inválida), la transacción entera se revierte: no queda
 * una receta a medio insertar.
 */
export async function crearReceta(input: RecetaInput): Promise<RecetaConInsumos> {
  validarUnHuevo(input.insumos);

  const recetaId = await db.transaction(async (tx) => {
    // libSQL remoto ejecuta cada tx.execute() suelto en su propia conexión
    // lógica: el PRAGMA del módulo (src/db/index.ts) nunca llega a esta
    // transacción. Hay que activarlo de nuevo acá — una transacción SÍ es
    // una única conexión lógica, así que esto alcanza para toda ella. Acá
    // protege la FK de receta_insumos.insumo_id (evita insertar un
    // insumoId que no existe).
    await tx.run("PRAGMA foreign_keys = ON");

    const [receta] = await tx
      .insert(recetas)
      .values({
        nombre: normalizarNombre(input.nombre),
        diametroBase: input.diametroBase,
        menosCapaEn12: input.menosCapaEn12,
      })
      .returning();

    if (input.insumos.length > 0) {
      await tx.insert(recetaInsumos).values(
        input.insumos.map((i) => ({
          recetaId: receta.id,
          insumoId: i.insumoId,
          cantidad: i.cantidad,
          esHuevo: i.esHuevo,
        })),
      );
    }

    return receta.id;
  });

  const creada = await getRecetaById(recetaId);
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
export async function actualizarReceta(id: number, input: RecetaInput): Promise<RecetaConInsumos> {
  validarUnHuevo(input.insumos);

  const existente = await getRecetaById(id);
  if (!existente) {
    throw new Error(`No existe una receta con id ${id}.`);
  }

  await db.transaction(async (tx) => {
    // Ver comentario equivalente en crearReceta.
    await tx.run("PRAGMA foreign_keys = ON");

    await tx
      .update(recetas)
      .set({
        nombre: normalizarNombre(input.nombre),
        diametroBase: input.diametroBase,
        menosCapaEn12: input.menosCapaEn12,
      })
      .where(eq(recetas.id, id));

    await tx.delete(recetaInsumos).where(eq(recetaInsumos.recetaId, id));

    if (input.insumos.length > 0) {
      await tx.insert(recetaInsumos).values(
        input.insumos.map((i) => ({
          recetaId: id,
          insumoId: i.insumoId,
          cantidad: i.cantidad,
          esHuevo: i.esHuevo,
        })),
      );
    }
  });

  const actualizada = await getRecetaById(id);
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
 *
 * Envuelto en una transacción SOLO para poder activar
 * "PRAGMA foreign_keys = ON" antes del DELETE (ver comentario en
 * crearReceta) — sin esto, en libSQL remoto el DELETE no vería la FK y
 * borraría la receta igual aunque haya productos dependientes, dejándolos
 * con una referencia rota en vez de bloquear el borrado.
 */
export async function eliminarReceta(id: number): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.run("PRAGMA foreign_keys = ON");
    await tx.delete(recetas).where(eq(recetas.id, id));
  });
}

export async function getRecetaById(id: number): Promise<RecetaConInsumos | undefined> {
  const [receta] = await db.select().from(recetas).where(eq(recetas.id, id));
  if (!receta) {
    return undefined;
  }

  return { ...receta, insumos: await getInsumosDeReceta(receta.id) };
}

/**
 * Recetas ordenadas por nombre (mismo criterio que getInsumos()), cada una
 * con sus insumos ya resueltos: la lista de admin necesita mostrar "cantidad
 * de insumos" por receta, y no vale la pena una consulta aparte para eso
 * dado el volumen chico de datos de este proyecto.
 */
export async function getRecetas(): Promise<RecetaConInsumos[]> {
  const filas = await db.select().from(recetas).orderBy(recetas.nombre);
  return Promise.all(
    filas.map(async (receta) => ({ ...receta, insumos: await getInsumosDeReceta(receta.id) })),
  );
}
