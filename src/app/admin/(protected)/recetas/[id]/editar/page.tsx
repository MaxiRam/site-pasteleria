import { notFound } from "next/navigation";
import { getInsumosPorTipo } from "@/db/insumos";
import { getRecetaById } from "@/db/recetas";
import { actualizarRecetaAction } from "../../actions";
import { RecetaForm } from "../../receta-form";

// La receta a editar depende del :id de la URL — nunca debe servirse desde
// una prerenderización estática compartida entre distintos ids.
export const dynamic = "force-dynamic";

export default async function EditarRecetaPage({
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

  // Una receta solo usa ingredientes: el packaging se asigna a nivel
  // producto, no receta (ver proyecto.md / AGENTS.md, pedido de packaging).
  const insumosDisponibles = await getInsumosPorTipo("ingrediente");
  const actualizarConId = actualizarRecetaAction.bind(null, receta.id);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Editar receta: {receta.nombre}
      </h1>
      <RecetaForm
        action={actualizarConId}
        insumosDisponibles={insumosDisponibles}
        submitLabel="Guardar cambios"
        initialValues={{
          nombre: receta.nombre,
          diametroBase: receta.diametroBase,
          insumos: receta.insumos.map((i) => ({
            insumoId: i.insumoId,
            cantidad: i.cantidad,
            esHuevo: i.esHuevo,
          })),
        }}
      />
    </div>
  );
}
