"use client";

import { useActionState, useState } from "react";
import { TIPOS_INSUMO, UNIDADES, type TipoInsumo, type Unidad } from "@/db/schema";
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
  tipo: TipoInsumo;
}

const NOMBRE_TIPO: Record<TipoInsumo, string> = {
  ingrediente: "Ingrediente",
  packaging: "Packaging",
};

export function InsumoForm({
  action,
  initialValues,
  defaultTipo,
  submitLabel,
}: {
  action: InsumoFormAction;
  initialValues?: InsumoFormValues;
  // Tipo con el que arranca el form en alta (viene del query param ?tipo=
  // de la pestaña activa en /admin/insumos, ver nuevo/page.tsx). En edición
  // se ignora: initialValues.tipo manda.
  defaultTipo?: TipoInsumo;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<InsumoFormState, FormData>(
    action,
    undefined,
  );

  const [tipo, setTipo] = useState<TipoInsumo>(
    initialValues?.tipo ?? defaultTipo ?? TIPOS_INSUMO[0],
  );
  const [unidad, setUnidad] = useState<Unidad>(initialValues?.unidad ?? UNIDADES[0]);

  // Packaging solo se mide en 'unidad' (no tiene sentido "0.5g de caja",
  // ver insumos_packaging_unidad_check en schema.ts) — al elegir packaging,
  // la unidad se fuerza a 'unidad' y el <select> solo ofrece esa opción.
  function handleTipoChange(nuevoTipo: TipoInsumo) {
    setTipo(nuevoTipo);
    if (nuevoTipo === "packaging") {
      setUnidad("unidad");
    }
  }

  const unidadesDisponibles = tipo === "packaging" ? (["unidad"] as const) : UNIDADES;

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
          className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
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
          className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
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
          value={unidad}
          onChange={(e) => setUnidad(e.target.value as Unidad)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        >
          {unidadesDisponibles.map((u) => (
            <option key={u} value={u}>
              {u}
            </option>
          ))}
        </select>
        {tipo === "packaging" ? (
          <p className="text-xs text-zinc-500">Packaging solo se mide en &quot;unidad&quot;.</p>
        ) : null}
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
          className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="tipo" className="text-sm font-medium text-zinc-700">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          required
          value={tipo}
          onChange={(e) => handleTipoChange(e.target.value as TipoInsumo)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
        >
          {TIPOS_INSUMO.map((tipo) => (
            <option key={tipo} value={tipo}>
              {NOMBRE_TIPO[tipo]}
            </option>
          ))}
        </select>
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
