"use client";

import { useActionState, useRef, useState } from "react";
import type { Insumo } from "@/db/insumos";
import { DIAMETROS, type Diametro } from "@/db/schema";
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
import type { RecetaFormState } from "./actions";

type RecetaFormAction = (
  prevState: RecetaFormState,
  formData: FormData,
) => RecetaFormState | Promise<RecetaFormState>;

export interface RecetaFormValues {
  nombre: string;
  diametroBase: Diametro;
  insumos: { insumoId: number; cantidad: number; esHuevo: boolean }[];
}

/**
 * Fila del form, con id estable propio (no el índice del array: al
 * agregar/quitar filas el índice cambia y rompería el `key` de React y la
 * identidad de cada switch "es huevo"). `cantidad` se guarda como string
 * mientras se edita (input controlado) y se parsea a número recién al
 * armar el JSON que se manda al server.
 */
interface Fila {
  id: number;
  insumoId: number;
  cantidad: string;
  esHuevo: boolean;
}

export function RecetaForm({
  action,
  insumosDisponibles,
  initialValues,
  submitLabel,
}: {
  action: RecetaFormAction;
  insumosDisponibles: Insumo[];
  initialValues?: RecetaFormValues;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<RecetaFormState, FormData>(
    action,
    undefined,
  );

  const nextFilaId = useRef(0);
  const [filas, setFilas] = useState<Fila[]>(() => {
    if (initialValues && initialValues.insumos.length > 0) {
      return initialValues.insumos.map((i) => ({
        id: nextFilaId.current++,
        insumoId: i.insumoId,
        cantidad: String(i.cantidad),
        esHuevo: i.esHuevo,
      }));
    }
    if (insumosDisponibles.length > 0) {
      return [
        {
          id: nextFilaId.current++,
          insumoId: insumosDisponibles[0].id,
          cantidad: "",
          esHuevo: false,
        },
      ];
    }
    return [];
  });

  const [diametroBase, setDiametroBase] = useState<Diametro>(
    initialValues?.diametroBase ?? DIAMETROS[0],
  );

  function agregarFila() {
    if (insumosDisponibles.length === 0) return;
    setFilas((prev) => [
      ...prev,
      {
        id: nextFilaId.current++,
        insumoId: insumosDisponibles[0].id,
        cantidad: "",
        esHuevo: false,
      },
    ]);
  }

  function quitarFila(id: number) {
    setFilas((prev) => prev.filter((fila) => fila.id !== id));
  }

  function actualizarFila(id: number, patch: Partial<Fila>) {
    setFilas((prev) => prev.map((fila) => (fila.id === id ? { ...fila, ...patch } : fila)));
  }

  function marcarHuevo(id: number, esHuevo: boolean) {
    setFilas((prev) =>
      prev.map((fila) => ({ ...fila, esHuevo: esHuevo && fila.id === id })),
    );
  }

  // Serializado que consume parseRecetaInput en actions.ts. cantidad viaja
  // como string mientras se edita (input controlado); acá se intenta
  // convertir a número, pero la validación real (>0, finito, etc.) vive en
  // el server — esto es solo para no mandar strings vacíos como NaN sin
  // avisar.
  const insumosJson = JSON.stringify(
    filas.map((fila) => ({
      insumoId: fila.insumoId,
      cantidad: Number(fila.cantidad),
      esHuevo: fila.esHuevo,
    })),
  );

  return (
    <form action={formAction} className="flex w-full max-w-2xl flex-col gap-6">
      <input type="hidden" name="insumosJson" value={insumosJson} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" name="nombre" type="text" required defaultValue={initialValues?.nombre} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="diametroBase">Diámetro base</Label>
        <Select
          name="diametroBase"
          value={String(diametroBase)}
          onValueChange={(v) => setDiametroBase(Number(v) as Diametro)}
        >
          <SelectTrigger id="diametroBase" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DIAMETROS.map((diametro) => (
              <SelectItem key={diametro} value={String(diametro)}>
                {diametro}cm
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Insumos de la receta</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={agregarFila}
            disabled={insumosDisponibles.length === 0}
          >
            Agregar insumo
          </Button>
        </div>

        {insumosDisponibles.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay insumos cargados todavía. Creá insumos antes de armar una receta.
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
                {insumosDisponibles.map((insumo) => (
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

            <Label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={fila.esHuevo}
                onCheckedChange={(checked) => marcarHuevo(fila.id, checked)}
              />
              Es huevo
            </Label>

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
      </div>

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <Button type="submit" disabled={pending || filas.length === 0} className="self-start">
        {pending ? "Guardando..." : submitLabel}
      </Button>
    </form>
  );
}
