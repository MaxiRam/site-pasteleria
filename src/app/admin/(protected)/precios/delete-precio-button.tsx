"use client";

import { useActionState, useState } from "react";
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
import { eliminarPrecioAction, type EliminarPrecioState } from "./actions";

/**
 * AlertDialog en vez de `window.confirm()`, mismo criterio que
 * insumos/delete-insumo-button.tsx. A diferencia de recetas/productos, este
 * borrado no arrastra nada (precios es la hoja del árbol: nada referencia
 * una fila de precios) y nunca falla, así que se cierra optimistamente al
 * click.
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
  const [open, setOpen] = useState(false);
  const action = eliminarPrecioAction.bind(null, id);
  const [, formAction] = useActionState<EliminarPrecioState, FormData>(action, undefined);

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
          <AlertDialogTitle>
            ¿Eliminar el precio de &quot;{nombreProducto}&quot; en {diametro}cm?
          </AlertDialogTitle>
          <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <AlertDialogAction type="submit" variant="destructive" onClick={() => setOpen(false)}>
              Eliminar
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
