"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { calcularMargenReal } from "@/lib/calc";
import { formatARS } from "@/lib/format";
import type { PrecioConProducto } from "@/db/precios";
import { ChevronDownIcon, ChevronUpIcon, PackageIcon, PencilIcon, SaveIcon } from "@/components/icons";
import { actualizarPrecioAction, type PrecioFormState } from "./actions";
import { DeletePrecioButton } from "./delete-precio-button";

const MARGEN_STEP = 1;
const MARGEN_MAX = 99;
const MARGEN_MIN = 0;

/**
 * Fila editable de la lista de precios: margen (con stepper ±1%), precio de
 * venta y confirmado, todo en un solo submit — sin ir a "Editar margen".
 *
 * Los inputs quedan en sus <td> normales (no hay un <form> envolviendo la
 * fila: <form> como ancestro de <tr> rompe la semántica de tabla). En vez
 * de eso, un único <form> "headless" vive en la última celda y los
 * campos de las otras celdas se asocian a él vía el atributo HTML `form`
 * (soportado nativamente, no hace falta JS extra para juntarlos).
 */
export function PrecioRow({ precio }: { precio: PrecioConProducto }) {
  const formId = useId();
  const action = actualizarPrecioAction.bind(null, precio.id);
  const [state, formAction, pending] = useActionState<PrecioFormState, FormData>(
    action,
    undefined,
  );

  const margenInicial = Math.round(precio.margenPct * 100 * 100) / 100;
  const [margenPct, setMargenPct] = useState(String(margenInicial));

  function ajustarMargen(delta: number) {
    setMargenPct((prev) => {
      const actual = Number(prev);
      const base = Number.isFinite(actual) ? actual : margenInicial;
      const siguiente = Math.min(MARGEN_MAX, Math.max(MARGEN_MIN, base + delta));
      return String(Math.round(siguiente * 100) / 100);
    });
  }

  const margenRealPct =
    precio.confirmado && precio.precioVenta !== null && precio.precioVenta > 0
      ? calcularMargenReal(precio.costoCalculado, precio.precioVenta) * 100
      : null;

  return (
    <tr className="border-b border-zinc-100 last:border-0">
      <td className="px-4 py-2 text-zinc-900">{precio.producto.nombrePublico}</td>
      <td className="px-4 py-2 text-zinc-700">{precio.diametro}cm</td>
      <td className="px-4 py-2 text-zinc-700">{formatARS(precio.costoCalculado)}</td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-1">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => ajustarMargen(MARGEN_STEP)}
              className="flex items-center justify-center rounded-t border border-b-0 border-zinc-300 px-0.5 text-zinc-700 hover:bg-zinc-100"
              aria-label="Aumentar margen 1%"
            >
              <ChevronUpIcon className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => ajustarMargen(-MARGEN_STEP)}
              className="flex items-center justify-center rounded-b border border-zinc-300 px-0.5 text-zinc-700 hover:bg-zinc-100"
              aria-label="Disminuir margen 1%"
            >
              <ChevronDownIcon className="h-3 w-3" />
            </button>
          </div>
          <input
            form={formId}
            type="number"
            name="margenPct"
            step="any"
            min={MARGEN_MIN}
            max="99.99"
            required
            value={margenPct}
            onChange={(e) => setMargenPct(e.target.value)}
            className="w-16 rounded border border-zinc-300 px-1 py-1 text-center text-sm text-zinc-900"
          />
          <span className="text-xs text-zinc-500">%</span>
        </div>
      </td>
      <td className="px-4 py-2 text-zinc-700">{formatARS(precio.precioSugerido)}</td>
      <td className="px-4 py-2 text-zinc-700">
        <div className="flex items-center gap-1">
          <input
            form={formId}
            type="number"
            name="precioVenta"
            step="any"
            min="0"
            placeholder="—"
            defaultValue={precio.precioVenta ?? ""}
            className="w-24 rounded border border-zinc-300 px-2 py-1 text-sm text-zinc-900"
          />
          {margenRealPct !== null ? (
            <span className="text-xs text-zinc-500">({margenRealPct.toFixed(1)}%)</span>
          ) : null}
        </div>
      </td>
      <td className="px-4 py-2">
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            form={formId}
            type="checkbox"
            name="confirmado"
            defaultChecked={precio.confirmado}
            className="peer sr-only"
          />
          <div className="h-5 w-9 rounded-full bg-zinc-300 transition-colors peer-checked:bg-green-600" />
          <div className="absolute left-0.5 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-4" />
        </label>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-3">
          <form id={formId} action={formAction} />
          <button
            type="submit"
            form={formId}
            disabled={pending}
            aria-label="Guardar"
            title="Guardar"
            className="rounded border border-zinc-300 p-1.5 text-zinc-700 hover:bg-zinc-100 disabled:opacity-50"
          >
            <SaveIcon className="h-4 w-4" />
          </button>
          <Link
            href={`/admin/precios/${precio.id}/editar`}
            aria-label="Editar"
            title="Editar"
            className="rounded border border-zinc-300 p-1.5 text-zinc-700 hover:bg-zinc-100"
          >
            <PencilIcon className="h-4 w-4" />
          </Link>
          <Link
            href={`/admin/precios/${precio.id}/packaging`}
            aria-label={`Packaging para ${precio.diametro}cm`}
            title={`Packaging para ${precio.diametro}cm`}
            className="rounded border border-zinc-300 p-1.5 text-zinc-700 hover:bg-zinc-100"
          >
            <PackageIcon className="h-4 w-4" />
          </Link>
          <DeletePrecioButton
            id={precio.id}
            nombreProducto={precio.producto.nombrePublico}
            diametro={precio.diametro}
          />
        </div>
        {state?.error ? <p className="mt-1 text-xs text-red-600">{state.error}</p> : null}
      </td>
    </tr>
  );
}
