// Fuente única de la URL/token de la DB. Usado tanto por el cliente en
// runtime (src/db/index.ts) como por drizzle-kit (drizzle.config.ts), para
// que generate/migrate siempre apunten a la misma DB que usa la app.
//
// En local, DATABASE_URL es un archivo SQLite plano (ej. "file:./data/dev.db")
// y no hace falta DATABASE_AUTH_TOKEN. En producción (Turso), DATABASE_URL es
// "libsql://<db>.turso.io" y DATABASE_AUTH_TOKEN es obligatorio — el mismo
// cliente @libsql/client sirve para los dos casos, solo cambia la URL.
const ESQUEMAS_VALIDOS = ["file:", "libsql:", "http:", "https:", "ws:", "wss:"];

/**
 * @libsql/client rechaza un path pelado ("./data/dev.db", sin esquema) con
 * "URL_INVALID" en vez de asumir "file:" — pasó justo eso al copiar mal la
 * env var en Vercel (ver PR #16). Se normaliza acá para que un typo de
 * config rompa con un mensaje claro en vez de un URL_INVALID críptico, no
 * para fomentar paths pelados como forma válida de configurarlo.
 */
function normalizarDatabaseUrl(url: string): string {
  if (ESQUEMAS_VALIDOS.some((esquema) => url.startsWith(esquema))) {
    return url;
  }
  return `file:${url}`;
}

export const DATABASE_URL = normalizarDatabaseUrl(process.env.DATABASE_URL ?? "file:./data/dev.db");
export const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;
