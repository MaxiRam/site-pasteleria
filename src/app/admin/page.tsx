import { logout } from "@/lib/auth/actions";

export default function AdminPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-4">
      <h1 className="text-2xl font-semibold text-zinc-900">
        Panel de administración
      </h1>
      <p className="text-sm text-zinc-600">
        Login funcionando. Las secciones de Insumos, Recetas, Precios y
        Productos se agregan más adelante.
      </p>
      <form action={logout}>
        <button
          type="submit"
          className="rounded bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
        >
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
