"use client";

import { useActionState, useEffect, useState } from "react";
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
import { eliminarRecetaAction, type EliminarRecetaState } from "./actions";

/**
 * AlertDialog en vez de `window.confirm()`, mismo criterio que
 * insumos/delete-insumo-button.tsx — pero a diferencia de ese, esta acción sí
 * puede fallar (producto dependiente sin cascade, ver actions.ts), así que
 * el diálogo NO se cierra optimistamente al click: se queda abierto
 * mostrando el error si `eliminarRecetaAction` devuelve uno, y recién se
 * cierra solo cuando una submission termina sin error.
 */
export function DeleteRecetaButton({ id, nombre }: { id: number; nombre: string }) {
  const [open, setOpen] = useState(false);
  const [intentado, setIntentado] = useState(false);
  const action = eliminarRecetaAction.bind(null, id);
  const [state, formAction, pending] = useActionState<EliminarRecetaState, FormData>(
    action,
    undefined,
  );

  useEffect(() => {
    if (intentado && !pending && !state?.error) {
      setOpen(false);
      setIntentado(false);
    }
  }, [intentado, pending, state]);

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
          <AlertDialogTitle>¿Eliminar la receta &quot;{nombre}&quot;?</AlertDialogTitle>
          <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
        </AlertDialogHeader>
        {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction}>
            <AlertDialogAction
              type="submit"
              variant="destructive"
              disabled={pending}
              onClick={() => setIntentado(true)}
            >
              Eliminar
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
