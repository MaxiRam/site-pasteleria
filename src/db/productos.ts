import { eq } from "drizzle-orm";
import { db } from "./index";
import { setPackagingDeProductoTx } from "./producto-insumos";
import type { Receta } from "./recetas";
import { productos, recetas } from "./schema";

/**
 * Helpers de insert/update/delete/read de `productos`. Ver proyecto.md,
 * sección "4. Productos / Catálogo público".
 *
 * `productos.recetaId` no tiene onDelete cascade (ver comentario en
 * src/db/schema.ts): eso es responsabilidad del lado de recetas.ts
 * (eliminarReceta falla si hay productos dependientes). Del lado de
 * productos no hay nada especial que hacer al respecto.
 */

export type Producto = typeof productos.$inferSelect;

/** Producto con su receta asociada ya resuelta (para mostrar el nombre de
 * la receta en la lista de admin sin una segunda consulta por fila). */
export interface ProductoConReceta extends Producto {
  receta: Receta;
}

export interface ProductoInput {
  nombrePublico: string;
  descripcion: string | null;
  recetaId: number;
  publicado: boolean;
  // Packaging asignado al producto (tabla producto_insumos, ver
  // src/db/producto-insumos.ts). A diferencia de los insumos de una receta,
  // puede ser una lista vacía: no todo producto necesita packaging.
  packaging: { insumoId: number; cantidad: number }[];
}

/**
 * A diferencia de `insumos.nombre` / `recetas.nombre` (identificadores
 * internos de catálogo que se normalizan a lowercase para evitar duplicados
 * por capitalización, ver proyecto.md sección "Insumos"), `nombrePublico` es
 * texto de cara al cliente final: el admin probablemente lo quiera con
 * mayúsculas/formato propio ("Torta de Chocolate"). No tiene sentido
 * "deduplicar" nombres públicos por capitalización — dos productos
 * distintos podrían compartir nombre igual, y forzar lowercase solo
 * arruinaría el formato que el admin eligió a propósito. Por eso acá solo
 * hacemos trim, sin lowercase.
 */
function normalizarNombrePublico(nombrePublico: string): string {
  return nombrePublico.trim();
}

/** Descripción es opcional: un string vacío (o solo espacios) se guarda como
 * null en vez de como "" para no tener dos representaciones distintas de
 * "sin descripción". */
function normalizarDescripcion(descripcion: string | null): string | null {
  if (descripcion === null) {
    return null;
  }
  const trimmed = descripcion.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getProductoConRecetaById(id: number): ProductoConReceta | undefined {
  const fila = db
    .select({ producto: productos, receta: recetas })
    .from(productos)
    .innerJoin(recetas, eq(productos.recetaId, recetas.id))
    .where(eq(productos.id, id))
    .get();

  if (!fila) {
    return undefined;
  }
  return { ...fila.producto, receta: fila.receta };
}

/**
 * Insert del producto y su packaging en una sola transacción: si el
 * packaging es inválido (insumo inexistente o no-packaging, ver
 * setPackagingDeProductoTx), todo se revierte — no queda un producto a
 * medio crear sin su packaging, que además duplicaría al reintentar.
 */
export function crearProducto(input: ProductoInput): ProductoConReceta {
  const productoId = db.transaction((tx) => {
    const producto = tx
      .insert(productos)
      .values({
        recetaId: input.recetaId,
        nombrePublico: normalizarNombrePublico(input.nombrePublico),
        descripcion: normalizarDescripcion(input.descripcion),
        publicado: input.publicado,
      })
      .returning()
      .get();

    setPackagingDeProductoTx(tx, producto.id, input.packaging);

    return producto.id;
  });

  const creado = getProductoConRecetaById(productoId);
  if (!creado) {
    throw new Error(`No se pudo leer el producto recién creado (id ${productoId}).`);
  }
  return creado;
}

/** Mismo criterio transaccional que crearProducto: update + packaging juntos. */
export function actualizarProducto(id: number, input: ProductoInput): ProductoConReceta {
  const existente = db.select().from(productos).where(eq(productos.id, id)).get();
  if (!existente) {
    throw new Error(`No existe un producto con id ${id}.`);
  }

  db.transaction((tx) => {
    tx.update(productos)
      .set({
        recetaId: input.recetaId,
        nombrePublico: normalizarNombrePublico(input.nombrePublico),
        descripcion: normalizarDescripcion(input.descripcion),
        publicado: input.publicado,
      })
      .where(eq(productos.id, id))
      .run();

    setPackagingDeProductoTx(tx, id, input.packaging);
  });

  const actualizado = getProductoConRecetaById(id);
  if (!actualizado) {
    throw new Error(`No se pudo leer el producto actualizado (id ${id}).`);
  }
  return actualizado;
}

/**
 * `precios.productoId` SÍ tiene onDelete cascade (ver src/db/schema.ts): a
 * diferencia de eliminarReceta, este delete no falla nunca por FK
 * constraint — borra en cascada las filas de precios asociadas sin
 * necesidad de manejo de error especial acá. La advertencia al admin de que
 * eso va a pasar es responsabilidad de la UI (confirm() antes de enviar el
 * delete), no de esta capa.
 */
export function eliminarProducto(id: number): void {
  db.delete(productos).where(eq(productos.id, id)).run();
}

export function getProductoById(id: number): ProductoConReceta | undefined {
  return getProductoConRecetaById(id);
}

/** Productos ordenados por nombre público (mismo criterio que
 * insumos/recetas), cada uno con su receta ya resuelta. */
export function getProductos(): ProductoConReceta[] {
  const filas = db
    .select({ producto: productos, receta: recetas })
    .from(productos)
    .innerJoin(recetas, eq(productos.recetaId, recetas.id))
    .orderBy(productos.nombrePublico)
    .all();

  return filas.map((f) => ({ ...f.producto, receta: f.receta }));
}
