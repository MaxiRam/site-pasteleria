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

/**
 * Busca una env var por su nombre exacto y, si no está, por sufijo.
 *
 * La integración de Turso de Vercel inyecta las env vars con el nombre del
 * proyecto como prefijo (site_pasteleria_TURSO_DATABASE_URL /
 * site_pasteleria_TURSO_AUTH_TOKEN) en vez de
 * DATABASE_URL/DATABASE_AUTH_TOKEN. Se busca por sufijo en vez de hardcodear
 * ese prefijo para que renombrar el proyecto en Vercel no haga caer la
 * config al archivo local en silencio.
 *
 * Se ignoran los valores vacíos (no solo los ausentes): una env var definida
 * pero en blanco en el dashboard de Vercel tiene que comportarse igual que
 * una que no está, no colarse como URL válida.
 */
function envPorNombreOSufijo(
  nombre: string,
  sufijo: string,
): { valor: string; origen: string } | undefined {
  const directo = process.env[nombre];
  if (directo) {
    return { valor: directo, origen: nombre };
  }

  const clave = Object.keys(process.env).find((k) => k.endsWith(sufijo) && process.env[k]);
  return clave ? { valor: process.env[clave]!, origen: clave } : undefined;
}

const urlConfigurada = envPorNombreOSufijo("DATABASE_URL", "_TURSO_DATABASE_URL");

/**
 * Nombre de la env var de la que salió DATABASE_URL, o `null` si se cayó al
 * archivo local por default. Sirve para que el error de config diga cuál
 * env var hay que corregir en vez de un genérico "revisá la config" — el
 * caso real que motivó esto fue una `DATABASE_URL=./data/dev.db` vieja que
 * quedó en el dashboard de Vercel y le ganaba a la que inyecta la
 * integración de Turso.
 *
 * La validación de "esto no puede pasar en producción" NO vive acá: este
 * módulo se evalúa también cuando Next.js "recolecta datos de página" en
 * build (hasta para rutas force-dynamic, que nunca se prerenderizan), y un
 * throw a nivel módulo tumbaría el build entero. Se valida en
 * src/db/index.ts > getDb(), que es lazy y solo corre en una request real.
 */
export const DATABASE_URL_ORIGEN = urlConfigurada?.origen ?? null;

export const DATABASE_URL = normalizarDatabaseUrl(urlConfigurada?.valor ?? "file:./data/dev.db");
export const DATABASE_AUTH_TOKEN = envPorNombreOSufijo(
  "DATABASE_AUTH_TOKEN",
  "_TURSO_AUTH_TOKEN",
)?.valor;
