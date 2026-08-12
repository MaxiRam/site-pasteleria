import Link from "next/link";
import { notFound } from "next/navigation";
import { getInsumosPorTipo } from "@/db/insumos";
import { getPackagingDeProducto } from "@/db/producto-insumos";
import { getPrecioById } from "@/db/precios";
import { actualizarPackagingAction } from "../../actions";
import { PackagingForm } from "../../packaging-form";

// El packaging depende del :id de la URL (que producto+diámetro puntual
// es) — nunca debe servirse desde una prerenderización estática
// compartida entre distintos precios.
export const dynamic = "force-dynamic";

export default async function PackagingPrecioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const id = Number(idParam);

  const precio = Number.isFinite(id) ? getPrecioById(id) : undefined;
  if (!precio) {
    notFound();
  }

  const packagingDisponible = getInsumosPorTipo("packaging");
  const packagingActual = getPackagingDeProducto(precio.productoId, precio.diametro);
  const action = actualizarPackagingAction.bind(null, precio.id);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Packaging: {precio.producto.nombrePublico} — {precio.diametro}cm
        </h1>
        <Link href="/admin/precios" className="text-sm text-zinc-700 hover:underline">
          Volver
        </Link>
      </div>

      <p className="text-sm text-zinc-600">
        Este packaging es solo para el diámetro {precio.diametro}cm de este producto — los demás
        diámetros tienen su propio packaging, independiente de este.
      </p>

      <PackagingForm
        action={action}
        packagingDisponible={packagingDisponible}
        initialValues={{
          packaging: packagingActual.map((p) => ({ insumoId: p.insumoId, cantidad: p.cantidad })),
        }}
      />
    </div>
  );
}
