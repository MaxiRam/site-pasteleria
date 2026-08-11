import { getInsumos } from "@/db";
import { crearRecetaAction } from "../actions";
import { RecetaForm } from "../receta-form";

export const dynamic = "force-dynamic";

export default function NuevaRecetaPage() {
  const insumosDisponibles = getInsumos();

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
