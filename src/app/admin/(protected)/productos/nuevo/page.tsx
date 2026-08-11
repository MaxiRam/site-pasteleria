import { getRecetas } from "@/db/recetas";
import { crearProductoAction } from "../actions";
import { ProductoForm } from "../producto-form";

export const dynamic = "force-dynamic";

export default function NuevoProductoPage() {
  const recetasDisponibles = getRecetas();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Nuevo producto</h1>
      <ProductoForm
        action={crearProductoAction}
        recetasDisponibles={recetasDisponibles}
        submitLabel="Crear producto"
      />
    </div>
  );
}
