"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actualizarPrecio, eliminarPrecio } from "@/db/precios";

export type PrecioFormState = { error: string } | undefined;
export type EliminarPrecioState = { error: string } | undefined;

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
    actualizarPrecio(id, parsed);
  } catch (e) {
    return { error: traducirError(e, "No se pudo actualizar el precio.") };
  }

  revalidatePath("/admin/precios");
  revalidatePath(`/admin/precios/${id}/editar`);
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
  eliminarPrecio(id);
  revalidatePath("/admin/precios");
  revalidatePath("/admin");
  return undefined;
}
