"use client";

import { useActionState } from "react";
import { TrashIcon } from "@/components/icons";
import { eliminarPrecioAction, type EliminarPrecioState } from "./actions";

/**
 * Mismo patrón de confirmación mínima (`confirm()`) que
 * insumos/delete-insumo-button.tsx, recetas/delete-receta-button.tsx y
 * productos/delete-producto-button.tsx. A diferencia de esos tres, este
 * borrado no arrastra nada (precios es la hoja del árbol: nada referencia
 * una fila de precios), así que el mensaje no necesita advertir de ningún
 * efecto en cascada.
 */
export function DeletePrecioButton({
  id,
  nombreProducto,
  diametro,
}: {
  id: number;
  nombreProducto: string;
  diametro: number;
}) {
  const action = eliminarPrecioAction.bind(null, id);
  const [state, formAction, pending] = useActionState<EliminarPrecioState, FormData>(
    action,
    undefined,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `¿Eliminar el precio de "${nombreProducto}" en ${diametro}cm? Esta acción no se ` +
              "puede deshacer.",
          )
        ) {
          event.preventDefault();
        }
      }}
      className="flex items-center gap-2"
    >
      <button
        type="submit"
        disabled={pending}
        aria-label="Eliminar"
        title="Eliminar"
        className="rounded border border-zinc-300 p-1.5 text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
      {state?.error ? <span className="text-xs text-red-600">{state.error}</span> : null}
    </form>
  );
}
