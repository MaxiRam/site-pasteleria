import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DATABASE_AUTH_TOKEN, DATABASE_URL } from "./path";
import * as schema from "./schema";

// @libsql/client no crea el directorio padre si falta (solo aplica a
// DATABASE_URL local tipo "file:./data/dev.db"; en Turso remoto esto es un
// no-op porque la URL no empieza con "file:").
if (DATABASE_URL.startsWith("file:")) {
  mkdirSync(dirname(DATABASE_URL.slice("file:".length)), { recursive: true });
}

const client = createClient({
  url: DATABASE_URL,
  authToken: DATABASE_AUTH_TOKEN,
});

// Sin await a propósito (top-level await rompe bajo tsx/esbuild en CJS, ver
// scripts/seed-admin.ts). Esto solo sirve para DATABASE_URL local ("file:"):
// ahí @libsql/client mantiene una sola conexión real y esto alcanza.
//
// NO alcanza para libSQL remoto (Turso, "libsql://"): la doc de
// @libsql/client dice explícitamente que "every statement executed with
// [client.execute()] runs in its own logical database connection" — un
// PRAGMA seteado acá nunca le llega a otro execute() suelto posterior, así
// que en producción esto es casi un no-op. Por eso cada operación que
// depende de foreign_keys=ON (cascadas, o que un delete bloqueado por FK
// tire error) activa el PRAGMA de nuevo dentro de su propia
// db.transaction() — una transacción SÍ es una única conexión lógica. Ver
// crearReceta/actualizarReceta/eliminarReceta en recetas.ts, eliminarInsumo
// en insumos.ts, eliminarProducto en productos.ts y setPackagingDeProducto
// en producto-insumos.ts.
client.execute("PRAGMA foreign_keys = ON").catch((err) => {
  console.error("No se pudo activar PRAGMA foreign_keys (solo relevante en local):", err);
});

export const db = drizzle(client, { schema });

// Helpers de acceso a datos mínimos, solo para validar el schema.
// Cualquier lógica de negocio (escalado, costos, precios) NO va aquí.
//
// getRecetas() vive en src/db/recetas.ts (junto con el resto del CRUD de
// recetas), no acá — ver ese archivo para el helper real.

export async function getInsumos() {
  return db.select().from(schema.insumos).orderBy(schema.insumos.nombre);
}
