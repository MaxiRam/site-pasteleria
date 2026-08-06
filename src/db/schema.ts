import { sql } from "drizzle-orm";
import {
  check,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
  unique,
} from "drizzle-orm/sqlite-core";

/**
 * Schema SQLite (Drizzle ORM) para el negocio de pastelería.
 * Ver proyecto.md para el modelo de datos de referencia.
 *
 * Este archivo solo define estructura de datos. Cualquier cálculo
 * (escalado de recetas, costos, precios sugeridos) vive en el
 * agente calc-engine, no aquí.
 */

export const UNIDADES = ["ml", "g", "kg", "unidad"] as const;
export type Unidad = (typeof UNIDADES)[number];

export const DIAMETROS = [12, 18, 20, 22, 25] as const;
export type Diametro = (typeof DIAMETROS)[number];

// --- Insumos ---------------------------------------------------------------

export const insumos = sqliteTable(
  "insumos",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nombre: text("nombre").notNull(),
    cantidadComprada: real("cantidad_comprada").notNull(),
    // Unidad de compra. 'kg' se normaliza a gramos (x1000) en precioUnitarioBase;
    // 'ml' | 'g' | 'unidad' son ya su propia unidad base.
    unidad: text("unidad").notNull().$type<Unidad>(),
    precioCompra: real("precio_compra").notNull(),
    // Precio por unidad base (g, ml o unidad según corresponda). Calculado por
    // calc-engine a partir de precioCompra / cantidadComprada (con la
    // conversión x1000 cuando unidad = 'kg'); se persiste para no
    // recalcularlo en cada lectura.
    precioUnitarioBase: real("precio_unitario_base").notNull(),
  },
  (t) => [check("insumos_unidad_check", sql`${t.unidad} in ('ml','g','kg','unidad')`)],
);

// --- Recetas ---------------------------------------------------------------

export const recetas = sqliteTable(
  "recetas",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    nombre: text("nombre").notNull(),
    // Diámetro (cm) para el que están cargadas las cantidades de receta_insumos.
    diametroBase: integer("diametro_base").notNull().$type<Diametro>(),
  },
  (t) => [
    check("recetas_diametro_base_check", sql`${t.diametroBase} in (12,18,20,22,25)`),
  ],
);

// --- Receta <-> Insumos (N:M con cantidad) ---------------------------------

export const recetaInsumos = sqliteTable(
  "receta_insumos",
  {
    recetaId: integer("receta_id")
      .notNull()
      .references(() => recetas.id, { onDelete: "cascade" }),
    insumoId: integer("insumo_id")
      .notNull()
      .references(() => insumos.id, { onDelete: "cascade" }),
    // Cantidad en la unidad base del insumo (ver insumos.unidad), a diametroBase.
    cantidad: real("cantidad").notNull(),
  },
  (t) => [primaryKey({ columns: [t.recetaId, t.insumoId] })],
);

// --- Productos (vitrina pública de una receta) -----------------------------

export const productos = sqliteTable("productos", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // Sin onDelete cascade a propósito: borrar una receta con productos
  // asociados debe fallar en vez de arrastrar productos silenciosamente.
  // PENDIENTE (admin-ui-builder): hoy ese fallo es un error crudo de SQLite
  // (FOREIGN KEY constraint failed); antes de borrar una receta desde la UI,
  // chequear productos dependientes y mostrar un mensaje de negocio claro.
  recetaId: integer("receta_id")
    .notNull()
    .references(() => recetas.id),
  nombrePublico: text("nombre_publico").notNull(),
  descripcion: text("descripcion"),
  // Ruta/URL de la imagen. Null hasta que exista upload propio; el frontend
  // debe mostrar un placeholder en ese caso.
  imagen: text("imagen"),
  publicado: integer("publicado", { mode: "boolean" }).notNull().default(false),
});

// --- Precios (por producto + diámetro) -------------------------------------

export const precios = sqliteTable(
  "precios",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productoId: integer("producto_id")
      .notNull()
      .references(() => productos.id, { onDelete: "cascade" }),
    diametro: integer("diametro").notNull().$type<Diametro>(),
    costoCalculado: real("costo_calculado").notNull(),
    // Porcentaje de margen real (sobre precio de venta). Default sugerido por
    // diámetro (12cm=0.70, 18cm=0.60, resto=0.50) es responsabilidad de
    // calc-engine al crear la fila; SQLite no permite defaults de columna que
    // dependan de otra columna, por eso no se modela como DEFAULT aquí.
    margenPct: real("margen_pct").notNull(),
    precioSugerido: real("precio_sugerido").notNull(),
    precioVenta: real("precio_venta"),
    // Regla de negocio: un producto+diámetro solo es visible en el catálogo
    // público cuando confirmado = true.
    confirmado: integer("confirmado", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [
    check("precios_diametro_check", sql`${t.diametro} in (12,18,20,22,25)`),
    unique("precios_producto_diametro_unique").on(t.productoId, t.diametro),
  ],
);

// --- Admins -----------------------------------------------------------------

export const admins = sqliteTable("admins", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
});
