import { eq } from "drizzle-orm";
import { db } from "./index";
import { getPackagingDeProducto } from "./producto-insumos";
import { getProductoById, type ProductoConReceta } from "./productos";
import { getRecetaById } from "./recetas";
import {
  calcularCantidadesEscaladas,
  calcularCostoReceta,
  calcularPrecioSugerido,
  MARGEN_POR_DIAMETRO,
} from "@/lib/calc";
import { DIAMETROS, precios, type Diametro } from "./schema";

/**
 * Helpers de insert/update/delete/read de `precios`. Ver proyecto.md,
 * sección "3. Precios".
 *
 * `precios` es la hoja del árbol (producto -> receta -> insumos, precio ->
 * producto): no tiene tablas dependientes, así que a diferencia de
 * recetas.ts/productos.ts no hace falta preocuparse por lo que pasa
 * "aguas abajo" al borrar.
 */

export type Precio = typeof precios.$inferSelect;

/** Precio con su producto (y la receta de ese producto) ya resueltos, para
 * poder mostrar el nombre público en listas sin una segunda consulta. */
export interface PrecioConProducto extends Precio {
  producto: ProductoConReceta;
}

export interface PrecioInput {
  productoId: number;
  diametro: Diametro;
  margenPct: number;
  precioVenta: number | null;
  confirmado: boolean;
}

/**
 * Costo de un producto a un diámetro dado: resuelve la receta del producto
 * y aplica el mismo patrón que
 * src/app/admin/(protected)/recetas/[id]/page.tsx (armar `insumosBase` con
 * `{id, cantidad, esHuevo}`, escalar con `calcularCantidadesEscaladas` desde
 * el `diametroBase` de la receta al `diametro` pedido, y costear el
 * resultado con `calcularCostoReceta` combinando con `precioUnitarioBase` de
 * cada insumo).
 *
 * Al costo de ingredientes (escalado por diámetro) se le suma el costo del
 * packaging asignado a ESTE producto+diámetro puntual (tabla
 * producto_insumos, ver src/db/producto-insumos.ts) — el packaging puede
 * ser distinto por tamaño (una torta de 12cm puede llevar una caja
 * distinta que una de 25cm), pero para el diámetro que sea, esa cantidad
 * nunca pasa por la fórmula de escalado geométrico: se costea directo con
 * calcularCostoReceta sobre las cantidades tal cual están guardadas para
 * ese diámetro, sin pasar por calcularCantidadesEscaladas.
 *
 * Es el corazón de crearPrecio/actualizarPrecio: el costo se recalcula
 * siempre a partir de este helper, nunca se confía en un valor persistido
 * viejo (los precios de insumos pueden haber cambiado desde la última vez).
 */
export function calcularCostoProductoEnDiametro(productoId: number, diametro: Diametro): number {
  const producto = getProductoById(productoId);
  if (!producto) {
    throw new Error(`No existe un producto con id ${productoId}.`);
  }

  const receta = getRecetaById(producto.recetaId);
  if (!receta) {
    throw new Error(
      `El producto "${producto.nombrePublico}" (id ${productoId}) referencia una receta ` +
        `inexistente (id ${producto.recetaId}).`,
    );
  }

  const insumosBase = receta.insumos.map((ri) => ({
    id: ri.insumoId,
    cantidad: ri.cantidad,
    esHuevo: ri.esHuevo,
  }));
  const insumoPorId = new Map(receta.insumos.map((ri) => [ri.insumoId, ri.insumo]));

  const escaladas = calcularCantidadesEscaladas(insumosBase, receta.diametroBase, diametro);

  const costoIngredientesEscalados = calcularCostoReceta(
    escaladas.map((e) => ({
      cantidad: e.cantidad,
      precioUnitarioBase: insumoPorId.get(e.id)!.precioUnitarioBase,
    })),
  );

  const packaging = getPackagingDeProducto(productoId, diametro);
  const costoPackagingSinEscalar = calcularCostoReceta(
    packaging.map((p) => ({
      cantidad: p.cantidad,
      precioUnitarioBase: p.insumo.precioUnitarioBase,
    })),
  );

  return costoIngredientesEscalados + costoPackagingSinEscalar;
}

function getPrecioConProductoById(id: number): PrecioConProducto | undefined {
  const precio = db.select().from(precios).where(eq(precios.id, id)).get();
  if (!precio) {
    return undefined;
  }

  const producto = getProductoById(precio.productoId);
  if (!producto) {
    throw new Error(`El precio ${id} referencia un producto inexistente (id ${precio.productoId}).`);
  }

  return { ...precio, producto };
}

/**
 * Calcula `costoCalculado` y `precioSugerido` e inserta. Si `input.margenPct`
 * es inválido (>= 1 o < 0), `calcularPrecioSugerido` lanza; se deja
 * propagar tal cual, la capa de Server Actions la traduce a mensaje de
 * negocio. Si ya existe un precio para ese producto+diámetro, el
 * `unique(productoId, diametro)` de src/db/schema.ts hace fallar el insert
 * con un error crudo de constraint de SQLite; también se deja propagar, la
 * capa de Server Actions lo traduce a "Ya existe un precio para este
 * producto en este diámetro".
 */
export function crearPrecio(input: PrecioInput): PrecioConProducto {
  const costoCalculado = calcularCostoProductoEnDiametro(input.productoId, input.diametro);
  const precioSugerido = calcularPrecioSugerido(costoCalculado, input.margenPct);

  const precio = db
    .insert(precios)
    .values({
      productoId: input.productoId,
      diametro: input.diametro,
      costoCalculado,
      margenPct: input.margenPct,
      precioSugerido,
      precioVenta: input.precioVenta,
      confirmado: input.confirmado,
    })
    .returning()
    .get();

  const creado = getPrecioConProductoById(precio.id);
  if (!creado) {
    throw new Error(`No se pudo leer el precio recién creado (id ${precio.id}).`);
  }
  return creado;
}

/**
 * Genera automáticamente los precios que le falten a un producto para
 * cubrir los 5 diámetros soportados (DIAMETROS) — evita que el admin tenga
 * que crear "Nuevo precio" a mano una vez por diámetro. Cada precio nuevo
 * usa el margen default de MARGEN_POR_DIAMETRO para ese diámetro,
 * `precioVenta: null` y `confirmado: false` (el admin los revisa/confirma
 * después desde la edición). Diámetros que ya tienen un precio para este
 * producto se dejan como están, no se pisan.
 *
 * Se llama automáticamente al crear un producto (ver
 * admin/(protected)/productos/actions.ts) y también está expuesta como
 * acción manual ("Generar precios") para productos que ya existían antes
 * de esa automatización.
 */
export function generarPreciosParaProducto(productoId: number): PrecioConProducto[] {
  const existentes = db
    .select({ diametro: precios.diametro })
    .from(precios)
    .where(eq(precios.productoId, productoId))
    .all();
  const diametrosExistentes = new Set(existentes.map((p) => p.diametro));

  const faltantes = DIAMETROS.filter((d) => !diametrosExistentes.has(d));

  return faltantes.map((diametro) =>
    crearPrecio({
      productoId,
      diametro,
      margenPct: MARGEN_POR_DIAMETRO[diametro],
      precioVenta: null,
      confirmado: false,
    }),
  );
}

/**
 * `productoId` y `diametro` no son editables una vez creado el precio (si el
 * admin quiere otro diámetro para el mismo producto, se crea un precio
 * nuevo — ver admin-ui-builder). Recalcula `costoCalculado` en cada edición
 * (los precios de insumos pueden haber cambiado desde que se creó/editó por
 * última vez este precio) y `precioSugerido` con el `margenPct` nuevo.
 */
export function actualizarPrecio(
  id: number,
  input: Omit<PrecioInput, "productoId" | "diametro">,
): PrecioConProducto {
  const existente = db.select().from(precios).where(eq(precios.id, id)).get();
  if (!existente) {
    throw new Error(`No existe un precio con id ${id}.`);
  }

  const costoCalculado = calcularCostoProductoEnDiametro(
    existente.productoId,
    existente.diametro,
  );
  const precioSugerido = calcularPrecioSugerido(costoCalculado, input.margenPct);

  db.update(precios)
    .set({
      costoCalculado,
      margenPct: input.margenPct,
      precioSugerido,
      precioVenta: input.precioVenta,
      confirmado: input.confirmado,
    })
    .where(eq(precios.id, id))
    .run();

  const actualizado = getPrecioConProductoById(id);
  if (!actualizado) {
    throw new Error(`No se pudo leer el precio actualizado (id ${id}).`);
  }
  return actualizado;
}

/** Sin cascada hacia nada: `precios` es la hoja del árbol. */
export function eliminarPrecio(id: number): void {
  db.delete(precios).where(eq(precios.id, id)).run();
}

export function getPrecioById(id: number): PrecioConProducto | undefined {
  return getPrecioConProductoById(id);
}

/** Precios ordenados por nombre público del producto y, dentro de un mismo
 * producto, por diámetro — mismo criterio de "ordenar por lo que ve el
 * admin" que getInsumos()/getRecetas()/getProductos(). El volumen de datos
 * de este proyecto es chico, así que resolver el producto de cada precio
 * con una consulta por fila (en vez de un join) no es un problema. */
export function getPrecios(): PrecioConProducto[] {
  const filas = db.select().from(precios).all();

  const conProducto = filas.map((precio) => {
    const producto = getProductoById(precio.productoId);
    if (!producto) {
      throw new Error(
        `El precio ${precio.id} referencia un producto inexistente (id ${precio.productoId}).`,
      );
    }
    return { ...precio, producto };
  });

  return conProducto.sort((a, b) => {
    const porNombre = a.producto.nombrePublico.localeCompare(b.producto.nombrePublico);
    return porNombre !== 0 ? porNombre : a.diametro - b.diametro;
  });
}
