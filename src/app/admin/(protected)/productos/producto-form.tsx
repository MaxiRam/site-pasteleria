"use client";

import { useActionState } from "react";
import type { Receta } from "@/db/recetas";
import type { ProductoFormState } from "./actions";

type ProductoFormAction = (
  prevState: ProductoFormState,
  formData: FormData,
) => ProductoFormState | Promise<ProductoFormState>;

export interface ProductoFormValues {
  nombrePublico: string;
  descripcion: string | null;
  recetaId: number;
  publicado: boolean;
}

/**
 * El packaging NO se maneja acá: es distinto por diámetro (una torta de
 * 12cm puede llevar una caja distinta que una de 25cm), y el diámetro es
 * un concepto de Precios, no de Productos — se edita desde
 * /admin/precios/[id]/packaging (ver esa página y src/db/producto-insumos.ts).
 */
export function ProductoForm({
  action,
  recetasDisponibles,
  initialValues,
  submitLabel,
}: {
  action: ProductoFormAction;
  recetasDisponibles: Receta[];
  initialValues?: ProductoFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ProductoFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="nombrePublico" className="text-sm font-medium text-zinc-700">
          Nombre público
        </label>
        <input
          id="nombrePublico"
          name="nombrePublico"
          type="text"
          required
          defaultValue={initialValues?.nombrePublico}
          className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="descripcion" className="text-sm font-medium text-zinc-700">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          defaultValue={initialValues?.descripcion ?? ""}
          className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="recetaId" className="text-sm font-medium text-zinc-700">
          Receta
        </label>
        {recetasDisponibles.length === 0 ? (
          <p className="text-sm text-zinc-600">
            No hay recetas cargadas todavía. Creá una receta antes de armar un producto.
          </p>
        ) : (
          <select
            id="recetaId"
            name="recetaId"
            required
            defaultValue={initialValues?.recetaId ?? recetasDisponibles[0]?.id}
            className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          >
            {recetasDisponibles.map((receta) => (
              <option key={receta.id} value={receta.id}>
                {receta.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input
          type="checkbox"
          name="publicado"
          defaultChecked={initialValues?.publicado ?? false}
        />
        Publicado (requiere además un precio confirmado para verse en el catálogo público)
      </label>

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending || recetasDisponibles.length === 0}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
