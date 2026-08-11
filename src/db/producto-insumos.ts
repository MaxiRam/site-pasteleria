import { and, eq, inArray } from "drizzle-orm";
import { db } from "./index";
import type { Insumo } from "./insumos";
import { insumos, productoInsumos, type Diametro } from "./schema";

/**
 * Helpers de insert/update/delete/read de `producto_insumos` (packaging
 * asignado a un producto — DISTINTO por diámetro, ver comentario en
 * schema.ts: una torta de 12cm puede llevar una caja distinta que una de
 * 25cm). Ver proyecto.md, sección "1. Insumos" (packaging) y "4. Productos".
 *
 * NO confundir con receta_insumos / src/db/recetas.ts: receta_insumos son
 * los ingredientes de una receta (se escalan por diámetro con la fórmula de
 * escalado, ver src/lib/calc/escalado.ts); producto_insumos es el packaging
 * asignado directamente a un producto+diámetro, que nunca pasa por esa
 * fórmula de escalado (ver src/db/precios.ts >
 * calcularCostoProductoEnDiametro) — la cantidad guardada para cada
 * diámetro es la cantidad final, tal cual.
 */

/** Fila de producto_insumos "enriquecida" con el insumo completo (mismo
 * patrón que RecetaInsumoConInsumo en src/db/recetas.ts). */
export interface ProductoInsumoConInsumo {
  insumoId: number;
  cantidad: number;
  insumo: Insumo;
}

export function getPackagingDeProducto(
  productoId: number,
  diametro: Diametro,
): ProductoInsumoConInsumo[] {
  return db
    .select({
      insumoId: productoInsumos.insumoId,
      cantidad: productoInsumos.cantidad,
      insumo: insumos,
    })
    .from(productoInsumos)
    .innerJoin(insumos, eq(productoInsumos.insumoId, insumos.id))
    .where(and(eq(productoInsumos.productoId, productoId), eq(productoInsumos.diametro, diametro)))
    .all();
}

/**
 * Reemplaza por completo el packaging de un producto para UN diámetro
 * puntual (delete + insert en una transacción, mismo patrón que
 * actualizarReceta con receta_insumos) — los otros diámetros del mismo
 * producto no se tocan. `items` puede ser una lista vacía: no todo
 * producto+diámetro necesita packaging asignado.
 *
 * Valida que cada insumoId corresponda a un insumo de tipo 'packaging'. Esta
 * regla cruza dos tablas (insumos.tipo y producto_insumos), así que no se
 * puede modelar como CHECK de SQLite (los CHECK solo ven columnas de la
 * propia fila/tabla) — vive acá, en la capa de aplicación, igual que
 * validarUnHuevo en recetas.ts vive en la capa de aplicación para su propia
 * regla de negocio.
 */
export function setPackagingDeProducto(
  productoId: number,
  diametro: Diametro,
  items: { insumoId: number; cantidad: number }[],
): void {
  db.transaction((tx) => {
    if (items.length > 0) {
      const insumoIds = items.map((i) => i.insumoId);
      const insumosUsados = tx
        .select()
        .from(insumos)
        .where(inArray(insumos.id, insumoIds))
        .all();
      const insumoPorId = new Map(insumosUsados.map((i) => [i.id, i]));

      for (const item of items) {
        const insumo = insumoPorId.get(item.insumoId);
        if (!insumo) {
          throw new Error(`No existe un insumo con id ${item.insumoId}.`);
        }
        if (insumo.tipo !== "packaging") {
          throw new Error(`El insumo "${insumo.nombre}" no es de tipo packaging.`);
        }
      }
    }

    tx.delete(productoInsumos)
      .where(and(eq(productoInsumos.productoId, productoId), eq(productoInsumos.diametro, diametro)))
      .run();

    if (items.length > 0) {
      tx.insert(productoInsumos)
        .values(
          items.map((i) => ({
            productoId,
            diametro,
            insumoId: i.insumoId,
            cantidad: i.cantidad,
          })),
        )
        .run();
    }
  });
}
