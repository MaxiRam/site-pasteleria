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
 * Slider para elegir un diámetro entre los 5 soportados y ver solo la
 * lista de ingredientes escalados de ESE tamaño (antes se mostraban los 5
 * en simultáneo como una grilla de cards). El cálculo por diámetro ya
 * viene resuelto desde el server (page.tsx) — este componente solo elige
 * cuál mostrar, no recalcula nada.
 */
export function EscaladoSlider({
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
      <div className="flex flex-col gap-2">
        <input
          type="range"
          min={0}
          max={porDiametro.length - 1}
          step={1}
          value={indice}
          onChange={(e) => setIndice(Number(e.target.value))}
          className="w-full max-w-sm accent-zinc-900"
        />
        <div className="flex w-full max-w-sm justify-between text-xs text-zinc-500">
          {porDiametro.map((p, i) => (
            <button
              key={p.diametro}
              type="button"
              onClick={() => setIndice(i)}
              className={
                i === indice
                  ? "font-semibold text-zinc-900"
                  : "hover:text-zinc-700"
              }
            >
              {p.diametro}cm
            </button>
          ))}
        </div>
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
