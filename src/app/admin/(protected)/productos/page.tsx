import Link from "next/link";
import { getProductos } from "@/db/productos";
import { PencilIcon } from "@/components/icons";
import { DeleteProductoButton } from "./delete-producto-button";
import { GenerarPreciosButton } from "./generar-precios-button";

// Lista debe reflejar altas/bajas/ediciones inmediatamente: no cachear la
// prerenderización estática de esta página (mismo criterio que
// insumos/recetas).
export const dynamic = "force-dynamic";

export default function ProductosPage() {
  const productos = getProductos();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">Productos</h1>
        <Link
          href="/admin/productos/nuevo"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Nuevo producto
        </Link>
      </div>

      {productos.length === 0 ? (
        <p className="text-sm text-zinc-600">Todavía no hay productos cargados.</p>
      ) : (
        <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-2 font-medium">Imagen</th>
                <th className="px-4 py-2 font-medium">Nombre público</th>
                <th className="px-4 py-2 font-medium">Receta</th>
                <th className="px-4 py-2 font-medium">Publicado</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((producto) => (
                <tr key={producto.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2">
                    {/* Sin upload de imágenes todavía (ver proyecto.md,
                    sección "Imágenes y moneda"): placeholder visual fijo. */}
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-zinc-100 text-[10px] text-zinc-500">
                      Sin imagen
                    </div>
                  </td>
                  <td className="px-4 py-2 text-zinc-900">{producto.nombrePublico}</td>
                  <td className="px-4 py-2 text-zinc-700">{producto.receta.nombre}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        producto.publicado
                          ? "rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                          : "rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600"
                      }
                    >
                      {producto.publicado ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/productos/${producto.id}/editar`}
                        aria-label="Editar"
                        title="Editar"
                        className="rounded border border-zinc-300 p-1.5 text-zinc-700 hover:bg-zinc-100"
                      >
                        <PencilIcon className="h-4 w-4" />
                      </Link>
                      <Link
                        href="/admin/precios"
                        className="text-sm text-zinc-700 hover:underline"
                      >
                        Ver precios
                      </Link>
                      <GenerarPreciosButton id={producto.id} />
                      <DeleteProductoButton id={producto.id} nombre={producto.nombrePublico} />
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
