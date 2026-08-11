import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DB_PATH } from "./path";
import * as schema from "./schema";

// better-sqlite3 no crea el directorio padre si falta.
mkdirSync(dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });

// Helpers de acceso a datos mínimos, solo para validar el schema.
// Cualquier lógica de negocio (escalado, costos, precios) NO va aquí.
//
// getRecetas() vive en src/db/recetas.ts (junto con el resto del CRUD de
// recetas), no acá — ver ese archivo para el helper real.

export function getInsumos() {
  return db.select().from(schema.insumos).orderBy(schema.insumos.nombre).all();
}
