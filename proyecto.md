## Objetivo

Crear un sitio de administración de un negocio familiar de pastelería.

## Resumen

Sitio con dos interfaces:

- **Admin**: gestión completa de insumos, recetas, precios y catálogo de productos.
- **Usuario (público)**: catálogo/menú de productos visible sin login.

## Stack técnico

- **Framework**: Next.js + React + TypeScript
- **Base de datos**: SQLite
- **Auth**: email + password propio (roles: `admin`, y público sin auth)

## Roles

| Rol | Acceso |
|---|---|
| Admin | Login requerido. Acceso a todas las secciones de administración. |
| Público (sin login) | Solo ve el catálogo de productos publicado. |

## Secciones de Administración

### 1. Insumos

Ingredientes y packaging.

Cada insumo registra:
- Nombre
- Cantidad comprada (con unidad: ml, g, kg, unidad)
- Precio de compra
- **Precio unitario calculado** en la unidad de medida base (ml, g o unidad) → `precio_compra / cantidad_comprada` normalizado a la unidad base

Ejemplo: se compran 1kg de harina a $2000 → precio unitario base = $2/g.

### 2. Recetas

Cada receta define:
- Nombre
- Diámetro base para el que se cargan los insumos (uno de: **12cm, 18cm, 20cm, 22cm, 25cm**)
- Lista de insumos utilizados con cantidad (en la unidad base de cada insumo)
- **Escalado por tamaño**: a partir de la receta cargada para un diámetro, el sistema debe calcular automáticamente las cantidades de insumos equivalentes para los demás diámetros disponibles.
  - **Fórmula de escalado**: sea `D` el diámetro de la receta cargada, `R = D/2`. Sea `D_t` el diámetro destino, `R_t = D_t/2`.
    - Si la receta tiene huevos (insumo medido en unidades, con cantidad `H` en la receta base):
      `factor_escalado = round(H * (R_t^2 / R^2)) / H`
    - Si no tiene huevos:
      `factor_escalado = R_t^2 / R^2`
    - Cantidad escalada de cada insumo = `cantidad_base * factor_escalado`.
    - Nota: el redondeo de huevos aplica solo al cálculo del factor (para no tener fracciones de huevo); se usa ese mismo factor para escalar todos los demás insumos de la receta.
- Costo total de la receta = suma de (cantidad insumo × precio unitario del insumo), calculado por diámetro.

### 3. Precios

- **Margen real** (sobre precio de venta, no sobre costo): `precio_sugerido = costo / (1 - margen%)`
  - Ejemplo: costo $50, margen 60% → precio sugerido = 50 / 0.4 = **$125**
- **Margen por diámetro** (default, editable):
  | Diámetro | Margen |
  |---|---|
  | 12cm | 70% |
  | 18cm | 60% |
  | 20cm, 22cm, 25cm | 50% |
- **Precio sugerido**: calculado automáticamente con la fórmula anterior, según costo de la receta a ese diámetro y el margen de ese diámetro.
- **Precio de venta**: campo separado que completa el admin.
  - El admin puede copiar el sugerido al precio de venta con un toggle/slider (un click), o ingresar un valor manual distinto.
  - Hasta que el admin confirme, el precio de venta queda como **no confirmado**.
- Se guarda por producto + diámetro: `costo_calculado`, `margen_pct`, `precio_sugerido`, `precio_venta`, `confirmado` (bool).
- **Regla de visibilidad pública**: un producto+diámetro solo aparece en el catálogo del cliente si `confirmado = true`.

### 4. Productos / Catálogo público

- Vincula una receta (+ diámetro) con un precio final.
- Flag de "publicado" para decidir qué productos se muestran en el catálogo público.
- Datos visibles al público: nombre, descripción, imagen, precio, diámetro(s) disponibles.

## Interfaz Usuario (público)

- Catálogo de productos publicados: nombre, imagen, descripción, precio, tamaños disponibles.
- Sin login, sin carrito/pedidos (fuera de scope por ahora).

## Modelo de datos (borrador inicial)

```
Insumo
  id, nombre, cantidad_comprada, unidad, precio_compra, precio_unitario_base

Receta
  id, nombre, diametro_base

RecetaInsumo
  receta_id, insumo_id, cantidad (en unidad base)

Producto
  id, receta_id, nombre_publico, descripcion, imagen, publicado

Precio
  producto_id, diametro, costo_calculado, margen_pct, precio_sugerido, precio_venta, confirmado

Admin
  id, email, password_hash
```

## Imágenes y moneda

- **Moneda**: ARS (peso argentino).
- **Imágenes de productos**: upload propio. Hasta implementar el upload, usar placeholder.
