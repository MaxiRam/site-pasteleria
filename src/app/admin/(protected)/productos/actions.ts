"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actualizarProducto, crearProducto, eliminarProducto, type ProductoInput } from "@/db/productos";
import { generarPreciosParaProducto } from "@/db/precios";

export type ProductoFormState = { error: string } | undefined;
export type EliminarProductoState = { error: string } | undefined;
export type GenerarPreciosState = { error: string } | undefined;

/**
 * Valida y normaliza el FormData del form de producto (nuevo/editar). Server
 * Actions son un endpoint público reachable con cualquier POST (mismo
 * criterio que insumos/actions.ts y recetas/actions.ts): no confiar en que
 * el form solo se renderiza para un admin logueado, validar siempre acá.
 */
function parseProductoInput(formData: FormData): ProductoInput | { error: string } {
  const nombrePublico = formData.get("nombrePublico");
  const descripcion = formData.get("descripcion");
  const recetaIdRaw = formData.get("recetaId");
  const publicado = formData.get("publicado");

  if (typeof nombrePublico !== "string" || !nombrePublico.trim()) {
    return { error: "El nombre público es obligatorio." };
  }

  const recetaIdNum = typeof recetaIdRaw === "string" ? Number(recetaIdRaw) : NaN;
  if (!Number.isInteger(recetaIdNum) || recetaIdNum <= 0) {
    return { error: "Elegí una receta válida." };
  }

  return {
    nombrePublico,
    descripcion: typeof descripcion === "string" ? descripcion : null,
    recetaId: recetaIdNum,
    // Checkbox: solo viaja en el FormData cuando está marcado.
    publicado: publicado === "on",
  };
}

export async function crearProductoAction(
  _prevState: ProductoFormState,
  formData: FormData,
): Promise<ProductoFormState> {
  const parsed = parseProductoInput(formData);
  if ("error" in parsed) {
    return parsed;
  }

  let producto: ReturnType<typeof crearProducto>;
  try {
    producto = crearProducto(parsed);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo crear el producto." };
  }

  // Genera automáticamente los precios de los 5 diámetros para este
  // producto (margen default por diámetro, sin confirmar todavía) — el
  // admin ya no tiene que crear "Nuevo precio" a mano una vez por diámetro,
  // ver src/db/precios.ts > generarPreciosParaProducto.
  generarPreciosParaProducto(producto.id);

  revalidatePath("/admin/productos");
  revalidatePath("/admin/precios");
  revalidatePath("/admin");
  redirect("/admin/productos");
}

/**
 * Backfill para productos creados antes de que crearProductoAction generara
 * los precios automáticamente: genera los que le falten a un producto ya
 * existente (no pisa los que ya tiene, ver generarPreciosParaProducto).
 */
export async function generarPreciosAction(
  productoId: number,
  _prevState: GenerarPreciosState,
  _formData: FormData,
): Promise<GenerarPreciosState> {
  try {
    generarPreciosParaProducto(productoId);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "No se pudieron generar los precios.",
    };
  }

  revalidatePath("/admin/precios");
  revalidatePath("/admin");
  return undefined;
}

export async function actualizarProductoAction(
  id: number,
  _prevState: ProductoFormState,
  formData: FormData,
): Promise<ProductoFormState> {
  const parsed = parseProductoInput(formData);
  if ("error" in parsed) {
    return parsed;
  }

  try {
    actualizarProducto(id, parsed);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo actualizar el producto." };
  }

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${id}/editar`);
  revalidatePath("/admin");
  redirect("/admin/productos");
}

/**
 * A diferencia de eliminarRecetaAction, borrar un producto nunca falla por
 * FK constraint: `precios.productoId` tiene onDelete cascade (ver
 * src/db/schema.ts y comentario en db/productos.ts), así que no hace falta
 * traducir ningún error de negocio acá. La advertencia al admin sobre los
 * precios que se borran en cascada se muestra antes, en el confirm() del
 * botón de borrado (ver delete-producto-button.tsx).
 */
export async function eliminarProductoAction(
  id: number,
  _prevState: EliminarProductoState,
  _formData: FormData,
): Promise<EliminarProductoState> {
  eliminarProducto(id);
  revalidatePath("/admin/productos");
  revalidatePath("/admin");
  return undefined;
}
