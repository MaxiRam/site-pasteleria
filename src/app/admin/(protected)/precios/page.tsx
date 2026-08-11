import Link from "next/link";
import { getPrecios } from "@/db/precios";
import { calcularMargenReal } from "@/lib/calc";
import { formatARS } from "@/lib/format";
import { DeletePrecioButton } from "./delete-precio-button";

// Lista debe reflejar altas/bajas/ediciones inmediatamente: no cachear la
// prerenderización estática de esta página (mismo criterio que
// insumos/recetas/productos).
export const dynamic = "force-dynamic";

/**
 * Sin "Nuevo precio": los precios se generan automáticamente para los 5
 * diámetros al crear un producto (ver
 * admin/(protected)/productos/actions.ts > crearProductoAction), con el
 * margen default de cada diámetro. Para productos creados antes de esa
 * automatización, "Generar precios" en /admin/productos hace el mismo
 * backfill. Acá el admin solo ajusta margen/precio de venta/confirmado por
 * fila (o borra una fila puntual si hace falta recrearla).
 */
export default function PreciosPage() {
  const precios = getPrecios();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Precios</h1>

      <p className="text-sm text-zinc-600">
        Los precios se generan automáticamente (los 5 diámetros) al crear un producto en{" "}
        <Link href="/admin/productos" className="underline">
          Productos
        </Link>
        . Acá se ajusta margen, precio de venta y confirmación de cada uno.
      </p>

      <p className="text-sm text-zinc-600">
        Regla de visibilidad pública: un producto+diámetro solo aparece en el catálogo del
        cliente si el producto está publicado <span className="font-medium">y</span> este
        precio está confirmado.
      </p>

      {precios.length === 0 ? (
        <p className="text-sm text-zinc-600">
          Todavía no hay precios cargados — creá un producto en{" "}
          <Link href="/admin/productos" className="underline">
            Productos
          </Link>{" "}
          para generarlos automáticamente.
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-zinc-200 bg-white">
          <table className="w-full min-w-max text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-2 font-medium">Producto</th>
                <th className="px-4 py-2 font-medium">Diámetro</th>
                <th className="px-4 py-2 font-medium">Costo calculado</th>
                <th className="px-4 py-2 font-medium">Margen</th>
                <th className="px-4 py-2 font-medium">Precio sugerido</th>
                <th className="px-4 py-2 font-medium">Precio de venta</th>
                <th className="px-4 py-2 font-medium">Confirmado</th>
                <th className="px-4 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {precios.map((precio) => (
                <tr key={precio.id} className="border-b border-zinc-100 last:border-0">
                  <td className="px-4 py-2 text-zinc-900">{precio.producto.nombrePublico}</td>
                  <td className="px-4 py-2 text-zinc-700">{precio.diametro}cm</td>
                  <td className="px-4 py-2 text-zinc-700">{formatARS(precio.costoCalculado)}</td>
                  <td className="px-4 py-2 text-zinc-700">
                    {(precio.margenPct * 100).toFixed(1)}%
                  </td>
                  <td className="px-4 py-2 text-zinc-700">{formatARS(precio.precioSugerido)}</td>
                  <td className="px-4 py-2 text-zinc-700">
                    {precio.precioVenta !== null ? formatARS(precio.precioVenta) : "—"}
                    {precio.confirmado && precio.precioVenta !== null && precio.precioVenta > 0 ? (
                      <span className="ml-1 text-xs text-zinc-500">
                        ({(calcularMargenReal(precio.costoCalculado, precio.precioVenta) * 100).toFixed(1)}%)
                      </span>
                    ) : null}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        precio.confirmado
                          ? "rounded bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
                          : "rounded bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600"
                      }
                    >
                      {precio.confirmado ? "Sí" : "No"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/precios/${precio.id}/editar`}
                        className="text-sm text-zinc-700 hover:underline"
                      >
                        Editar
                      </Link>
                      <DeletePrecioButton
                        id={precio.id}
                        nombreProducto={precio.producto.nombrePublico}
                        diametro={precio.diametro}
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
