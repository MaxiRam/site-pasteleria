"use client";

import { useActionState } from "react";
import { generarPreciosAction, type GenerarPreciosState } from "./actions";

/**
 * Backfill de precios para productos que ya existían antes de que
 * crearProductoAction empezara a generarlos automáticamente (ver
 * src/db/precios.ts > generarPreciosParaProducto). No hace falta confirm():
 * es una acción aditiva (no pisa precios existentes, no borra nada).
 */
export function GenerarPreciosButton({ id }: { id: number }) {
  const action = generarPreciosAction.bind(null, id);
  const [state, formAction, pending] = useActionState<GenerarPreciosState, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="flex items-center gap-2">
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-zinc-700 hover:underline disabled:opacity-50"
      >
        Generar precios
      </button>
      {state?.error ? <span className="text-xs text-red-600">{state.error}</span> : null}
    </form>
  );
}
