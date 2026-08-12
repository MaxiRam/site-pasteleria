"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
 * mostrando el error si `eliminarRecetaAction` devuelve uno.
 *
 * `enviado` (ref, no state) se marca en el `onSubmit` del form — sincrónico
 * con el submit real, no con el click del botón — para no depender de que
 * React batchee el click y el cambio de `pending` en el mismo render. Recién
 * cuando `pending` vuelve a `false` después de una submission marcada se
 * decide si cerrar el diálogo o mostrar el error.
 */
export function DeleteRecetaButton({ id, nombre }: { id: number; nombre: string }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const enviado = useRef(false);
  const action = eliminarRecetaAction.bind(null, id);
  const [state, formAction, pending] = useActionState<EliminarRecetaState, FormData>(
    action,
    undefined,
  );

  useEffect(() => {
    if (!enviado.current || pending) return;
    enviado.current = false;
    if (state?.error) {
      setError(state.error);
    } else {
      setOpen(false);
    }
  }, [pending, state]);

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next) {
      // Diálogo recién abierto: no mostrar el error de un intento anterior.
      setError(null);
    } else {
      enviado.current = false;
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
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
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <form action={formAction} onSubmit={() => (enviado.current = true)}>
            <AlertDialogAction type="submit" variant="destructive" disabled={pending}>
              Eliminar
            </AlertDialogAction>
          </form>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
