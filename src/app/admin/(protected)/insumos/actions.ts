"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actualizarInsumo,
  crearInsumo,
  eliminarInsumo,
  type InsumoInput,
} from "@/db/insumos";
import { TIPOS_INSUMO, UNIDADES, type TipoInsumo, type Unidad } from "@/db/schema";

export type InsumoFormState = { error: string } | undefined;

/**
 * Valida y normaliza el FormData del form de insumo (nuevo/editar). Server
 * Actions son un endpoint público reachable con cualquier POST (ver docs de
 * Server Actions): no confiar en que el form solo se renderiza para un
 * admin logueado, validar siempre acá.
 */
function parseInsumoInput(formData: FormData): InsumoInput | { error: string } {
  const nombre = formData.get("nombre");
  const unidad = formData.get("unidad");
  const tipo = formData.get("tipo");
  const cantidadComprada = formData.get("cantidadComprada");
  const precioCompra = formData.get("precioCompra");

  if (typeof nombre !== "string" || !nombre.trim()) {
    return { error: "El nombre es obligatorio." };
  }

  if (typeof unidad !== "string" || !UNIDADES.includes(unidad as Unidad)) {
    return { error: "Unidad inválida." };
  }

  if (typeof tipo !== "string" || !TIPOS_INSUMO.includes(tipo as TipoInsumo)) {
    return { error: "Tipo de insumo inválido." };
  }

  // Packaging solo se mide en 'unidad' (no tiene sentido "0.5g de caja") —
  // mismo CHECK a nivel DB (insumos_packaging_unidad_check en schema.ts),
  // validado también acá para un mensaje de negocio en vez de un error
  // crudo de constraint si algo bypassea el <select> reactivo del form.
  if (tipo === "packaging" && unidad !== "unidad") {
    return { error: "Los insumos de tipo packaging solo pueden medirse en 'unidad'." };
  }

  const cantidadNum = typeof cantidadComprada === "string" ? Number(cantidadComprada) : NaN;
  if (!Number.isFinite(cantidadNum) || cantidadNum <= 0) {
    return { error: "La cantidad comprada debe ser un número mayor a 0." };
  }

  const precioNum = typeof precioCompra === "string" ? Number(precioCompra) : NaN;
  if (!Number.isFinite(precioNum) || precioNum < 0) {
    return { error: "El precio de compra debe ser un número válido (>= 0)." };
  }

  return {
    nombre,
    unidad: unidad as Unidad,
    tipo: tipo as TipoInsumo,
    cantidadComprada: cantidadNum,
    precioCompra: precioNum,
  };
}

export async function crearInsumoAction(
  _prevState: InsumoFormState,
  formData: FormData,
): Promise<InsumoFormState> {
  const parsed = parseInsumoInput(formData);
  if ("error" in parsed) {
    return parsed;
  }

  await crearInsumo(parsed);
  revalidatePath("/admin/insumos");
  revalidatePath("/admin");
  // Redirige a la pestaña del tipo recién creado — si no, un insumo de
  // packaging desaparece de la vista (la pestaña default es "ingrediente")
  // y parece que la creación falló en silencio.
  redirect(`/admin/insumos?tipo=${parsed.tipo}`);
}

export async function actualizarInsumoAction(
  id: number,
  _prevState: InsumoFormState,
  formData: FormData,
): Promise<InsumoFormState> {
  const parsed = parseInsumoInput(formData);
  if ("error" in parsed) {
    return parsed;
  }

  await actualizarInsumo(id, parsed);
  revalidatePath("/admin/insumos");
  revalidatePath("/admin");
  redirect(`/admin/insumos?tipo=${parsed.tipo}`);
}

export async function eliminarInsumoAction(id: number): Promise<void> {
  await eliminarInsumo(id);
  revalidatePath("/admin/insumos");
  revalidatePath("/admin");
}
