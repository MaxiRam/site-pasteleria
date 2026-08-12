"use client";

import { useState } from "react";
import { formatARS } from "@/lib/format";

export interface EscaladoItem {
  id: number;
  nombre: string;
  cantidad: number;
  unidadBase: string;
  esHuevo: boolean;
}

export interface EscaladoPorDiametro {
  diametro: number;
  costo: number;
  items: EscaladoItem[];
}

/** Redondeo solo para mostrar en pantalla; los cálculos usan el número completo. */
function formatCantidad(n: number): string {
  return Number(n.toFixed(2)).toString();
}

/**
 * Segmented control para elegir un diámetro entre los 5 soportados y ver
 * solo la lista de ingredientes escalados de ESE tamaño (antes se
 * mostraban los 5 en simultáneo como una grilla de cards). Se descartó
 * `<input type="range">`: el navegador rellena el tramo izquierdo del
 * track hasta el thumb con el accent-color (relleno negro no deseado), y
 * además un slider continuo no es el control correcto para 5 valores
 * discretos fijos — un grupo de botones sí lo es.
 *
 * El cálculo por diámetro ya viene resuelto desde el server (page.tsx) —
 * este componente solo elige cuál mostrar, no recalcula nada.
 */
export function EscaladoTabs({
  porDiametro,
  diametroBase,
}: {
  porDiametro: EscaladoPorDiametro[];
  diametroBase: number;
}) {
  const indiceInicial = Math.max(
    0,
    porDiametro.findIndex((p) => p.diametro === diametroBase),
  );
  const [indice, setIndice] = useState(indiceInicial);

  const actual = porDiametro[indice];

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Diámetro"
        className="inline-flex w-fit rounded border border-zinc-300 bg-white p-0.5"
      >
        {porDiametro.map((p, i) => (
          <button
            key={p.diametro}
            type="button"
            role="tab"
            aria-selected={i === indice}
            onClick={() => setIndice(i)}
            className={
              i === indice
                ? "rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded px-3 py-1.5 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            }
          >
            {p.diametro}cm
          </button>
        ))}
      </div>

      <div className="flex max-w-sm flex-col gap-3 rounded border border-zinc-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900">
            {actual.diametro}cm{actual.diametro === diametroBase ? " (base)" : ""}
          </h2>
          <span className="text-sm font-medium text-zinc-900">{formatARS(actual.costo)}</span>
        </div>

        {actual.items.length === 0 ? (
          <p className="text-sm text-zinc-600">Esta receta todavía no tiene ingredientes.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-sm text-zinc-700">
            {actual.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-2">
                <span>
                  {item.nombre}
                  {item.esHuevo ? " (huevo)" : ""}
                </span>
                <span>
                  {formatCantidad(item.cantidad)} {item.unidadBase}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
