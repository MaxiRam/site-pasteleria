"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  actualizarInsumo,
  crearInsumo,
  eliminarInsumo,
  type InsumoInput,
} from "@/db/insumos";
import { UNIDADES, type Unidad } from "@/db/schema";

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
  const cantidadComprada = formData.get("cantidadComprada");
  const precioCompra = formData.get("precioCompra");

  if (typeof nombre !== "string" || !nombre.trim()) {
    return { error: "El nombre es obligatorio." };
  }

  if (typeof unidad !== "string" || !UNIDADES.includes(unidad as Unidad)) {
    return { error: "Unidad inválida." };
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

  crearInsumo(parsed);
  revalidatePath("/admin/insumos");
  revalidatePath("/admin");
  redirect("/admin/insumos");
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

  actualizarInsumo(id, parsed);
  revalidatePath("/admin/insumos");
  revalidatePath("/admin");
  redirect("/admin/insumos");
}

export async function eliminarInsumoAction(id: number): Promise<void> {
  eliminarInsumo(id);
  revalidatePath("/admin/insumos");
  revalidatePath("/admin");
}
