"use client";

import { useActionState, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { recalcularTodosLosPreciosAction, type RecalcularPreciosState } from "./actions";

/**
 * Recalcula costo/precio sugerido de TODOS los precios de una sola vez (ver
 * recalcularTodosLosPreciosAction / db/precios.ts > recalcularTodosLosPrecios)
 * — útil cuando cambió el precio de compra de uno o más insumos: el costo de
 * cada precio recién se refleja al guardar esa fila individualmente, así que
 * sin este botón un cambio de precio de insumo deja muchas filas
 * desactualizadas hasta guardarlas una por una.
 *
 * No hace falta confirm(): mismo criterio que GenerarPreciosButton /
 * actualizarPackagingAction — no toca margen/precioVenta/confirmado de
 * ninguna fila, solo recalcula el costo.
 */
export function ActualizarPreciosButton() {
  const [state, formAction, pending] = useActionState<RecalcularPreciosState, FormData>(
    recalcularTodosLosPreciosAction,
    undefined,
  );
  const [mensaje, setMensaje] = useState<string | null>(null);

  useEffect(() => {
    if (pending || !state) return;

    if ("error" in state) {
      setMensaje(state.error);
      return;
    }

    setMensaje(
      `${state.cantidad} precio${state.cantidad === 1 ? "" : "s"} actualizado${
        state.cantidad === 1 ? "" : "s"
      }.`,
    );
    const timeout = setTimeout(() => setMensaje(null), 4000);
    return () => clearTimeout(timeout);
  }, [pending, state]);

  const esError = Boolean(state && "error" in state);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <Button type="submit" variant="outline" disabled={pending}>
        <RefreshCw className={pending ? "animate-spin" : undefined} />
        {pending ? "Actualizando..." : "Actualizar precios"}
      </Button>
      {mensaje ? (
        <span className={esError ? "text-xs text-destructive" : "text-xs text-muted-foreground"}>
          {mensaje}
        </span>
      ) : null}
    </form>
  );
}
