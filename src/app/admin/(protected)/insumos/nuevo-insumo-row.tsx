"use client";

import { useActionState, useEffect, useId, useState } from "react";
import { Plus, Save, X } from "lucide-react";
import { calcularPrecioUnitarioBase } from "@/lib/calc";
import { formatARS } from "@/lib/format";
import { UNIDADES, type TipoInsumo, type Unidad } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { crearInsumoAction, type CrearInsumoState } from "./actions";

const UNIDAD_BASE: Record<Unidad, string> = {
  ml: "ml",
  g: "g",
  kg: "g", // precioUnitarioBase de 'kg' está en gramos (ver lib/calc/insumo.ts)
  unidad: "unidad",
};

const NOMBRE_TIPO: Record<TipoInsumo, string> = {
  ingrediente: "ingrediente",
  packaging: "packaging",
};

interface CamposInsumo {
  nombre: string;
  cantidadComprada: string;
  unidad: Unidad;
  precioCompra: string;
}

const CAMPOS_INICIALES: CamposInsumo = {
  nombre: "",
  cantidadComprada: "",
  unidad: UNIDADES[0],
  precioCompra: "",
};

/**
 * Fila de alta inline para /admin/insumos — reemplaza la vieja página
 * /admin/insumos/nuevo. Mismo patrón que PrecioRow (precios/precio-row.tsx):
 * un único <form> headless en la última celda, asociado a los inputs de las
 * otras celdas vía el atributo HTML `form` (un <form> envolviendo la fila
 * rompería la semántica de tabla).
 *
 * El tipo lo fija la pestaña activa (prop `tipo`), no lo elige el usuario
 * acá — por eso no hay Select de Tipo (a diferencia de insumo-form.tsx, que
 * sí lo tiene porque /[id]/editar puede cambiar el tipo de un insumo ya
 * existente). Para packaging tampoco hay Select de unidad: es siempre
 * "unidad" (mismo criterio de negocio que fuerza insumo-form.tsx), fijado
 * con un input hidden en vez de repetir un Select de una sola opción.
 */
export function NuevoInsumoRow({ tipo }: { tipo: TipoInsumo }) {
  const formId = useId();
  const [open, setOpen] = useState(false);
  const [campos, setCampos] = useState(CAMPOS_INICIALES);
  const [error, setError] = useState<string | null>(null);
  const [state, formAction, pending] = useActionState<CrearInsumoState, FormData>(
    crearInsumoAction,
    undefined,
  );

  useEffect(() => {
    if (pending || !state) return;
    if ("error" in state) {
      setError(state.error);
    } else {
      setCampos(CAMPOS_INICIALES);
      setError(null);
      setOpen(false);
    }
  }, [pending, state]);

  function abrir() {
    setError(null);
    setOpen(true);
  }

  function cancelar() {
    setCampos(CAMPOS_INICIALES);
    setError(null);
    setOpen(false);
  }

  if (!open) {
    return (
      <TableRow>
        <TableCell colSpan={5}>
          <Button type="button" variant="ghost" size="sm" onClick={abrir}>
            <Plus />
            Agregar {NOMBRE_TIPO[tipo]}
          </Button>
        </TableCell>
      </TableRow>
    );
  }

  // Preview en vivo del precio unitario base — misma función pura que usa el
  // server (src/lib/calc/insumo.ts), no una reimplementación de la fórmula.
  const unidadEfectiva: Unidad = tipo === "packaging" ? "unidad" : campos.unidad;
  const cantidadNum = Number(campos.cantidadComprada);
  const precioNum = Number(campos.precioCompra);
  const previewValido =
    Number.isFinite(cantidadNum) && cantidadNum > 0 && Number.isFinite(precioNum) && precioNum >= 0;
  const preview = previewValido
    ? `${formatARS(calcularPrecioUnitarioBase(cantidadNum, unidadEfectiva, precioNum))}/${UNIDAD_BASE[unidadEfectiva]}`
    : "—";

  return (
    <>
      <TableRow>
        <TableCell>
          <Input
            form={formId}
            name="nombre"
            placeholder="Nombre"
            autoFocus
            value={campos.nombre}
            onChange={(e) => setCampos((c) => ({ ...c, nombre: e.target.value }))}
          />
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Input
              form={formId}
              type="number"
              step="any"
              min="0"
              name="cantidadComprada"
              placeholder="Cantidad"
              className="w-24"
              value={campos.cantidadComprada}
              onChange={(e) => setCampos((c) => ({ ...c, cantidadComprada: e.target.value }))}
            />
            {tipo === "ingrediente" ? (
              <Select
                form={formId}
                name="unidad"
                value={campos.unidad}
                onValueChange={(v) => setCampos((c) => ({ ...c, unidad: v as Unidad }))}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES.map((u) => (
                    <SelectItem key={u} value={u}>
                      {u}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <>
                <span className="text-sm text-muted-foreground">unidad</span>
                <input type="hidden" form={formId} name="unidad" value="unidad" />
              </>
            )}
          </div>
        </TableCell>
        <TableCell>
          <Input
            form={formId}
            type="number"
            step="any"
            min="0"
            name="precioCompra"
            placeholder="Precio"
            className="w-28"
            value={campos.precioCompra}
            onChange={(e) => setCampos((c) => ({ ...c, precioCompra: e.target.value }))}
          />
        </TableCell>
        <TableCell className="text-muted-foreground">{preview}</TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <form id={formId} action={formAction}>
              <input type="hidden" name="tipo" value={tipo} />
            </form>
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
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={cancelar}
              aria-label="Cancelar"
              title="Cancelar"
            >
              <X />
            </Button>
          </div>
        </TableCell>
      </TableRow>
      {error ? (
        <TableRow>
          <TableCell colSpan={5} className="text-sm text-destructive">
            {error}
          </TableCell>
        </TableRow>
      ) : null}
    </>
  );
}
