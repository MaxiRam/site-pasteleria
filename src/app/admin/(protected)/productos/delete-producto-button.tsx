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
import { eliminarProductoAction, type EliminarProductoState } from "./actions";

/**
 * AlertDialog en vez de `window.confirm()`, mismo criterio que
 * insumos/delete-insumo-button.tsx. El mensaje advierte explícitamente que
 * se borran en cascada los precios asociados (ver comentario en
 * db/productos.ts sobre `precios.productoId` onDelete cascade) — este
 * delete nunca falla, así que se cierra optimistamente al click.
 */
export function DeleteProductoButton({ id, nombre }: { id: number; nombre: string }) {
  const [open, setOpen] = useState(false);
  const action = eliminarProductoAction.bind(null, id);
  const [, formAction] = useActionState<EliminarProductoState, FormData>(action, undefined);

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
          <AlertDialogTitle>¿Eliminar el producto &quot;{nombre}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer y también borra los precios cargados para este
            producto (por cada diámetro).
          </AlertDialogDescription>
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
