import { notFound } from "next/navigation";
import { getInsumoById } from "@/db/insumos";
import { actualizarInsumoAction } from "../../actions";
import { InsumoForm } from "../../insumo-form";

// El insumo a editar depende del :id de la URL — nunca debe servirse desde
// una prerenderización estática compartida entre distintos ids.
export const dynamic = "force-dynamic";

export default async function EditarInsumoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  const insumo = Number.isFinite(id) ? await getInsumoById(id) : undefined;
  if (!insumo) {
    notFound();
  }

  const actualizarConId = actualizarInsumoAction.bind(null, insumo.id);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Editar insumo: {insumo.nombre}
      </h1>
      <InsumoForm
        action={actualizarConId}
        submitLabel="Guardar cambios"
        initialValues={{
          nombre: insumo.nombre,
          cantidadComprada: insumo.cantidadComprada,
          unidad: insumo.unidad,
          precioCompra: insumo.precioCompra,
          tipo: insumo.tipo,
        }}
      />
    </div>
  );
}
