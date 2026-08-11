import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Layout compartido para todo /admin/* excepto /admin/login (que vive fuera
 * de este route group `(protected)` a propósito: el login tiene su propio
 * flujo standalone y no debe mostrar nav de secciones que requieren sesión).
 *
 * Nav con Insumos, Recetas y Dashboard únicamente por ahora — Precios/
 * Productos todavía no existen (se agregan en próximos PRs).
 */
export default function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-6 py-3">
        <nav className="flex items-center gap-4">
          <Link href="/admin" className="text-sm font-semibold text-zinc-900">
            Panel de administración
          </Link>
          <Link
            href="/admin/insumos"
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            Insumos
          </Link>
          <Link
            href="/admin/recetas"
            className="text-sm text-zinc-600 hover:text-zinc-900"
          >
            Recetas
          </Link>
        </nav>
      </header>
      <main className="flex flex-1 flex-col px-6 py-8">{children}</main>
    </div>
  );
}
