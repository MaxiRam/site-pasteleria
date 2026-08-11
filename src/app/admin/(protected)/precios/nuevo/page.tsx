import { getProductos } from "@/db/productos";
import { crearPrecioAction } from "../actions";
import { PrecioForm } from "../precio-form";

export const dynamic = "force-dynamic";

export default function NuevoPrecioPage() {
  const productosDisponibles = getProductos();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Nuevo precio</h1>
      <PrecioForm
        action={crearPrecioAction}
        productosDisponibles={productosDisponibles}
        submitLabel="Crear precio"
      />
    </div>
  );
}
