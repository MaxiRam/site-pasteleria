"use client";

import { useActionState, useState } from "react";
import { formatARS } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { PrecioFormState } from "./actions";

type EditarPrecioFormAction = (
  prevState: PrecioFormState,
  formData: FormData,
) => PrecioFormState | Promise<PrecioFormState>;

/**
 * Form de edición de precio. Producto y diámetro NO son editables una vez
 * creado el precio (ver src/db/precios.ts, actualizarPrecio) — se muestran
 * como texto de solo lectura, no como inputs.
 *
 * `costoActual`/`precioSugeridoActual` vienen recalculados por la página
 * (mismos helpers que crearPrecio/actualizarPrecio, ver
 * precios/[id]/editar/page.tsx) con el margen que está guardado en este
 * momento, para que el admin vea el número real antes de decidir el nuevo
 * margen. "Copiar sugerido" solo copia ese número ya calculado por el
 * server al campo de precio de venta — no reimplementa ninguna fórmula.
 */
export function EditarPrecioForm({
  action,
  nombreProducto,
  diametro,
  costoActual,
  precioSugeridoActual,
  margenPctInicial,
  precioVentaInicial,
  confirmadoInicial,
  submitLabel,
}: {
  action: EditarPrecioFormAction;
  nombreProducto: string;
  diametro: number;
  costoActual: number;
  precioSugeridoActual: number;
  margenPctInicial: number;
  precioVentaInicial: number | null;
  confirmadoInicial: boolean;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<PrecioFormState, FormData>(
    action,
    undefined,
  );

  const [precioVenta, setPrecioVenta] = useState<string>(
    precioVentaInicial !== null ? String(precioVentaInicial) : "",
  );

  function copiarSugerido() {
    setPrecioVenta(String(Math.round(precioSugeridoActual * 100) / 100));
  }

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Producto</span>
        <p className="text-sm">{nombreProducto}</p>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Diámetro</span>
        <p className="text-sm">{diametro}cm</p>
      </div>

      <div className="flex flex-col gap-1 rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground">
        <p>
          Costo calculado actual: <span className="font-medium text-foreground">{formatARS(costoActual)}</span>
        </p>
        <p>
          Precio sugerido actual (con el margen guardado):{" "}
          <span className="font-medium text-foreground">{formatARS(precioSugeridoActual)}</span>
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="margenPct">Margen (%)</Label>
        <Input
          id="margenPct"
          name="margenPct"
          type="number"
          step="any"
          min="0"
          max="99.99"
          required
          defaultValue={margenPctInicial * 100}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="precioVenta">Precio de venta</Label>
        <div className="flex items-center gap-2">
          <Input
            id="precioVenta"
            name="precioVenta"
            type="number"
            step="any"
            min="0"
            value={precioVenta}
            onChange={(e) => setPrecioVenta(e.target.value)}
          />
          <Button type="button" variant="outline" size="sm" onClick={copiarSugerido} className="whitespace-nowrap">
            Copiar sugerido
          </Button>
        </div>
      </div>

      <Label className="flex items-center gap-2 text-sm">
        <Switch name="confirmado" defaultChecked={confirmadoInicial} />
        Confirmado
      </Label>

      <p className="text-xs text-muted-foreground">
        Un producto+diámetro solo es visible en el catálogo público si el producto está
        publicado y este precio está confirmado.
      </p>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
