import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DATABASE_AUTH_TOKEN, DATABASE_URL, DATABASE_URL_ORIGEN } from "./path";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let dbInstance: Db | undefined;

/**
 * Todo lo de acá adentro (mkdir, abrir la conexión, el PRAGMA) es lazy a
 * propósito: Next.js evalúa este módulo (import de arriba a abajo) al
 * "recolectar datos de página" en build, hasta para rutas force-dynamic que
 * nunca se prerenderizan — y ese paso corre en un entorno de solo lectura en
 * Vercel. `createClient` para DATABASE_URL local ("file:...") abre la
 * conexión al archivo de forma síncrona en el momento en que se llama, así
 * que si esto corriera a nivel módulo (como antes), tumbaba el build entero
 * con un error de mkdir/conexión aunque en runtime real (con DATABASE_URL
 * apuntando a Turso) nunca se llega a este código. Con el Proxy de más
 * abajo, nada de esto corre hasta el primer uso real de `db` — que solo
 * pasa dentro de una request real, nunca durante el build.
 */
function getDb(): Db {
  if (dbInstance) {
    return dbInstance;
  }

  const esArchivoLocal = DATABASE_URL.startsWith("file:");

  // Fail-fast con mensaje claro. Acá sí se puede tirar: getDb() es lazy, así
  // que esto solo corre en una request real, nunca durante el build (ver
  // comentario de arriba).
  //
  // Una DB en archivo local nunca sirve en Vercel: el filesystem es de solo
  // lectura y no persiste entre invocaciones. Se chequea la URL resuelta, no
  // solo si la env var falta, porque el caso real que rompió producción fue
  // una `DATABASE_URL=./data/dev.db` vieja que quedó en el dashboard y le
  // ganaba a la que inyecta la integración de Turso — la env var estaba, con
  // el valor equivocado, así que un chequeo de "¿está definida?" no lo veía.
  if (esArchivoLocal && process.env.VERCEL) {
    const origen =
      DATABASE_URL_ORIGEN === null
        ? "no hay ninguna env var de base de datos definida, así que se usó el default local"
        : `viene de la env var ${DATABASE_URL_ORIGEN}`;
    throw new Error(
      `La base de datos apunta a un archivo local (${DATABASE_URL}) — ${origen}. ` +
        "En Vercel el filesystem es de solo lectura y no persiste, así que hace falta " +
        "una URL remota de Turso (libsql://<db>.turso.io). En Settings > Environment " +
        "Variables del proyecto: borrá cualquier DATABASE_URL que apunte a un archivo " +
        "(le gana a la que inyecta la integración de Turso) y asegurate de que la " +
        "integración esté conectada a este environment. Ojo que una env var definida " +
        "pero vacía cuenta como faltante.",
    );
  }

  if (esArchivoLocal) {
    try {
      mkdirSync(dirname(DATABASE_URL.slice("file:".length)), { recursive: true });
    } catch (err) {
      // Fuera de Vercel esto puede ser recuperable (ej. el archivo ya existe
      // y solo falla el mkdir del padre), así que se loguea y se sigue: si
      // de verdad no se puede abrir, createClient tira abajo con su error.
      console.error("No se pudo crear el directorio de la DB local:", err);
    }
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

  dbInstance = drizzle(client, { schema });
  return dbInstance;
}

// Proxy en vez de exportar `getDb()` directamente: todo el resto del código
// (38+ call sites en src/db/*.ts) usa `db.select()/.insert()/.transaction()`
// como si fuera el objeto real — este Proxy reenvía cada acceso a la
// instancia real, creándola recién en el primer acceso.
//
// Los métodos se devuelven bindeados a la instancia real a propósito. Sin el
// bind, `db.select()` corre con `this` = Proxy, y como el target es un `{}`
// vacío sin trap de getPrototypeOf, `this instanceof ...` y
// `Object.getPrototypeOf(this).constructor` (que es justo lo que usa `is()`
// de drizzle, ver node_modules/drizzle-orm/entity.cjs) darían mal. Hoy
// drizzle no hace ninguna de las dos cosas en el camino de sqlite-core /
// libsql, pero un upgrade que las agregue rompería en silencio.
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = getDb();
    const valor = Reflect.get(real, prop);
    return typeof valor === "function" ? valor.bind(real) : valor;
  },
});

// Helpers de acceso a datos mínimos, solo para validar el schema.
// Cualquier lógica de negocio (escalado, costos, precios) NO va aquí.
//
// getRecetas() vive en src/db/recetas.ts (junto con el resto del CRUD de
// recetas), no acá — ver ese archivo para el helper real.

export async function getInsumos() {
  return db.select().from(schema.insumos).orderBy(schema.insumos.nombre);
}
