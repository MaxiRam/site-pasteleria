"use client";

import { TrashIcon } from "@/components/icons";
import { eliminarInsumoAction } from "./actions";

/**
 * Confirmación mínima en el cliente (`confirm()`) antes de borrar — no hace
 * falta un modal elaborado para un panel de un solo admin.
 *
 * `receta_insumos.insumo_id` tiene onDelete cascade (ver src/db/schema.ts):
 * borrar un insumo en uso lo saca en cascada de esas recetas sin avisar en
 * la DB. `recetasQueLoUsan` (resuelto en insumos/page.tsx con
 * getRecetasQueUsanInsumo) permite advertirlo acá, mismo criterio que
 * DeleteRecetaButton/DeleteProductoButton con sus propios cascades.
 */
export function DeleteInsumoButton({
  id,
  nombre,
  recetasQueLoUsan,
}: {
  id: number;
  nombre: string;
  recetasQueLoUsan: string[];
}) {
  const action = eliminarInsumoAction.bind(null, id);

  const advertenciaCascade =
    recetasQueLoUsan.length > 0
      ? ` Se va a quitar de ${recetasQueLoUsan.length} receta${recetasQueLoUsan.length === 1 ? "" : "s"}: ${recetasQueLoUsan.join(", ")}.`
      : "";

  return (
    <form
      action={action}
      onSubmit={(event) => {
        if (
          !window.confirm(
            `¿Eliminar el insumo "${nombre}"? Esta acción no se puede deshacer.${advertenciaCascade}`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        aria-label="Eliminar"
        title="Eliminar"
        className="rounded border border-zinc-300 p-1.5 text-red-600 hover:bg-red-50"
      >
        <TrashIcon className="h-4 w-4" />
      </button>
    </form>
  );
}
