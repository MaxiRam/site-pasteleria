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

// La integración de Turso de Vercel inyecta las env vars con el nombre del
// proyecto como prefijo (site_pasteleria_TURSO_DATABASE_URL /
// site_pasteleria_TURSO_AUTH_TOKEN) en vez de DATABASE_URL/DATABASE_AUTH_TOKEN
// — se usan como fallback para no tener que renombrarlas a mano en el
// dashboard. En local (sin ninguna de las dos) cae al archivo default.
const urlConfigurada = process.env.DATABASE_URL ?? process.env.site_pasteleria_TURSO_DATABASE_URL;

/**
 * Solo un warning, no un throw: este módulo se evalúa también cuando
 * Next.js "recolecta datos de página" en build (hasta para rutas
 * force-dynamic, que nunca se prerenderizan) — un throw acá tumbaría el
 * build entero en Vercel aunque las env vars de Turso sí estén disponibles
 * en runtime real y todo funcione bien ahí. Si de verdad faltan en runtime,
 * la primera query real contra el fallback local va a fallar con su propio
 * error, en el momento correcto (una request, no el build).
 */
if (!urlConfigurada && process.env.VERCEL) {
  console.error(
    "Falta DATABASE_URL o site_pasteleria_TURSO_DATABASE_URL en las env vars de Vercel — " +
      "cayendo al archivo SQLite local (file:./data/dev.db), que no existe en este entorno. " +
      "Revisá Settings > Environment Variables en el proyecto de Vercel.",
  );
}

export const DATABASE_URL = normalizarDatabaseUrl(urlConfigurada ?? "file:./data/dev.db");
export const DATABASE_AUTH_TOKEN =
  process.env.DATABASE_AUTH_TOKEN ?? process.env.site_pasteleria_TURSO_AUTH_TOKEN;
