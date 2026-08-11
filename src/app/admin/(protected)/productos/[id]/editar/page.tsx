import { notFound } from "next/navigation";
import { getInsumosPorTipo } from "@/db/insumos";
import { getPackagingDeProducto } from "@/db/producto-insumos";
import { getProductoById } from "@/db/productos";
import { getRecetas } from "@/db/recetas";
import { actualizarProductoAction } from "../../actions";
import { ProductoForm } from "../../producto-form";

// El producto a editar depende del :id de la URL — nunca debe servirse
// desde una prerenderización estática compartida entre distintos ids.
export const dynamic = "force-dynamic";

export default async function EditarProductoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  const producto = Number.isFinite(id) ? getProductoById(id) : undefined;
  if (!producto) {
    notFound();
  }

  const recetasDisponibles = getRecetas();
  const packagingDisponible = getInsumosPorTipo("packaging");
  const packagingActual = getPackagingDeProducto(producto.id);
  const actualizarConId = actualizarProductoAction.bind(null, producto.id);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Editar producto: {producto.nombrePublico}
      </h1>
      <ProductoForm
        action={actualizarConId}
        recetasDisponibles={recetasDisponibles}
        packagingDisponible={packagingDisponible}
        submitLabel="Guardar cambios"
        initialValues={{
          nombrePublico: producto.nombrePublico,
          descripcion: producto.descripcion,
          recetaId: producto.recetaId,
          publicado: producto.publicado,
          packaging: packagingActual.map((p) => ({ insumoId: p.insumoId, cantidad: p.cantidad })),
        }}
      />
    </div>
  );
}
