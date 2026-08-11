"use client";

import { useActionState, useState } from "react";
import { formatARS } from "@/lib/format";
import type { PrecioFormState } from "./actions";

type EditarPrecioFormAction = (
  prevState: PrecioFormState,
  formData: FormData,
) => PrecioFormState | Promise<PrecioFormState>;

/**
 * Form de edición de precio. Producto y diámetro NO son editables una vez
 * creado el precio (ver src/db/precios.ts, actualizarPrecio) — se muestran
 * como texto de solo lectura, no como inputs.
 *
 * `costoActual`/`precioSugeridoActual` vienen recalculados por la página
 * (mismos helpers que crearPrecio/actualizarPrecio, ver
 * precios/[id]/editar/page.tsx) con el margen que está guardado en este
 * momento, para que el admin vea el número real antes de decidir el nuevo
 * margen. "Copiar sugerido" solo copia ese número ya calculado por el
 * server al campo de precio de venta — no reimplementa ninguna fórmula.
 */
export function EditarPrecioForm({
  action,
  nombreProducto,
  diametro,
  costoActual,
  precioSugeridoActual,
  margenPctInicial,
  precioVentaInicial,
  confirmadoInicial,
  submitLabel,
}: {
  action: EditarPrecioFormAction;
  nombreProducto: string;
  diametro: number;
  costoActual: number;
  precioSugeridoActual: number;
  margenPctInicial: number;
  precioVentaInicial: number | null;
  confirmadoInicial: boolean;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<PrecioFormState, FormData>(
    action,
    undefined,
  );

  const [precioVenta, setPrecioVenta] = useState<string>(
    precioVentaInicial !== null ? String(precioVentaInicial) : "",
  );

  function copiarSugerido() {
    setPrecioVenta(String(Math.round(precioSugeridoActual * 100) / 100));
  }

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700">Producto</span>
        <p className="text-sm text-zinc-900">{nombreProducto}</p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium text-zinc-700">Diámetro</span>
        <p className="text-sm text-zinc-900">{diametro}cm</p>
      </div>

      <div className="flex flex-col gap-1 rounded border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
        <p>
          Costo calculado actual:{" "}
          <span className="font-medium text-zinc-900">{formatARS(costoActual)}</span>
        </p>
        <p>
          Precio sugerido actual (con el margen guardado):{" "}
          <span className="font-medium text-zinc-900">{formatARS(precioSugeridoActual)}</span>
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="margenPct" className="text-sm font-medium text-zinc-700">
          Margen (%)
        </label>
        <input
          id="margenPct"
          name="margenPct"
          type="number"
          step="any"
          min="0"
          max="99.99"
          required
          defaultValue={margenPctInicial * 100}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="precioVenta" className="text-sm font-medium text-zinc-700">
          Precio de venta
        </label>
        <div className="flex items-center gap-2">
          <input
            id="precioVenta"
            name="precioVenta"
            type="number"
            step="any"
            min="0"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
            className="w-full rounded border border-zinc-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={copiarSugerido}
            className="whitespace-nowrap rounded border border-zinc-300 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Copiar sugerido
          </button>
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="confirmado" defaultChecked={confirmadoInicial} />
        Confirmado
      </label>

      <p className="text-xs text-zinc-500">
        Un producto+diámetro solo es visible en el catálogo público si el producto está
        publicado y este precio está confirmado.
      </p>

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
