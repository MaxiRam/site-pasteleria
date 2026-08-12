import { getInsumosPorTipo } from "@/db/insumos";
import { crearRecetaAction } from "../actions";
import { RecetaForm } from "../receta-form";

export const dynamic = "force-dynamic";

export default async function NuevaRecetaPage() {
  // Una receta solo usa ingredientes: el packaging se asigna a nivel
  // producto, no receta (ver proyecto.md / AGENTS.md, pedido de packaging).
  const insumosDisponibles = await getInsumosPorTipo("ingrediente");

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Nueva receta</h1>
      <RecetaForm
        action={crearRecetaAction}
        insumosDisponibles={insumosDisponibles}
        submitLabel="Crear receta"
      />
    </div>
  );
}
