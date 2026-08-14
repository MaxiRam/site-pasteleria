"use client";

import { useActionState, useRef, useState } from "react";
import type { Insumo } from "@/db/insumos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { PackagingFormState } from "./actions";

type PackagingFormAction = (
  prevState: PackagingFormState,
  formData: FormData,
) => PackagingFormState | Promise<PackagingFormState>;

export interface PackagingFormValues {
  packaging: { insumoId: number; cantidad: number }[];
}

/**
 * Filas dinámicas insumo+cantidad — mismo patrón que las filas de
 * receta-form.tsx (id estable propio, no el índice), pero sin `esHuevo` (no
 * aplica a packaging) y sin exigir mínimo 1 fila (el packaging de un
 * producto+diámetro puede quedar vacío).
 */
interface FilaPackaging {
  id: number;
  insumoId: number;
  cantidad: string;
}

export function PackagingForm({
  action,
  packagingDisponible,
  initialValues,
}: {
  action: PackagingFormAction;
  packagingDisponible: Insumo[];
  initialValues: PackagingFormValues;
}) {
  const [state, formAction, pending] = useActionState<PackagingFormState, FormData>(
    action,
    undefined,
  );

  const nextFilaId = useRef(0);
  const [filas, setFilas] = useState<FilaPackaging[]>(() =>
    initialValues.packaging.map((p) => ({
      id: nextFilaId.current++,
      insumoId: p.insumoId,
      cantidad: String(p.cantidad),
    })),
  );

  function agregarFila() {
    if (packagingDisponible.length === 0) return;
    setFilas((prev) => [
      ...prev,
      { id: nextFilaId.current++, insumoId: packagingDisponible[0].id, cantidad: "" },
    ]);
  }

  function quitarFila(id: number) {
    setFilas((prev) => prev.filter((fila) => fila.id !== id));
  }

  function actualizarFila(id: number, patch: Partial<FilaPackaging>) {
    setFilas((prev) => prev.map((fila) => (fila.id === id ? { ...fila, ...patch } : fila)));
  }

  const packagingJson = JSON.stringify(
    filas.map((fila) => ({ insumoId: fila.insumoId, cantidad: Number(fila.cantidad) })),
  );

  return (
    <form action={formAction} className="flex w-full max-w-2xl flex-col gap-4">
      <input type="hidden" name="packagingJson" value={packagingJson} />

      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Packaging</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={agregarFila}
          disabled={packagingDisponible.length === 0}
        >
          Agregar packaging
        </Button>
      </div>

      {packagingDisponible.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay insumos de packaging cargados. Creá uno en la pestaña &quot;Packaging&quot; de
          Insumos.
        </p>
      ) : null}

      {filas.map((fila) => (
        <div key={fila.id} className="flex flex-wrap items-center gap-3 rounded-md border p-3">
          <Select
            value={String(fila.insumoId)}
            onValueChange={(v) => actualizarFila(fila.id, { insumoId: Number(v) })}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {packagingDisponible.map((insumo) => (
                <SelectItem key={insumo.id} value={String(insumo.id)}>
                  {insumo.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            step="any"
            min="0"
            placeholder="Cantidad"
            value={fila.cantidad}
            onChange={(e) => actualizarFila(fila.id, { cantidad: e.target.value })}
            className="w-28"
          />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => quitarFila(fila.id)}
            className="ml-auto text-destructive hover:text-destructive"
          >
            Quitar
          </Button>
        </div>
      ))}

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Guardando..." : "Guardar packaging"}
      </Button>
    </form>
  );
}
