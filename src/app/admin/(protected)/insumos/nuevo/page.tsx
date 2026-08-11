import { crearInsumoAction } from "../actions";
import { InsumoForm } from "../insumo-form";

export default function NuevoInsumoPage() {
  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Nuevo insumo</h1>
      <InsumoForm action={crearInsumoAction} submitLabel="Crear insumo" />
    </div>
  );
}
