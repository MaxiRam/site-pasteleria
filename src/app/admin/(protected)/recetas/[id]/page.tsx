import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecetaById } from "@/db/recetas";
import { DIAMETROS } from "@/db/schema";
import { calcularCantidadesEscaladas, calcularCostoReceta } from "@/lib/calc";
import { formatARS } from "@/lib/format";

// El detalle depende del :id de la URL — nunca debe servirse desde una
// prerenderización estática compartida entre distintos ids.
export const dynamic = "force-dynamic";

const UNIDAD_BASE: Record<string, string> = {
  ml: "ml",
  g: "g",
  kg: "g", // precioUnitarioBase de 'kg' está en gramos (ver lib/calc/insumo.ts)
  unidad: "unidad",
};

/** Redondeo solo para mostrar en pantalla; los cálculos usan el número completo. */
function formatCantidad(n: number): string {
  return Number(n.toFixed(2)).toString();
}

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
  // "Recetas" > "Escalado por tamaño" / "Costo total de la receta").
  const porDiametro = DIAMETROS.map((diametroDestino) => {
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

    return { diametro: diametroDestino, escaladas, costo };
  });

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">{receta.nombre}</h1>
        <div className="flex items-center gap-3">
          <Link
            href={`/admin/recetas/${receta.id}/editar`}
            className="text-sm text-zinc-700 hover:underline"
          >
            Editar
          </Link>
          <Link href="/admin/recetas" className="text-sm text-zinc-700 hover:underline">
            Volver
          </Link>
        </div>
      </div>

      <p className="text-sm text-zinc-600">
        Diámetro base cargado: <span className="font-medium">{receta.diametroBase}cm</span>
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {porDiametro.map(({ diametro, escaladas, costo }) => (
          <div
            key={diametro}
            className="flex flex-col gap-3 rounded border border-zinc-200 bg-white p-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-zinc-900">
                {diametro}cm{diametro === receta.diametroBase ? " (base)" : ""}
              </h2>
              <span className="text-sm font-medium text-zinc-900">{formatARS(costo)}</span>
            </div>

            <ul className="flex flex-col gap-1 text-sm text-zinc-700">
              {escaladas.map((e) => {
                const insumo = insumoPorId.get(e.id)!;
                return (
                  <li key={e.id} className="flex items-center justify-between gap-2">
                    <span>
                      {insumo.nombre}
                      {e.id === huevoId ? " (huevo)" : ""}
                    </span>
                    <span>
                      {formatCantidad(e.cantidad)} {UNIDAD_BASE[insumo.unidad]}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
