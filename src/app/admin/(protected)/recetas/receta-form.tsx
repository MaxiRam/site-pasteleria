"use client";

import { useActionState, useRef, useState } from "react";
import type { Insumo } from "@/db/insumos";
import { DIAMETROS, type Diametro } from "@/db/schema";
import type { RecetaFormState } from "./actions";

type RecetaFormAction = (
  prevState: RecetaFormState,
  formData: FormData,
) => RecetaFormState | Promise<RecetaFormState>;

export interface RecetaFormValues {
  nombre: string;
  diametroBase: Diametro;
  insumos: { insumoId: number; cantidad: number; esHuevo: boolean }[];
}

/**
 * Fila del form, con id estable propio (no el índice del array: al
 * agregar/quitar filas el índice cambia y rompería el `key` de React y la
 * identidad de cada radio "es huevo"). `cantidad` se guarda como string
 * mientras se edita (input controlado) y se parsea a número recién al
 * armar el JSON que se manda al server.
 */
interface Fila {
  id: number;
  insumoId: number;
  cantidad: string;
  esHuevo: boolean;
}

export function RecetaForm({
  action,
  insumosDisponibles,
  initialValues,
  submitLabel,
}: {
  action: RecetaFormAction;
  insumosDisponibles: Insumo[];
  initialValues?: RecetaFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<RecetaFormState, FormData>(
    action,
    undefined,
  );

  const nextFilaId = useRef(0);
  const [filas, setFilas] = useState<Fila[]>(() => {
    if (initialValues && initialValues.insumos.length > 0) {
      return initialValues.insumos.map((i) => ({
        id: nextFilaId.current++,
        insumoId: i.insumoId,
        cantidad: String(i.cantidad),
        esHuevo: i.esHuevo,
      }));
    }
    if (insumosDisponibles.length > 0) {
      return [
        {
          id: nextFilaId.current++,
          insumoId: insumosDisponibles[0].id,
          cantidad: "",
          esHuevo: false,
        },
      ];
    }
    return [];
  });

  function agregarFila() {
    if (insumosDisponibles.length === 0) return;
    setFilas((prev) => [
      ...prev,
      {
        id: nextFilaId.current++,
        insumoId: insumosDisponibles[0].id,
        cantidad: "",
        esHuevo: false,
      },
    ]);
  }

  function quitarFila(id: number) {
    setFilas((prev) => prev.filter((fila) => fila.id !== id));
  }

  function actualizarFila(id: number, patch: Partial<Fila>) {
    setFilas((prev) => prev.map((fila) => (fila.id === id ? { ...fila, ...patch } : fila)));
  }

  function marcarHuevo(id: number) {
    setFilas((prev) => prev.map((fila) => ({ ...fila, esHuevo: fila.id === id })));
  }

  function quitarMarcaHuevo() {
    setFilas((prev) => prev.map((fila) => ({ ...fila, esHuevo: false })));
  }

  // Serializado que consume parseRecetaInput en actions.ts. cantidad viaja
  // como string mientras se edita (input controlado); acá se intenta
  // convertir a número, pero la validación real (>0, finito, etc.) vive en
  // el server — esto es solo para no mandar strings vacíos como NaN sin
  // avisar.
  const insumosJson = JSON.stringify(
    filas.map((fila) => ({
      insumoId: fila.insumoId,
      cantidad: Number(fila.cantidad),
      esHuevo: fila.esHuevo,
    })),
  );

  const hayHuevoMarcado = filas.some((fila) => fila.esHuevo);

  return (
    <form action={formAction} className="flex w-full max-w-2xl flex-col gap-6">
      <input type="hidden" name="insumosJson" value={insumosJson} />

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
        <label htmlFor="diametroBase" className="text-sm font-medium text-zinc-700">
          Diámetro base
        </label>
        <select
          id="diametroBase"
          name="diametroBase"
          required
          defaultValue={initialValues?.diametroBase ?? DIAMETROS[0]}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          {DIAMETROS.map((diametro) => (
            <option key={diametro} value={diametro}>
              {diametro}cm
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-zinc-700">Insumos de la receta</span>
          <button
            type="button"
            onClick={agregarFila}
            disabled={insumosDisponibles.length === 0}
            className="rounded border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
          >
            Agregar insumo
          </button>
        </div>

        {insumosDisponibles.length === 0 ? (
          <p className="text-sm text-zinc-600">
            No hay insumos cargados todavía. Creá insumos antes de armar una receta.
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
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
            >
              {insumosDisponibles.map((insumo) => (
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
              className="w-28 rounded border border-zinc-300 px-3 py-2 text-sm"
            />

            <label className="flex items-center gap-1 text-sm text-zinc-600">
              <input
                type="radio"
                name="esHuevo"
                checked={fila.esHuevo}
                onChange={() => marcarHuevo(fila.id)}
              />
              Es huevo
            </label>

            <button
              type="button"
              onClick={() => quitarFila(fila.id)}
              className="ml-auto text-sm text-red-600 hover:underline"
            >
              Quitar
            </button>
          </div>
        ))}

        {hayHuevoMarcado ? (
          <button
            type="button"
            onClick={quitarMarcaHuevo}
            className="self-start text-xs text-zinc-500 hover:underline"
          >
            Ningún insumo es huevo
          </button>
        ) : null}
      </div>

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending || filas.length === 0}
        className="self-start rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
