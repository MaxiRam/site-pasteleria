## Objetivo

Crear un sitio de administración de un negocio familiar de pastelería.

## Resumen

Sitio con dos interfaces:

- **Admin**: gestión completa de insumos, recetas, precios y catálogo de productos. **Implementado.**
- **Usuario (público)**: catálogo/menú de productos visible sin login. **Pendiente** (no arrancado todavía).

## Stack técnico

- **Framework**: Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- **Estilos**: Tailwind CSS v4 + [shadcn/ui](https://ui.shadcn.com) (preset `base-nova`,
  sobre [Base UI](https://base-ui.com) — no Radix). Íconos: `lucide-react`. Los
  componentes viven copiados en `src/components/ui/`.
- **Base de datos**: SQLite vía [Turso](https://turso.tech)/libSQL (`@libsql/client` +
  `drizzle-orm/libsql`). Local: archivo plano (`file:./data/dev.db`, sin
  `DATABASE_AUTH_TOKEN`). Producción: instancia remota Turso
  (`libsql://<db>.turso.io` + `DATABASE_AUTH_TOKEN`) — necesario porque el
  filesystem de Vercel es de solo lectura en runtime y no persiste entre
  invocaciones, así que un archivo SQLite local no sirve ahí. Todo el acceso a
  datos (`src/db/*.ts`) es async (el driver libSQL no tiene modo síncrono para
  conexiones remotas). Migraciones versionadas en `migrations/`
  (`npm run db:generate` / `db:migrate`).
- **Auth**: email + password propio (roles: `admin`, y público sin auth). Hash con
  `scrypt` (`node:crypto`, sin dependencia nativa extra). Sesión: cookie httpOnly
  firmada HMAC-SHA256, sin tabla de sessions. `src/proxy.ts` protege todo `/admin/*`
  excepto `/admin/login`.
- **Tests**: Vitest, para el módulo de cálculo puro (`src/lib/calc/`).

## Roles

| Rol | Acceso |
|---|---|
| Admin | Login requerido. Único admin del negocio, creado vía `scripts/seed-admin.ts` (sin flujo de signup). Acceso a todas las secciones de administración. |
| Público (sin login) | Pendiente: va a ver solo el catálogo de productos publicados y con precio confirmado. |

## Secciones de Administración

Todas viven bajo `src/app/admin/(protected)/`, con nav compartido en `layout.tsx`. Cada sección sigue el mismo patrón: lista (Server Component) + alta/edición (Server Action con validación server-side) + borrado con `confirm()` client-side.

### 1. Insumos

Dos tipos, con pestañas en la UI (`/admin/insumos?tipo=ingrediente|packaging`):

- **Ingrediente**: entra en recetas, se escala por diámetro.
- **Packaging**: se asigna a un producto **por diámetro** (no al producto en general — ver sección Precios), nunca se escala.

Cada insumo registra:
- Nombre (normalizado a lowercase al persistir, para no duplicar "Harina" vs "harina" vs "HARINA")
- Tipo (`ingrediente` | `packaging`)
- Cantidad comprada (con unidad: ml, g, kg, unidad — **packaging solo puede ser `unidad`**, forzado por CHECK en DB + validación + el form solo ofrece esa opción cuando el tipo es packaging)
- Precio de compra
- **Precio unitario calculado** en la unidad de medida base (ml, g o unidad) → `precio_compra / cantidad_comprada` normalizado a la unidad base

Ejemplo: se compran 1kg de harina a $2000 → precio unitario base = $2/g.

Borrar un insumo en uso (en una receta, o como packaging de un producto) lo saca en cascada de esos usos — el `confirm()` de borrado avisa cuántas recetas y/o productos se ven afectados antes de confirmar.

**Pendiente conocido**: cambiar el `tipo` de un insumo ya en uso puede desincronizar el picker correspondiente (el `<select>` de una receta o de un packaging deja de listar un insumo que cambió de tipo). No corrompe ningún cálculo, es un riesgo de UX — ver comentario en `src/db/insumos.ts` > `actualizarInsumo`.

### 2. Recetas

Cada receta define:
- Nombre (normalizado a lowercase, mismo criterio que insumos)
- Diámetro base para el que se cargan los insumos (uno de: **12cm, 18cm, 20cm, 22cm, 25cm**)
- Lista de insumos **de tipo ingrediente** con cantidad (en la unidad base de cada insumo) — el picker de la receta no ofrece insumos de packaging
- A lo sumo un insumo marcado como huevo (`esHuevo`), con índice único parcial a nivel DB además del guard de aplicación

**Escalado por tamaño**: a partir de la receta cargada para un diámetro, el sistema calcula automáticamente las cantidades equivalentes para los demás diámetros. Fórmula (en `src/lib/calc/escalado.ts`): sea `D` el diámetro cargado, `R = D/2`; `D_t` el diámetro destino, `R_t = D_t/2`.
- Con huevos (cantidad `H` en la receta base): `factor_escalado = round(H * (R_t^2 / R^2)) / H`
- Sin huevos: `factor_escalado = R_t^2 / R^2`
- Cantidad escalada de cada insumo = `cantidad_base * factor_escalado`

Costo de la receta a un diámetro = suma de (cantidad escalada × precio unitario base del insumo).

**Vista de detalle** (`/admin/recetas/[id]`): segmented control (5 botones, uno por diámetro) — elige un tamaño a la vez y muestra sus ingredientes escalados + costo. No es un slider: se descartó por el relleno de accent-color del navegador y porque 5 valores discretos no es lo que un slider continuo modela mejor.

### 3. Precios

Uno por combinación producto + diámetro. **Se generan automáticamente** (los 5 diámetros) al crear un producto, con el margen default de cada diámetro — ya no hace falta "Nuevo precio" a mano. Para productos creados antes de esa automatización, "Generar precios" en `/admin/productos` hace el mismo backfill (solo genera los diámetros faltantes).

- **Margen real** (sobre precio de venta, no sobre costo): `precio_sugerido = costo / (1 - margen%)`. Ejemplo: costo $50, margen 60% → precio sugerido = 50 / 0.4 = **$125**.
- **Margen por diámetro** (default al generar, editable después): 12cm=70%, 18cm=60%, 20/22/25cm=50%.
- **Costo calculado** = costo de ingredientes de la receta (escalado a ese diámetro) + costo del packaging asignado a **ese producto+diámetro puntual** (sin escalar — ver sección Insumos/Productos). Se recalcula siempre al guardar, nunca se confía en un valor persistido viejo.
- **Margen real efectivo**: si hay precio de venta y está confirmado, se muestra entre paréntesis junto al precio de venta (`calcularMargenReal`, inversa de la fórmula de precio sugerido).
- **Edición inline en la lista** (`/admin/precios`, sin ir a una página aparte): margen (con stepper ±1%, botones arriba/abajo a la izquierda del número), precio de venta, y confirmado (toggle, no checkbox) — todo en un solo submit por fila.
- **Packaging por diámetro**: ícono de caja en cada fila lleva a `/admin/precios/[id]/packaging`, donde se asignan los insumos de packaging (con cantidad) para ESE producto+diámetro puntual. Guardar recalcula el costo/precio sugerido de ese precio.
- **Regla de visibilidad pública**: un producto+diámetro solo aparece en el catálogo del cliente si el producto está `publicado` **y** ese precio está `confirmado`.

### 4. Productos

- Vincula una receta con nombre público, descripción y flag de publicado.
- El packaging **no se asigna acá** (se movió a Precios, porque el packaging es por diámetro — ver sección 3).
- Imagen: placeholder fijo hasta que exista upload propio (no implementado).

## Interfaz Usuario (público)

**Pendiente, no implementado.** Catálogo de productos publicados y con al menos un precio confirmado: nombre, imagen (placeholder), descripción, precio, tamaños disponibles. Sin login, sin carrito/pedidos (fuera de scope por ahora).

## Modelo de datos (actual, ver `src/db/schema.ts`)

```
Insumo
  id, nombre, cantidad_comprada, unidad, precio_compra, precio_unitario_base, tipo

Receta
  id, nombre, diametro_base

RecetaInsumo
  receta_id, insumo_id, cantidad (en unidad base), es_huevo

Producto
  id, receta_id, nombre_publico, descripcion, imagen, publicado

ProductoInsumo (packaging por producto+diámetro)
  producto_id, insumo_id, diametro, cantidad

Precio
  id, producto_id, diametro, costo_calculado, margen_pct, precio_sugerido, precio_venta, confirmado

Admin
  id, email, password_hash
```

## Imágenes y moneda

- **Moneda**: ARS (peso argentino).
- **Imágenes de productos**: upload propio. Hasta implementar el upload, usar placeholder.

## Deploy (Vercel + Turso)

El `buildCommand` de `vercel.json` corre, en orden:

```
npm run db:migrate && npm run db:seed && npm run build
```

- **Migraciones automáticas en cada deploy.** Son idempotentes (drizzle lleva
  registro en `__drizzle_migrations`), así que redeployar no reaplica nada. Si una
  migración falla, el `&&` corta y el deploy se cae **antes** del build: nunca queda
  código nuevo corriendo contra un schema viejo.
- **Seed del admin**, también idempotente (no pisa un admin existente). Si faltan
  `ADMIN_EMAIL`/`ADMIN_PASSWORD` avisa y sigue, sin romper el deploy.

Env vars necesarias en Vercel:

- `DATABASE_URL` + `DATABASE_AUTH_TOKEN`, o las que inyecta la integración de Turso
  (`<proyecto>_TURSO_DATABASE_URL` / `<proyecto>_TURSO_AUTH_TOKEN`; se buscan por
  sufijo, ver `src/db/path.ts`). **`DATABASE_URL` tiene precedencia**: si quedó una
  vieja apuntando a un archivo local, le gana a la de Turso y la app falla con un
  error explícito (ver `getDb()` en `src/db/index.ts`).
- `SESSION_SECRET`.
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` solo si se quiere que el deploy seedee el admin.

**Ojo con la integración Turso de Vercel y las DBs por branch/preview**: la
integración puede aprovisionar una base de Turso **distinta por branch/preview**
(en vez de que todos los entornos compartan una sola). Si en algún momento se carga
data real de negocio entrando por una URL de preview (de una feature branch, no la
de producción), esa data queda en la DB de esa branch — no en la de producción — y
un deploy a producción muestra todo vacío aunque el schema esté bien migrado (ya
pasó una vez: ver commit de este mismo archivo). Antes de cargar datos reales,
confirmar que se está entrando por la URL de producción, y chequear en el
dashboard de Turso (`turso db list`) cuántas bases existen y cuál usa cada
environment de Vercel.

## Pendientes conocidos (no bloqueantes)

- Interfaz pública (catálogo sin login) — no arrancada.
- Sin rate limiting en el login (aceptable para un solo admin de bajo tráfico; revisar si se expone a internet sin otra capa de protección).
- Cambiar el `tipo` de un insumo en uso puede desincronizar un picker (ver sección Insumos).
- Borrar una receta con productos asociados falla con mensaje de negocio claro (no cascada); borrar un insumo o un producto sí cascadea, con aviso previo en el `confirm()`.
