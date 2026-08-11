"use client";

import { useActionState, useState } from "react";
import type { ProductoConReceta } from "@/db/productos";
import { DIAMETROS, type Diametro } from "@/db/schema";
import { MARGEN_POR_DIAMETRO } from "@/lib/calc";
import type { PrecioFormState } from "./actions";

type PrecioFormAction = (
  prevState: PrecioFormState,
  formData: FormData,
) => PrecioFormState | Promise<PrecioFormState>;

/** Margen default de un diámetro (proyecto.md), expresado como porcentaje
 * humano (0-100) para prellenar el input — la fracción [0,1) que espera la
 * capa de datos se reconstruye recién en actions.ts. */
function margenDefaultPorcentaje(diametro: Diametro): string {
  return String(MARGEN_POR_DIAMETRO[diametro] * 100);
}

/**
 * Form de alta de precio. Producto y diámetro se eligen acá (a diferencia
 * de la edición, donde quedan fijos); costo y precio sugerido NO se piden
 * (se calculan en el server al guardar, ver src/db/precios.ts).
 *
 * El campo de margen se prellena con el default de MARGEN_POR_DIAMETRO
 * según el diámetro elegido, pero solo mientras el admin no lo haya tocado
 * a mano: `margenTocado` se pone en true en el primer onChange manual del
 * input de margen, y a partir de ahí cambiar el diámetro ya no pisa el
 * valor que el admin eligió.
 */
export function PrecioForm({
  action,
  productosDisponibles,
  submitLabel,
}: {
  action: PrecioFormAction;
  productosDisponibles: ProductoConReceta[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<PrecioFormState, FormData>(
    action,
    undefined,
  );

  const [diametro, setDiametro] = useState<Diametro>(DIAMETROS[0]);
  const [margenPct, setMargenPct] = useState<string>(margenDefaultPorcentaje(DIAMETROS[0]));
  const [margenTocado, setMargenTocado] = useState(false);

  function handleDiametroChange(nuevo: Diametro) {
    setDiametro(nuevo);
    if (!margenTocado) {
      setMargenPct(margenDefaultPorcentaje(nuevo));
    }
  }

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="productoId" className="text-sm font-medium text-zinc-700">
          Producto
        </label>
        {productosDisponibles.length === 0 ? (
          <p className="text-sm text-zinc-600">
            No hay productos cargados todavía. Creá un producto antes de armar un precio.
          </p>
        ) : (
          <select
            id="productoId"
            name="productoId"
            required
            defaultValue={productosDisponibles[0]?.id}
            className="rounded border border-zinc-300 px-3 py-2 text-sm"
          >
            {productosDisponibles.map((producto) => (
              <option key={producto.id} value={producto.id}>
                {producto.nombrePublico}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="diametro" className="text-sm font-medium text-zinc-700">
          Diámetro
        </label>
        <select
          id="diametro"
          name="diametro"
          required
          value={diametro}
          onChange={(e) => handleDiametroChange(Number(e.target.value) as Diametro)}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        >
          {DIAMETROS.map((d) => (
            <option key={d} value={d}>
              {d}cm
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="margenPct" className="text-sm font-medium text-zinc-700">
          Margen (%)
        </label>
        <input
          id="margenPct"
          name="margenPct"
          type="number"
          step="any"
          min="0"
          max="99.99"
          required
          value={margenPct}
          onChange={(e) => {
            setMargenPct(e.target.value);
            setMargenTocado(true);
          }}
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
        <p className="text-xs text-zinc-500">
          Prellenado con el margen default de este diámetro; podés editarlo.
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="precioVenta" className="text-sm font-medium text-zinc-700">
          Precio de venta (opcional)
        </label>
        <input
          id="precioVenta"
          name="precioVenta"
          type="number"
          step="any"
          min="0"
          className="rounded border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-zinc-700">
        <input type="checkbox" name="confirmado" />
        Confirmado
      </label>

      <p className="text-xs text-zinc-500">
        El costo y el precio sugerido se calculan automáticamente al guardar. Un
        producto+diámetro solo es visible en el catálogo público si el producto está publicado
        y su precio está confirmado.
      </p>

      {state?.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      <button
        type="submit"
        disabled={pending || productosDisponibles.length === 0}
        className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Guardando..." : submitLabel}
      </button>
    </form>
  );
}
