import { getRecetas } from "@/db/recetas";
import { crearProductoAction } from "../actions";
import { ProductoForm } from "../producto-form";

export const dynamic = "force-dynamic";

export default async function NuevoProductoPage() {
  const recetasDisponibles = await getRecetas();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nuevo producto</h1>
      <ProductoForm
        action={crearProductoAction}
        recetasDisponibles={recetasDisponibles}
        submitLabel="Crear producto"
      />
    </div>
  );
}
