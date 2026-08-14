"use client";

import { useActionState, useState } from "react";
import { TIPOS_INSUMO, UNIDADES, type TipoInsumo, type Unidad } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { InsumoFormState } from "./actions";

type InsumoFormAction = (
  prevState: InsumoFormState,
  formData: FormData,
) => InsumoFormState | Promise<InsumoFormState>;

export interface InsumoFormValues {
  nombre: string;
  cantidadComprada: number;
  unidad: Unidad;
  precioCompra: number;
  tipo: TipoInsumo;
}

const NOMBRE_TIPO: Record<TipoInsumo, string> = {
  ingrediente: "Ingrediente",
  packaging: "Packaging",
};

// La alta de insumos ahora es una fila inline en la tabla (ver
// nuevo-insumo-row.tsx), no un form aparte — este componente sobrevive solo
// para /[id]/editar, así que initialValues siempre está presente.
export function InsumoForm({
  action,
  initialValues,
  submitLabel,
}: {
  action: InsumoFormAction;
  initialValues: InsumoFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<InsumoFormState, FormData>(
    action,
    undefined,
  );

  const [tipo, setTipo] = useState<TipoInsumo>(initialValues.tipo);
  const [unidad, setUnidad] = useState<Unidad>(initialValues.unidad);

  // Packaging solo se mide en 'unidad' (no tiene sentido "0.5g de caja",
  // ver insumos_packaging_unidad_check en schema.ts) — al elegir packaging,
  // la unidad se fuerza a 'unidad' y el select solo ofrece esa opción.
  function handleTipoChange(nuevoTipo: TipoInsumo) {
    setTipo(nuevoTipo);
    if (nuevoTipo === "packaging") {
      setUnidad("unidad");
    }
  }

  const unidadesDisponibles = tipo === "packaging" ? (["unidad"] as const) : UNIDADES;

  return (
    <form action={formAction} className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" type="text" required defaultValue={initialValues.nombre} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="cantidadComprada">Cantidad comprada</Label>
        <Input
          id="cantidadComprada"
          name="cantidadComprada"
          type="number"
          step="any"
          min="0"
          required
          defaultValue={initialValues.cantidadComprada}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="unidad">Unidad</Label>
        <Select name="unidad" value={unidad} onValueChange={(v) => setUnidad(v as Unidad)}>
          <SelectTrigger id="unidad" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {unidadesDisponibles.map((u) => (
              <SelectItem key={u} value={u}>
                {u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tipo === "packaging" ? (
          <p className="text-xs text-muted-foreground">
            Packaging solo se mide en &quot;unidad&quot;.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="precioCompra">Precio de compra (ARS)</Label>
        <Input
          id="precioCompra"
          name="precioCompra"
          type="number"
          step="any"
          min="0"
          required
          defaultValue={initialValues.precioCompra}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="tipo">Tipo</Label>
        <Select
          name="tipo"
          value={tipo}
          onValueChange={(v) => handleTipoChange(v as TipoInsumo)}
        >
          <SelectTrigger id="tipo" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TIPOS_INSUMO.map((t) => (
              <SelectItem key={t} value={t}>
                {NOMBRE_TIPO[t]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
