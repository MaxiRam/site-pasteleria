import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecetaById } from "@/db/recetas";
import { DIAMETROS } from "@/db/schema";
import { calcularCantidadesEscaladas, calcularCostoReceta } from "@/lib/calc";
import { Button } from "@/components/ui/button";
import { EscaladoTabs, type EscaladoPorDiametro } from "../escalado-tabs";

// El detalle depende del :id de la URL — nunca debe servirse desde una
// prerenderización estática compartida entre distintos ids.
export const dynamic = "force-dynamic";

const UNIDAD_BASE: Record<string, string> = {
  ml: "ml",
  g: "g",
  kg: "g", // precioUnitarioBase de 'kg' está en gramos (ver lib/calc/insumo.ts)
  unidad: "unidad",
};

export default async function RecetaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  const receta = Number.isFinite(id) ? await getRecetaById(id) : undefined;
  if (!receta) {
    notFound();
  }

  const insumosBase = receta.insumos.map((ri) => ({
    id: ri.insumoId,
    cantidad: ri.cantidad,
    esHuevo: ri.esHuevo,
  }));
  const huevoId = insumosBase.find((i) => i.esHuevo)?.id;
  const insumoPorId = new Map(receta.insumos.map((ri) => [ri.insumoId, ri.insumo]));

  // Vista de valor real de la feature: para cada uno de los 5 diámetros
  // soportados, cantidades escaladas + costo total (ver proyecto.md, sección
  // "Recetas" > "Escalado por tamaño" / "Costo total de la receta"). Se
  // resuelve todo a datos planos (sin Map) acá en el server component,
  // porque EscaladoTabs es un client component y un Map no es serializable
  // como prop de server a client.
  const porDiametro: EscaladoPorDiametro[] = DIAMETROS.map((diametroDestino) => {
    const escaladas = calcularCantidadesEscaladas(
      insumosBase,
      receta.diametroBase,
      diametroDestino,
    );
    const costo = calcularCostoReceta(
      escaladas.map((e) => ({
        cantidad: e.cantidad,
        precioUnitarioBase: insumoPorId.get(e.id)!.precioUnitarioBase,
      })),
    );

    return {
      diametro: diametroDestino,
      costo,
      items: escaladas.map((e) => {
        const insumo = insumoPorId.get(e.id)!;
        return {
          id: e.id,
          nombre: insumo.nombre,
          cantidad: e.cantidad,
          unidadBase: UNIDAD_BASE[insumo.unidad],
          esHuevo: e.id === huevoId,
        };
      }),
    };
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{receta.nombre}</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            render={<Link href={`/admin/recetas/${receta.id}/editar`} />}
            nativeButton={false}
          >
            Editar
          </Button>
          <Button variant="ghost" render={<Link href="/admin/recetas" />} nativeButton={false}>
            Volver
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        Diámetro base cargado: <span className="font-medium text-foreground">{receta.diametroBase}cm</span>
      </p>

      <EscaladoTabs porDiametro={porDiametro} diametroBase={receta.diametroBase} />
    </div>
  );
}
