import type { ReactNode } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

/**
 * Layout compartido para todo /admin/* excepto /admin/login (que vive fuera
 * de este route group `(protected)` a propósito: el login tiene su propio
 * flujo standalone y no debe mostrar el sidebar de secciones que requieren
 * sesión).
 */
export default function ProtectedAdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <header className="flex h-12 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="h-4" />
        </header>
        <main className="flex flex-1 flex-col gap-6 p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
