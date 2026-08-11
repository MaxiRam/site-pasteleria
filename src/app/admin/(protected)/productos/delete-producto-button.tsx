"use client";

import { useActionState } from "react";
import { eliminarProductoAction, type EliminarProductoState } from "./actions";

/**
 * Mismo patrón de confirmación mínima (`confirm()`) que
 * insumos/delete-insumo-button.tsx y recetas/delete-receta-button.tsx, pero
 * el mensaje advierte explícitamente que se borran en cascada los precios
 * asociados (ver comentario en db/productos.ts sobre `precios.productoId`
 * onDelete cascade) — a diferencia de recetas, este delete nunca falla, así
 * que la única oportunidad de avisar al admin del impacto es este confirm().
 */
export function DeleteProductoButton({ id, nombre }: { id: number; nombre: string }) {
  const action = eliminarProductoAction.bind(null, id);
  const [state, formAction, pending] = useActionState<EliminarProductoState, FormData>(
    action,
    undefined,
  );

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `¿Eliminar el producto "${nombre}"? Esta acción no se puede deshacer y también ` +
              "borra los precios cargados para este producto (por cada diámetro).",
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
        className="text-sm text-red-600 hover:underline disabled:opacity-50"
      >
        Eliminar
      </button>
      {state?.error ? <span className="text-xs text-red-600">{state.error}</span> : null}
    </form>
  );
}
