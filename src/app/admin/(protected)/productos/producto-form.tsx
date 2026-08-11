"use client";

import { useActionState, useRef, useState } from "react";
import type { Insumo } from "@/db/insumos";
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
  packaging: { insumoId: number; cantidad: number }[];
}

/**
 * Fila del form de packaging, con id estable propio (mismo motivo que Fila
 * en recetas/receta-form.tsx: al agregar/quitar filas el índice cambia y
 * rompería el `key` de React). Más simple que la Fila de receta-form: sin
 * `esHuevo` (no aplica a packaging). `cantidad` se guarda como string
 * mientras se edita (input controlado) y se parsea a número recién al armar
 * el JSON que se manda al server.
 */
interface FilaPackaging {
  id: number;
  insumoId: number;
  cantidad: string;
}

export function ProductoForm({
  action,
  recetasDisponibles,
  packagingDisponible,
  initialValues,
  submitLabel,
}: {
  action: ProductoFormAction;
  recetasDisponibles: Receta[];
  packagingDisponible: Insumo[];
  initialValues?: ProductoFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ProductoFormState, FormData>(
    action,
    undefined,
  );

  const nextFilaId = useRef(0);
  const [filas, setFilas] = useState<FilaPackaging[]>(() => {
    if (initialValues && initialValues.packaging.length > 0) {
      return initialValues.packaging.map((p) => ({
        id: nextFilaId.current++,
        insumoId: p.insumoId,
        cantidad: String(p.cantidad),
      }));
    }
    return [];
  });

  function agregarFila() {
    if (packagingDisponible.length === 0) return;
    setFilas((prev) => [
      ...prev,
      {
        id: nextFilaId.current++,
        insumoId: packagingDisponible[0].id,
        cantidad: "",
      },
    ]);
  }

  function quitarFila(id: number) {
    setFilas((prev) => prev.filter((fila) => fila.id !== id));
  }

  function actualizarFila(id: number, patch: Partial<FilaPackaging>) {
    setFilas((prev) => prev.map((fila) => (fila.id === id ? { ...fila, ...patch } : fila)));
  }

  // Serializado que consume parseProductoInput en actions.ts. cantidad viaja
  // como string mientras se edita (input controlado); acá se intenta
  // convertir a número, pero la validación real (>0, finito, etc.) vive en
  // el server — mismo criterio que insumosJson en recetas/receta-form.tsx.
  const packagingJson = JSON.stringify(
    filas.map((fila) => ({
      insumoId: fila.insumoId,
      cantidad: Number(fila.cantidad),
    })),
  );

  return (
    <form action={formAction} className="flex w-full max-w-2xl flex-col gap-6">
      <input type="hidden" name="packagingJson" value={packagingJson} />

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
          className="w-full max-w-sm rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
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
          className="w-full max-w-sm rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
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
            className="w-full max-w-sm rounded border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
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

      <div className="flex flex-col gap-3">
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
            No hay insumos de packaging cargados. Podés crear el producto sin packaging y
            asignarlo después.
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
      </div>

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending || recetasDisponibles.length === 0}
        className="self-start rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
