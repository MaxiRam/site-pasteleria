// Fuente única del path de la DB SQLite. Usado tanto por el cliente en
// runtime (src/db/index.ts) como por drizzle-kit (drizzle.config.ts), para
// que generate/migrate siempre apunten a la misma DB que usa la app.
export const DB_PATH = process.env.DATABASE_URL ?? "./data/dev.db";
