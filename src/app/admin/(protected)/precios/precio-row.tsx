"use client";

import { useActionState, useId, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronUp, Package, Pencil, Save } from "lucide-react";
import { calcularMargenReal } from "@/lib/calc";
import { formatARS } from "@/lib/format";
import type { PrecioConProducto } from "@/db/precios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { TableCell, TableRow } from "@/components/ui/table";
import { actualizarPrecioAction, type PrecioFormState } from "./actions";
import { DeletePrecioButton } from "./delete-precio-button";

const MARGEN_STEP = 1;
const MARGEN_MAX = 99;
const MARGEN_MIN = 0;

/**
 * Fila editable de la lista de precios: margen (con stepper ±1%), precio de
 * venta y confirmado, todo en un solo submit — sin ir a "Editar margen".
 *
 * Los inputs quedan en sus <TableCell> normales (no hay un <form> envolviendo
 * la fila: <form> como ancestro de <tr> rompe la semántica de tabla). En vez
 * de eso, un único <form> "headless" vive en la última celda y los
 * campos de las otras celdas se asocian a él vía el atributo HTML `form`
 * (soportado nativamente, no hace falta JS extra para juntarlos).
 */
export function PrecioRow({ precio }: { precio: PrecioConProducto }) {
  const formId = useId();
  const action = actualizarPrecioAction.bind(null, precio.id);
  const [state, formAction, pending] = useActionState<PrecioFormState, FormData>(
    action,
    undefined,
  );

  const margenInicial = Math.round(precio.margenPct * 100 * 100) / 100;
  const [margenPct, setMargenPct] = useState(String(margenInicial));

  function ajustarMargen(delta: number) {
    setMargenPct((prev) => {
      const actual = Number(prev);
      const base = Number.isFinite(actual) ? actual : margenInicial;
      const siguiente = Math.min(MARGEN_MAX, Math.max(MARGEN_MIN, base + delta));
      return String(Math.round(siguiente * 100) / 100);
    });
  }

  const margenRealPct =
    precio.confirmado && precio.precioVenta !== null && precio.precioVenta > 0
      ? calcularMargenReal(precio.costoCalculado, precio.precioVenta) * 100
      : null;

  return (
    <TableRow>
      <TableCell className="font-medium">{precio.producto.nombrePublico}</TableCell>
      <TableCell>{precio.diametro}cm</TableCell>
      <TableCell>{formatARS(precio.costoCalculado)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => ajustarMargen(MARGEN_STEP)}
              className="flex items-center justify-center rounded-t-sm border border-b-0 border-input px-0.5 text-muted-foreground hover:bg-muted"
              aria-label="Aumentar margen 1%"
            >
              <ChevronUp className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => ajustarMargen(-MARGEN_STEP)}
              className="flex items-center justify-center rounded-b-sm border border-input px-0.5 text-muted-foreground hover:bg-muted"
              aria-label="Disminuir margen 1%"
            >
              <ChevronDown className="size-3" />
            </button>
          </div>
          <Input
            form={formId}
            type="number"
            name="margenPct"
            step="any"
            min={MARGEN_MIN}
            max="99.99"
            required
            value={margenPct}
            onChange={(e) => setMargenPct(e.target.value)}
            className="w-16 text-center"
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      </TableCell>
      <TableCell>{formatARS(precio.precioSugerido)}</TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <Input
            form={formId}
            type="number"
            name="precioVenta"
            step="any"
            min="0"
            placeholder="—"
            defaultValue={precio.precioVenta ?? ""}
            className="w-24"
          />
          {margenRealPct !== null ? (
            <span className="text-xs text-muted-foreground">({margenRealPct.toFixed(1)}%)</span>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <Switch form={formId} name="confirmado" defaultChecked={precio.confirmado} />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <form id={formId} action={formAction} />
          <Button
            type="submit"
            form={formId}
            variant="ghost"
            size="icon-sm"
            disabled={pending}
            aria-label="Guardar"
            title="Guardar"
          >
            <Save />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href={`/admin/precios/${precio.id}/editar`} />}
            nativeButton={false}
            aria-label="Editar"
            title="Editar"
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link href={`/admin/precios/${precio.id}/packaging`} />}
            nativeButton={false}
            aria-label={`Packaging para ${precio.diametro}cm`}
            title={`Packaging para ${precio.diametro}cm`}
          >
            <Package />
          </Button>
          <DeletePrecioButton
            id={precio.id}
            nombreProducto={precio.producto.nombrePublico}
            diametro={precio.diametro}
          />
        </div>
        {state?.error ? <p className="mt-1 text-xs text-destructive">{state.error}</p> : null}
      </TableCell>
    </TableRow>
  );
}
