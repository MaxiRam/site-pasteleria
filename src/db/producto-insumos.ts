import { eq, inArray } from "drizzle-orm";
import { db } from "./index";
import type { Insumo } from "./insumos";
import { insumos, productoInsumos } from "./schema";

/**
 * Helpers de insert/update/delete/read de `producto_insumos` (packaging
 * asignado a un producto). Ver proyecto.md, sección "1. Insumos" (packaging)
 * y "4. Productos".
 *
 * NO confundir con receta_insumos / src/db/recetas.ts: receta_insumos son
 * los ingredientes de una receta (se escalan por diámetro, ver
 * src/lib/calc/escalado.ts); producto_insumos es el packaging asignado
 * directamente a un producto, que nunca se escala (ver
 * src/db/precios.ts > calcularCostoProductoEnDiametro). Son dos relaciones
 * N:M distintas, con tablas y reglas de negocio distintas.
 */

/** Fila de producto_insumos "enriquecida" con el insumo completo (mismo
 * patrón que RecetaInsumoConInsumo en src/db/recetas.ts). */
export interface ProductoInsumoConInsumo {
  insumoId: number;
  cantidad: number;
  insumo: Insumo;
}

export function getPackagingDeProducto(productoId: number): ProductoInsumoConInsumo[] {
  return db
    .select({
      insumoId: productoInsumos.insumoId,
      cantidad: productoInsumos.cantidad,
      insumo: insumos,
    })
    .from(productoInsumos)
    .innerJoin(insumos, eq(productoInsumos.insumoId, insumos.id))
    .where(eq(productoInsumos.productoId, productoId))
    .all();
}

/** Handle de DB o de transacción — mismo shape que `db`, inferido de su
 * propia firma para no depender de tipos internos de drizzle-orm. Permite
 * que setPackagingDeProductoTx corra tanto suelto (con `db`) como anidado
 * dentro de una transacción más grande (con el `tx` de esa transacción). */
type DbOrTx = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

/**
 * Igual que setPackagingDeProducto, pero sin abrir su propia transacción —
 * para poder llamarla dentro de la transacción de crearProducto/
 * actualizarProducto (src/db/productos.ts) y que el insert/update del
 * producto y su packaging vivan o mueran juntos. Si esto se ejecutara en
 * una transacción separada y el packaging fuera inválido (insumo
 * inexistente o no-packaging), quedaría un producto a medio crear/
 * actualizar sin su packaging, sin ninguna forma de que el admin lo note
 * más que reintentando y creando un duplicado.
 */
function setPackagingDeProductoTx(
  tx: DbOrTx,
  productoId: number,
  items: { insumoId: number; cantidad: number }[],
): void {
  if (items.length > 0) {
    const insumoIds = items.map((i) => i.insumoId);
    const insumosUsados = tx.select().from(insumos).where(inArray(insumos.id, insumoIds)).all();
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

  tx.delete(productoInsumos).where(eq(productoInsumos.productoId, productoId)).run();

  if (items.length > 0) {
    tx.insert(productoInsumos)
      .values(
        items.map((i) => ({
          productoId,
          insumoId: i.insumoId,
          cantidad: i.cantidad,
        })),
      )
      .run();
  }
}

/**
 * Reemplaza por completo el packaging asignado a un producto (delete +
 * insert en una transacción), mismo patrón que actualizarReceta con
 * receta_insumos en src/db/recetas.ts. A diferencia de receta_insumos, acá
 * `items` puede ser una lista vacía: no todo producto necesita packaging
 * asignado (ver proyecto.md).
 *
 * Valida que cada insumoId corresponda a un insumo de tipo 'packaging'. Esta
 * regla cruza dos tablas (insumos.tipo y producto_insumos), así que no se
 * puede modelar como CHECK de SQLite (los CHECK solo ven columnas de la
 * propia fila/tabla) — vive acá, en la capa de aplicación, igual que
 * validarUnHuevo en recetas.ts vive en la capa de aplicación para su propia
 * regla de negocio.
 *
 * Uso standalone (fuera de una transacción ya abierta). Para usar dentro de
 * la transacción de crearProducto/actualizarProducto, ver
 * setPackagingDeProductoTx (exportada más abajo para ese caso puntual).
 */
export function setPackagingDeProducto(
  productoId: number,
  items: { insumoId: number; cantidad: number }[],
): void {
  db.transaction((tx) => setPackagingDeProductoTx(tx, productoId, items));
}

export { setPackagingDeProductoTx };
