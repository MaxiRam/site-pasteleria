import { notFound } from "next/navigation";
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

  const producto = Number.isFinite(id) ? await getProductoById(id) : undefined;
  if (!producto) {
    notFound();
  }

  const recetasDisponibles = await getRecetas();
  const actualizarConId = actualizarProductoAction.bind(null, producto.id);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold">Editar producto: {producto.nombrePublico}</h1>
      <ProductoForm
        action={actualizarConId}
        recetasDisponibles={recetasDisponibles}
        submitLabel="Guardar cambios"
        initialValues={{
          nombrePublico: producto.nombrePublico,
          descripcion: producto.descripcion,
          recetaId: producto.recetaId,
          publicado: producto.publicado,
        }}
      />
    </div>
  );
}
