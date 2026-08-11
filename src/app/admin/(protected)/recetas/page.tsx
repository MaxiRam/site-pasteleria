import Link from "next/link";
import { getRecetas } from "@/db/recetas";
import { PencilIcon } from "@/components/icons";
import { DeleteRecetaButton } from "./delete-receta-button";

// Lista debe reflejar altas/bajas/ediciones inmediatamente: no cachear la
// prerenderización estática de esta página (mismo criterio que insumos).
export const dynamic = "force-dynamic";

export default function RecetasPage() {
  const recetas = getRecetas();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Recetas</h1>
        <Link
          href="/admin/recetas/nuevo"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Nueva receta
        </Link>
      </div>

      {recetas.length === 0 ? (
        <p className="text-sm text-zinc-600">Todavía no hay recetas cargadas.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-2 font-medium">Nombre</th>
                <th className="px-4 py-2 font-medium">Diámetro base</th>
                <th className="px-4 py-2 font-medium">Insumos</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {recetas.map((receta) => (
                <tr key={receta.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2 text-zinc-900">{receta.nombre}</td>
                  <td className="px-4 py-2 text-zinc-700">{receta.diametroBase}cm</td>
                  <td className="px-4 py-2 text-zinc-700">{receta.insumos.length}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/recetas/${receta.id}`}
                        className="text-sm text-zinc-700 hover:underline"
                      >
                        Ver
                      </Link>
                      <Link
                        href={`/admin/recetas/${receta.id}/editar`}
                        aria-label="Editar"
                        title="Editar"
                        className="rounded border border-zinc-300 p-1.5 text-zinc-700 hover:bg-zinc-100"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <DeleteRecetaButton id={receta.id} nombre={receta.nombre} />
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
