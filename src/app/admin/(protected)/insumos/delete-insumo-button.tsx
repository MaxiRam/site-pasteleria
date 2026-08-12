"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { eliminarInsumoAction } from "./actions";

/**
 * AlertDialog en vez de `window.confirm()` — modal real, mismo criterio de
 * advertencia que antes (recetas y/o productos afectados por el cascade de
 * borrado, ver src/db/insumos.ts > eliminarInsumo).
 *
 * `eliminarInsumoAction` no tiene estado de error (siempre borra o tira), así
 * que cerramos el diálogo optimistamente al click — la lista se actualiza
 * un instante después vía revalidatePath.
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
  const [open, setOpen] = useState(false);
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
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button variant="ghost" size="icon-sm" />}
        aria-label="Eliminar"
        title="Eliminar"
      >
        <Trash2 className="text-destructive" />
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar el insumo &quot;{nombre}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer.{advertenciaCascade}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={action}>
            <AlertDialogAction type="submit" variant="destructive" onClick={() => setOpen(false)}>
              Eliminar
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
