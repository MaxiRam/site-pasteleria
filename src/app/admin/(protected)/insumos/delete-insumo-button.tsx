"use client";

import { eliminarInsumoAction } from "./actions";

/**
 * Confirmación mínima en el cliente (`confirm()`) antes de borrar — no hace
 * falta un modal elaborado para un panel de un solo admin.
 */
export function DeleteInsumoButton({
  id,
  nombre,
}: {
  id: number;
  nombre: string;
}) {
  const action = eliminarInsumoAction.bind(null, id);

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (!window.confirm(`¿Eliminar el insumo "${nombre}"? Esta acción no se puede deshacer.`)) {
          event.preventDefault();
        }
      }}
    >
      <button type="submit" className="text-sm text-red-600 hover:underline">
        Eliminar
      </button>
    </form>
  );
}
