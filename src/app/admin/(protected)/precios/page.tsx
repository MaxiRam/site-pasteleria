import Link from "next/link";
import { getPrecios } from "@/db/precios";
import { PrecioRow } from "./precio-row";

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
 * backfill.
 *
 * Margen, precio de venta y confirmado se editan directo en la fila (ver
 * precio-row.tsx) — "Editar" solo hace falta si querés ver el costo
 * recalculado en vivo (por si cambió el precio de algún insumo desde la
 * última vez) antes de decidir el margen nuevo.
 */
export default async function PreciosPage() {
  const precios = await getPrecios();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Precios</h1>

      <p className="text-sm text-zinc-600">
        Los precios se generan automáticamente (los 5 diámetros) al crear un producto en{" "}
        <Link href="/admin/productos" className="underline">
          Productos
        </Link>
        . Margen, precio de venta y confirmado se editan directo en la fila.
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
                <PrecioRow key={precio.id} precio={precio} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
