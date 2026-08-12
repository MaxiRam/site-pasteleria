// Fuente única de la URL/token de la DB. Usado tanto por el cliente en
// runtime (src/db/index.ts) como por drizzle-kit (drizzle.config.ts), para
// que generate/migrate siempre apunten a la misma DB que usa la app.
//
// En local, DATABASE_URL es un archivo SQLite plano (ej. "file:./data/dev.db")
// y no hace falta DATABASE_AUTH_TOKEN. En producción (Turso), DATABASE_URL es
// "libsql://<db>.turso.io" y DATABASE_AUTH_TOKEN es obligatorio — el mismo
// cliente @libsql/client sirve para los dos casos, solo cambia la URL.
export const DATABASE_URL = process.env.DATABASE_URL ?? "file:./data/dev.db";
export const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;
