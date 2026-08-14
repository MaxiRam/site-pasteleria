"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { actualizarReceta, crearReceta, eliminarReceta, type RecetaInput } from "@/db/recetas";
import { DIAMETROS, type Diametro } from "@/db/schema";

export type RecetaFormState = { error: string } | undefined;
export type EliminarRecetaState = { error: string } | undefined;

interface InsumoRecetaCrudo {
  insumoId: number;
  cantidad: number;
  esHuevo: boolean;
}

/**
 * Valida y normaliza el FormData del form de receta (nuevo/editar). Server
 * Actions son un endpoint público reachable con cualquier POST (mismo
 * criterio que insumos/actions.ts): no confiar en que el form solo se
 * renderiza para un admin logueado, validar siempre acá.
 *
 * `insumosJson` es la lista dinámica de filas insumo+cantidad+esHuevo
 * armada en el cliente (ver receta-form.tsx) y serializada a JSON en un
 * input hidden — no confiamos en su forma, se valida tipo por tipo.
 */
function parseRecetaInput(formData: FormData): RecetaInput | { error: string } {
  const nombre = formData.get("nombre");
  const diametroBaseRaw = formData.get("diametroBase");
  const menosCapaEn12 = formData.get("menosCapaEn12");
  const insumosJson = formData.get("insumosJson");

  if (typeof nombre !== "string" || !nombre.trim()) {
    return { error: "El nombre es obligatorio." };
  }

  const diametroBaseNum = typeof diametroBaseRaw === "string" ? Number(diametroBaseRaw) : NaN;
  if (!DIAMETROS.includes(diametroBaseNum as Diametro)) {
    return { error: "Diámetro base inválido." };
  }

  if (typeof insumosJson !== "string") {
    return { error: "Lista de insumos inválida." };
  }

  let crudo: unknown;
  try {
    crudo = JSON.parse(insumosJson);
  } catch {
    return { error: "Lista de insumos inválida (JSON malformado)." };
  }

  if (!Array.isArray(crudo) || crudo.length === 0) {
    return { error: "La receta necesita al menos un insumo." };
  }

  const items: InsumoRecetaCrudo[] = [];
  const idsVistos = new Set<number>();

  for (const item of crudo) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as Record<string, unknown>).insumoId !== "number" ||
      typeof (item as Record<string, unknown>).cantidad !== "number" ||
      typeof (item as Record<string, unknown>).esHuevo !== "boolean"
    ) {
      return { error: "Uno de los insumos de la receta tiene datos inválidos." };
    }

    const { insumoId, cantidad, esHuevo } = item as InsumoRecetaCrudo;

    if (!Number.isInteger(insumoId) || insumoId <= 0) {
      return { error: "Uno de los insumos de la receta tiene un id inválido." };
    }
    if (!Number.isFinite(cantidad) || cantidad <= 0) {
      return { error: "La cantidad de cada insumo debe ser un número mayor a 0." };
    }
    if (idsVistos.has(insumoId)) {
      return { error: "No se puede repetir el mismo insumo dos veces en una receta." };
    }
    idsVistos.add(insumoId);

    items.push({ insumoId, cantidad, esHuevo });
  }

  if (items.filter((i) => i.esHuevo).length > 1) {
    return { error: "A lo sumo un insumo de la receta puede estar marcado como huevo." };
  }

  return {
    nombre,
    diametroBase: diametroBaseNum as Diametro,
    // Checkbox/Switch: solo viaja en el FormData cuando está marcado (mismo
    // criterio que confirmado/publicado en precios/productos).
    menosCapaEn12: menosCapaEn12 === "on",
    insumos: items,
  };
}

export async function crearRecetaAction(
  _prevState: RecetaFormState,
  formData: FormData,
): Promise<RecetaFormState> {
  const parsed = parseRecetaInput(formData);
  if ("error" in parsed) {
    return parsed;
  }

  try {
    await crearReceta(parsed);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo crear la receta." };
  }

  revalidatePath("/admin/recetas");
  revalidatePath("/admin");
  redirect("/admin/recetas");
}

export async function actualizarRecetaAction(
  id: number,
  _prevState: RecetaFormState,
  formData: FormData,
): Promise<RecetaFormState> {
  const parsed = parseRecetaInput(formData);
  if ("error" in parsed) {
    return parsed;
  }

  try {
    await actualizarReceta(id, parsed);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo actualizar la receta." };
  }

  revalidatePath("/admin/recetas");
  revalidatePath(`/admin/recetas/${id}`);
  revalidatePath("/admin");
  redirect("/admin/recetas");
}

/**
 * A diferencia de eliminarInsumoAction (insumos/actions.ts), acá sí
 * capturamos el error: `productos.receta_id` no tiene onDelete cascade a
 * propósito (ver comentario en src/db/schema.ts), así que borrar una receta
 * con productos asociados falla con un error crudo de FK constraint de
 * SQLite. Se traduce a un mensaje de negocio en vez de dejarlo propagar.
 *
 * NOTA: el catch es amplio (cualquier excepción de eliminarReceta cae en el
 * mismo mensaje de "hay productos que usan esta receta"), no solo la de FK
 * constraint. Aceptable hoy porque es el único fallo esperable de este
 * delete, pero si eliminarReceta gana otros modos de fallo más adelante,
 * conviene distinguir el error de FK constraint explícitamente en vez de
 * un catch genérico.
 */
export async function eliminarRecetaAction(
  id: number,
  _prevState: EliminarRecetaState,
  _formData: FormData,
): Promise<EliminarRecetaState> {
  try {
    await eliminarReceta(id);
  } catch {
    return {
      error:
        "No se puede eliminar: hay productos que usan esta receta. Eliminá o reasigná esos productos primero.",
    };
  }

  revalidatePath("/admin/recetas");
  revalidatePath("/admin");
  return undefined;
}
