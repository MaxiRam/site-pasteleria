import Link from "next/link";
import { getInsumos } from "@/db";
import { getRecetasQueUsanInsumo } from "@/db/insumos";
import { PencilIcon } from "@/components/icons";
import { formatARS } from "@/lib/format";
import { DeleteInsumoButton } from "./delete-insumo-button";

// Lista debe reflejar altas/bajas/ediciones inmediatamente: no cachear la
// prerenderización estática de esta página.
export const dynamic = "force-dynamic";

const UNIDAD_BASE: Record<string, string> = {
  ml: "ml",
  g: "g",
  kg: "g", // precioUnitarioBase de 'kg' está en gramos (ver calc/insumo.ts)
  unidad: "unidad",
};

export default function InsumosPage() {
  const insumos = getInsumos();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Insumos</h1>
        <Link
          href="/admin/insumos/nuevo"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Nuevo insumo
        </Link>
      </div>

      {insumos.length === 0 ? (
        <p className="text-sm text-zinc-600">Todavía no hay insumos cargados.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Cantidad comprada</th>
                <th className="px-4 py-2 font-medium">Precio de compra</th>
                <th className="px-4 py-2 font-medium">Precio unitario base</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {insumos.map((insumo) => (
                <tr key={insumo.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2 text-zinc-900">{insumo.nombre}</td>
                  <td className="px-4 py-2 text-zinc-700">
                    {insumo.cantidadComprada} {insumo.unidad}
                  </td>
                  <td className="px-4 py-2 text-zinc-700">
                    {formatARS(insumo.precioCompra)}
                  </td>
                  <td className="px-4 py-2 text-zinc-700">
                    {formatARS(insumo.precioUnitarioBase)}/
                    {UNIDAD_BASE[insumo.unidad]}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/insumos/${insumo.id}/editar`}
                        aria-label="Editar"
                        title="Editar"
                        className="rounded border border-zinc-300 p-1.5 text-zinc-700 hover:bg-zinc-100"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <DeleteInsumoButton
                        id={insumo.id}
                        nombre={insumo.nombre}
                        recetasQueLoUsan={getRecetasQueUsanInsumo(insumo.id)}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
