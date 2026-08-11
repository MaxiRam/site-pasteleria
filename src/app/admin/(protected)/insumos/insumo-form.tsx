"use client";

import { useActionState } from "react";
import { UNIDADES, type Unidad } from "@/db/schema";
import type { InsumoFormState } from "./actions";

type InsumoFormAction = (
  prevState: InsumoFormState,
  formData: FormData,
) => InsumoFormState | Promise<InsumoFormState>;

export interface InsumoFormValues {
  nombre: string;
  cantidadComprada: number;
  unidad: Unidad;
  precioCompra: number;
}

export function InsumoForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: InsumoFormAction;
  initialValues?: InsumoFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<InsumoFormState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="nombre" className="text-sm font-medium text-zinc-700">
          Nombre
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          required
          defaultValue={initialValues?.nombre}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="cantidadComprada"
          className="text-sm font-medium text-zinc-700"
        >
          Cantidad comprada
        </label>
        <input
          id="cantidadComprada"
          name="cantidadComprada"
          type="number"
          step="any"
          min="0"
          required
          defaultValue={initialValues?.cantidadComprada}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="unidad" className="text-sm font-medium text-zinc-700">
          Unidad
        </label>
        <select
          id="unidad"
          name="unidad"
          required
          defaultValue={initialValues?.unidad ?? UNIDADES[0]}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          {UNIDADES.map((unidad) => (
            <option key={unidad} value={unidad}>
              {unidad}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label
          htmlFor="precioCompra"
          className="text-sm font-medium text-zinc-700"
        >
          Precio de compra (ARS)
        </label>
        <input
          id="precioCompra"
          name="precioCompra"
          type="number"
          step="any"
          min="0"
          required
          defaultValue={initialValues?.precioCompra}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
