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

export function getInsumos() {
  return db.select().from(schema.insumos).all();
}

export function getRecetas() {
  return db.select().from(schema.recetas).all();
}
