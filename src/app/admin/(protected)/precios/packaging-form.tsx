"use client";

import { useActionState, useRef, useState } from "react";
import type { Insumo } from "@/db/insumos";
import type { PackagingFormState } from "./actions";

type PackagingFormAction = (
  prevState: PackagingFormState,
  formData: FormData,
) => PackagingFormState | Promise<PackagingFormState>;

export interface PackagingFormValues {
  packaging: { insumoId: number; cantidad: number }[];
}

/**
 * Filas dinámicas insumo+cantidad — mismo patrón que las filas de
 * receta-form.tsx (id estable propio, no el índice), pero sin `esHuevo` (no
 * aplica a packaging) y sin exigir mínimo 1 fila (el packaging de un
 * producto+diámetro puede quedar vacío).
 */
interface FilaPackaging {
  id: number;
  insumoId: number;
  cantidad: string;
}

export function PackagingForm({
  action,
  packagingDisponible,
  initialValues,
}: {
  action: PackagingFormAction;
  packagingDisponible: Insumo[];
  initialValues: PackagingFormValues;
}) {
  const [state, formAction, pending] = useActionState<PackagingFormState, FormData>(
    action,
    undefined,
  );

  const nextFilaId = useRef(0);
  const [filas, setFilas] = useState<FilaPackaging[]>(() =>
    initialValues.packaging.map((p) => ({
      id: nextFilaId.current++,
      insumoId: p.insumoId,
      cantidad: String(p.cantidad),
    })),
  );

  function agregarFila() {
    if (packagingDisponible.length === 0) return;
    setFilas((prev) => [
      ...prev,
      { id: nextFilaId.current++, insumoId: packagingDisponible[0].id, cantidad: "" },
    ]);
  }

  function quitarFila(id: number) {
    setFilas((prev) => prev.filter((fila) => fila.id !== id));
  }

  function actualizarFila(id: number, patch: Partial<FilaPackaging>) {
    setFilas((prev) => prev.map((fila) => (fila.id === id ? { ...fila, ...patch } : fila)));
  }

  const packagingJson = JSON.stringify(
    filas.map((fila) => ({ insumoId: fila.insumoId, cantidad: Number(fila.cantidad) })),
  );

  return (
    <form action={formAction} className="flex w-full max-w-2xl flex-col gap-4">
      <input type="hidden" name="packagingJson" value={packagingJson} />

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-zinc-700">Packaging</span>
        <button
          type="button"
          onClick={agregarFila}
          disabled={packagingDisponible.length === 0}
          className="rounded border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
        >
          Agregar packaging
        </button>
      </div>

      {packagingDisponible.length === 0 ? (
        <p className="text-sm text-zinc-600">
          No hay insumos de packaging cargados. Creá uno en la pestaña &quot;Packaging&quot; de
          Insumos.
        </p>
      ) : null}

      {filas.map((fila) => (
        <div
          key={fila.id}
          className="flex flex-wrap items-center gap-3 rounded border border-zinc-200 p-3"
        >
          <select
            value={fila.insumoId}
            onChange={(e) => actualizarFila(fila.id, { insumoId: Number(e.target.value) })}
            className="rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          >
            {packagingDisponible.map((insumo) => (
              <option key={insumo.id} value={insumo.id}>
                {insumo.nombre}
              </option>
            ))}
          </select>

          <input
            type="number"
            step="any"
            min="0"
            placeholder="Cantidad"
            value={fila.cantidad}
            onChange={(e) => actualizarFila(fila.id, { cantidad: e.target.value })}
            className="w-28 rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
          />

          <button
            type="button"
            onClick={() => quitarFila(fila.id)}
            className="ml-auto text-sm text-red-600 hover:underline"
          >
            Quitar
          </button>
        </div>
      ))}

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando..." : "Guardar packaging"}
      </button>
    </form>
  );
}
