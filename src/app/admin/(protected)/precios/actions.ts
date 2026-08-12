"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actualizarPrecio, eliminarPrecio, getPrecioById } from "@/db/precios";
import { setPackagingDeProducto } from "@/db/producto-insumos";

export type PrecioFormState = { error: string } | undefined;
export type EliminarPrecioState = { error: string } | undefined;
export type PackagingFormState = { error: string } | undefined;

/**
 * Traduce errores de negocio esperables de crearPrecio/actualizarPrecio
 * (src/db/precios.ts) a mensajes claros para el admin, mismo criterio que
 * recetas/actions.ts con el error de FK constraint:
 *
 * - Precio duplicado (constraint `unique(productoId, diametro)` de
 *   src/db/schema.ts): SQLite tira un error crudo "UNIQUE constraint
 *   failed: ...", se traduce a un mensaje de negocio.
 * - Margen inválido (calcularPrecioSugerido, src/lib/calc/pricing.ts): el
 *   mensaje que tira esa función ya es de negocio y legible ("Margen
 *   inválido: X. Debe estar en el rango [0, 1)..."), se propaga tal cual en
 *   vez de reemplazarlo por uno genérico.
 * - Cualquier otro error: mensaje genérico de fallback.
 */
function traducirError(e: unknown, fallback: string): string {
  const message = e instanceof Error ? e.message : "";
  if (message.includes("UNIQUE constraint failed")) {
    return "Ya existe un precio para este producto en este diámetro.";
  }
  return message || fallback;
}

/**
 * `margenPct` viaja en el form como porcentaje humano (ej. "60" = 60%, ver
 * precio-row.tsx / editar-precio-form.tsx) — se convierte a fracción [0,1) recién acá, antes
 * de llegar a la capa de datos (que espera fracción, mismo formato que
 * `MARGEN_POR_DIAMETRO`). El rango válido no se valida en este parser: si
 * el admin ingresa un valor fuera de [0,1) una vez convertido, se deja
 * propagar la excepción de calcularPrecioSugerido y se traduce en el catch
 * de cada action (ver traducirError arriba).
 */
function parseComun(formData: FormData):
  | { margenPct: number; precioVenta: number | null; confirmado: boolean }
  | { error: string } {
  const margenPctRaw = formData.get("margenPct");
  const precioVentaRaw = formData.get("precioVenta");
  const confirmado = formData.get("confirmado");

  const margenPctHumano = typeof margenPctRaw === "string" ? Number(margenPctRaw) : NaN;
  if (!Number.isFinite(margenPctHumano)) {
    return { error: "El margen debe ser un número." };
  }

  let precioVenta: number | null = null;
  if (typeof precioVentaRaw === "string" && precioVentaRaw.trim() !== "") {
    const precioVentaNum = Number(precioVentaRaw);
    if (!Number.isFinite(precioVentaNum) || precioVentaNum < 0) {
      return { error: "El precio de venta debe ser un número mayor o igual a 0." };
    }
    precioVenta = precioVentaNum;
  }

  return {
    margenPct: margenPctHumano / 100,
    precioVenta,
    // Checkbox: solo viaja en el FormData cuando está marcado.
    confirmado: confirmado === "on",
  };
}

export async function actualizarPrecioAction(
  id: number,
  _prevState: PrecioFormState,
  formData: FormData,
): Promise<PrecioFormState> {
  const parsed = parseComun(formData);
  if ("error" in parsed) {
    return parsed;
  }

  try {
    await actualizarPrecio(id, parsed);
  } catch (e) {
    return { error: traducirError(e, "No se pudo actualizar el precio.") };
  }

  revalidatePath("/admin/precios");
  revalidatePath(`/admin/precios/${id}/editar`);
  revalidatePath("/admin");
  redirect("/admin/precios");
}

interface PackagingItemCrudo {
  insumoId: number;
  cantidad: number;
}

/**
 * Mismo nivel de paranoia que parseRecetaInput valida insumosJson en
 * recetas/actions.ts (JSON.parse en try/catch, validar array, validar cada
 * item, sin insumoId repetido) — pero sin exigir mínimo 1 ítem, el
 * packaging de un producto+diámetro puede quedar vacío.
 */
function parsePackagingJson(formData: FormData): PackagingItemCrudo[] | { error: string } {
  const packagingJson = formData.get("packagingJson");

  if (typeof packagingJson !== "string") {
    return { error: "Lista de packaging inválida." };
  }

  let crudo: unknown;
  try {
    crudo = JSON.parse(packagingJson);
  } catch {
    return { error: "Lista de packaging inválida (JSON malformado)." };
  }

  if (!Array.isArray(crudo)) {
    return { error: "Lista de packaging inválida." };
  }

  const items: PackagingItemCrudo[] = [];
  const idsVistos = new Set<number>();

  for (const item of crudo) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as Record<string, unknown>).insumoId !== "number" ||
      typeof (item as Record<string, unknown>).cantidad !== "number"
    ) {
      return { error: "Uno de los ítems de packaging tiene datos inválidos." };
    }

    const { insumoId, cantidad } = item as PackagingItemCrudo;

    if (!Number.isInteger(insumoId) || insumoId <= 0) {
      return { error: "Uno de los ítems de packaging tiene un id inválido." };
    }
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return { error: "La cantidad de cada ítem de packaging debe ser un número mayor a 0." };
    }
    if (idsVistos.has(insumoId)) {
      return { error: "No se puede repetir el mismo insumo de packaging dos veces." };
    }
    idsVistos.add(insumoId);

    items.push({ insumoId, cantidad });
  }

  return items;
}

/**
 * Reemplaza el packaging de ESTE producto+diámetro (el de `precioId`) y
 * recalcula costoCalculado/precioSugerido con el packaging nuevo — mismo
 * margen/precioVenta/confirmado que ya tenía, sin tocarlos (reusa
 * actualizarPrecio entero para no duplicar el recálculo de costo).
 */
export async function actualizarPackagingAction(
  precioId: number,
  _prevState: PackagingFormState,
  formData: FormData,
): Promise<PackagingFormState> {
  const parsed = parsePackagingJson(formData);
  if ("error" in parsed) {
    return parsed;
  }

  const precio = await getPrecioById(precioId);
  if (!precio) {
    return { error: "No se pudo encontrar el precio a actualizar." };
  }

  try {
    await setPackagingDeProducto(precio.productoId, precio.diametro, parsed);
    await actualizarPrecio(precioId, {
      margenPct: precio.margenPct,
      precioVenta: precio.precioVenta,
      confirmado: precio.confirmado,
    });
  } catch (e) {
    return { error: traducirError(e, "No se pudo actualizar el packaging.") };
  }

  revalidatePath("/admin/precios");
  revalidatePath(`/admin/precios/${precioId}/packaging`);
  revalidatePath("/admin");
  redirect("/admin/precios");
}

/**
 * A diferencia de eliminarRecetaAction, borrar un precio nunca falla por FK
 * constraint: `precios` es la hoja del árbol (nada referencia una fila de
 * precios), así que no hace falta traducir ningún error de negocio acá.
 */
export async function eliminarPrecioAction(
  id: number,
  _prevState: EliminarPrecioState,
  _formData: FormData,
): Promise<EliminarPrecioState> {
  await eliminarPrecio(id);
  revalidatePath("/admin/precios");
  revalidatePath("/admin");
  return undefined;
}
