"use client";

import { useActionState } from "react";
import { eliminarRecetaAction, type EliminarRecetaState } from "./actions";

/**
 * Mismo patrón de confirmación mínima (`confirm()`) que
 * insumos/delete-insumo-button.tsx, pero acá sí usamos useActionState:
 * eliminarRecetaAction puede devolver `{error}` (producto dependiente sin
 * cascade, ver actions.ts) y hay que mostrarlo en vez de tragárselo.
 */
export function DeleteRecetaButton({ id, nombre }: { id: number; nombre: string }) {
  const action = eliminarRecetaAction.bind(null, id);
  const [state, formAction, pending] = useActionState<EliminarRecetaState, FormData>(
    action,
    undefined,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(`¿Eliminar la receta "${nombre}"? Esta acción no se puede deshacer.`)
        ) {
          event.preventDefault();
        }
      }}
      className="flex items-center gap-2"
    >
      <button
        type="submit"
        disabled={pending}
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        Eliminar
      </button>
      {state?.error ? <span className="text-xs text-red-600">{state.error}</span> : null}
    </form>
  );
}
