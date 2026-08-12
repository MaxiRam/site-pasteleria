import { notFound } from "next/navigation";
import { calcularCostoProductoEnDiametro, getPrecioById } from "@/db/precios";
import { calcularPrecioSugerido } from "@/lib/calc";
import { actualizarPrecioAction } from "../../actions";
import { EditarPrecioForm } from "../../editar-precio-form";

// El precio a editar depende del :id de la URL — nunca debe servirse desde
// una prerenderización estática compartida entre distintos ids.
export const dynamic = "force-dynamic";

export default async function EditarPrecioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  const precio = Number.isFinite(id) ? await getPrecioById(id) : undefined;
  if (!precio) {
    notFound();
  }

  // Costo y precio sugerido ACTUALES, recalculados al cargar la página con
  // el margen guardado en este momento (mismos helpers que
  // crearPrecio/actualizarPrecio, ver src/db/precios.ts) — así el admin ve
  // el número real antes de decidir el margen nuevo, en vez de un valor
  // persistido que puede haber quedado desactualizado por cambios en el
  // precio de los insumos.
  const costoActual = await calcularCostoProductoEnDiametro(precio.productoId, precio.diametro);
  const precioSugeridoActual = calcularPrecioSugerido(costoActual, precio.margenPct);

  const actualizarConId = actualizarPrecioAction.bind(null, precio.id);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Editar precio: {precio.producto.nombrePublico} — {precio.diametro}cm
      </h1>
      <EditarPrecioForm
        action={actualizarConId}
        nombreProducto={precio.producto.nombrePublico}
        diametro={precio.diametro}
        costoActual={costoActual}
        precioSugeridoActual={precioSugeridoActual}
        margenPctInicial={precio.margenPct}
        precioVentaInicial={precio.precioVenta}
        confirmadoInicial={precio.confirmado}
        submitLabel="Guardar cambios"
      />
    </div>
  );
}
