import Link from "next/link";
import { getInsumos } from "@/db";
import { logout } from "@/lib/auth/actions";

// Dashboard lee de la DB en cada visita (cantidad de insumos cargados): no
// debe quedar servido desde una prerenderización estática ni cacheado entre
// admins/mutaciones.
export const dynamic = "force-dynamic";

export default function AdminPage() {
  const insumos = getInsumos();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Panel de administración
      </h1>
      <p className="text-sm text-zinc-600">
        {insumos.length} insumo{insumos.length === 1 ? "" : "s"} cargado
        {insumos.length === 1 ? "" : "s"}. Las secciones de Recetas, Precios
        y Productos se agregan más adelante.
      </p>
      <Link
        href="/admin/insumos"
        className="w-fit rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
      >
        Ver insumos
      </Link>
      <form action={logout}>
        <button
          type="submit"
          className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
