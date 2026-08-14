"use client";

import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  /** Nota de negocio para este diámetro (ej. la reducción de 2/3 en 12cm) —
   * la decide el server (page.tsx), este componente solo la muestra. */
  nota?: string;
  items: EscaladoItem[];
}

/** Redondeo solo para mostrar en pantalla; los cálculos usan el número completo. */
function formatCantidad(n: number): string {
  return Number(n.toFixed(2)).toString();
}

/**
 * Elegir un diámetro entre los 5 soportados y ver solo la lista de
 * ingredientes escalados de ESE tamaño (antes se mostraban los 5 en
 * simultáneo como una grilla de cards). Tabs de shadcn en vez de
 * `<input type="range">`: un slider continuo no es el control correcto
 * para 5 valores discretos fijos.
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
  return (
    <Tabs defaultValue={String(diametroBase)} className="max-w-sm gap-4">
      <TabsList>
        {porDiametro.map((p) => (
          <TabsTrigger key={p.diametro} value={String(p.diametro)}>
            {p.diametro}cm
          </TabsTrigger>
        ))}
      </TabsList>

      {porDiametro.map((p) => (
        <TabsContent key={p.diametro} value={String(p.diametro)}>
          <Card>
            <CardHeader>
              <CardTitle>
                {p.diametro}cm{p.diametro === diametroBase ? " (base)" : ""}
              </CardTitle>
              <CardAction className="text-sm font-medium">{formatARS(p.costo)}</CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {p.nota ? <p className="text-xs text-muted-foreground">{p.nota}</p> : null}
              {p.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Esta receta todavía no tiene ingredientes.
                </p>
              ) : (
                <ul className="flex flex-col gap-1 text-sm">
                  {p.items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2">
                      <span>
                        {item.nombre}
                        {item.esHuevo ? " (huevo)" : ""}
                      </span>
                      <span className="text-muted-foreground">
                        {formatCantidad(item.cantidad)} {item.unidadBase}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      ))}
    </Tabs>
  );
}
