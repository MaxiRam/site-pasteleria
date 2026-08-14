"use client";

import { useActionState, useState } from "react";
import type { Receta } from "@/db/recetas";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { ProductoFormState } from "./actions";

type ProductoFormAction = (
  prevState: ProductoFormState,
  formData: FormData,
) => ProductoFormState | Promise<ProductoFormState>;

export interface ProductoFormValues {
  nombrePublico: string;
  descripcion: string | null;
  recetaId: number;
  publicado: boolean;
}

/**
 * El packaging NO se maneja acá: es distinto por diámetro (una torta de
 * 12cm puede llevar una caja distinta que una de 25cm), y el diámetro es
 * un concepto de Precios, no de Productos — se edita desde
 * /admin/precios/[id]/packaging (ver esa página y src/db/producto-insumos.ts).
 */
export function ProductoForm({
  action,
  recetasDisponibles,
  initialValues,
  submitLabel,
}: {
  action: ProductoFormAction;
  recetasDisponibles: Receta[];
  initialValues?: ProductoFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<ProductoFormState, FormData>(
    action,
    undefined,
  );

  const [recetaId, setRecetaId] = useState<number | undefined>(
    initialValues?.recetaId ?? recetasDisponibles[0]?.id,
  );

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombrePublico">Nombre público</Label>
        <Input
          id="nombrePublico"
          name="nombrePublico"
          type="text"
          required
          defaultValue={initialValues?.nombrePublico}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="descripcion">Descripción</Label>
        <Textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          defaultValue={initialValues?.descripcion ?? ""}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="recetaId">Receta</Label>
        {recetasDisponibles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay recetas cargadas todavía. Creá una receta antes de armar un producto.
          </p>
        ) : (
          <Select
            name="recetaId"
            value={recetaId !== undefined ? String(recetaId) : undefined}
            onValueChange={(v) => setRecetaId(Number(v))}
          >
            <SelectTrigger id="recetaId" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {recetasDisponibles.map((receta) => (
                <SelectItem key={receta.id} value={String(receta.id)}>
                  {receta.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Label className="flex items-center gap-2 text-sm text-muted-foreground">
        <Switch name="publicado" defaultChecked={initialValues?.publicado ?? false} />
        Publicado (requiere además un precio confirmado para verse en el catálogo público)
      </Label>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending || recetasDisponibles.length === 0}>
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
