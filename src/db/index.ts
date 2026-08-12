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

// Sin await a propósito: @libsql/client serializa los statements de un mismo
// cliente en el orden en que se llaman (misma conexión), así que este PRAGMA
// se ejecuta antes que cualquier query posterior sin bloquear la carga del
// módulo con un top-level await (que rompe bajo tsx/esbuild en CJS, ver
// scripts/seed-admin.ts y scripts/_smoke-*.ts).
client.execute("PRAGMA foreign_keys = ON").catch((err) => {
  console.error("No se pudo activar PRAGMA foreign_keys:", err);
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
