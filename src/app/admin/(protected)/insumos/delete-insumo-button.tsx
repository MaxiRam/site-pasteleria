"use client";

import { TrashIcon } from "@/components/icons";
import { eliminarInsumoAction } from "./actions";

/**
 * Confirmación mínima en el cliente (`confirm()`) antes de borrar — no hace
 * falta un modal elaborado para un panel de un solo admin.
 *
 * `receta_insumos.insumo_id` y `producto_insumos.insumo_id` tienen onDelete
 * cascade (ver src/db/schema.ts): borrar un insumo en uso lo saca en
 * cascada de esas recetas y/o productos sin avisar en la DB.
 * `recetasQueLoUsan` (resuelto en insumos/page.tsx con
 * getRecetasQueUsanInsumo) y `productosQueLoUsan` (con
 * getProductosQueUsanPackaging) permiten advertirlo acá en un solo mensaje,
 * mismo criterio que DeleteRecetaButton/DeleteProductoButton con sus propios
 * cascades.
 */
export function DeleteInsumoButton({
  id,
  nombre,
  recetasQueLoUsan,
  productosQueLoUsan,
}: {
  id: number;
  nombre: string;
  recetasQueLoUsan: string[];
  productosQueLoUsan: string[];
}) {
  const action = eliminarInsumoAction.bind(null, id);

  const partesCascade: string[] = [];
  if (recetasQueLoUsan.length > 0) {
    partesCascade.push(
      `${recetasQueLoUsan.length} receta${recetasQueLoUsan.length === 1 ? "" : "s"}: ${recetasQueLoUsan.join(", ")}`,
    );
  }
  if (productosQueLoUsan.length > 0) {
    partesCascade.push(
      `${productosQueLoUsan.length} producto${productosQueLoUsan.length === 1 ? "" : "s"} (packaging): ${productosQueLoUsan.join(", ")}`,
    );
  }
  const advertenciaCascade =
    partesCascade.length > 0 ? ` Se va a quitar de ${partesCascade.join(" y de ")}.` : "";

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
