"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChefHat, LayoutDashboard, LogOut, PackageSearch, ShoppingBag, Tag } from "lucide-react";
import { logout } from "@/lib/auth/actions";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/insumos", label: "Insumos", icon: PackageSearch },
  { href: "/admin/recetas", label: "Recetas", icon: ChefHat },
  { href: "/admin/productos", label: "Productos", icon: ShoppingBag },
  { href: "/admin/precios", label: "Precios", icon: Tag },
] as const;

/**
 * Nav del admin, cliente (necesita usePathname para resaltar la sección
 * activa). El logout vive acá abajo, en el footer del sidebar, en vez de
 * en el dashboard como antes — es una acción global, no específica de esa
 * página.
 */
export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href="/admin" className="px-2 py-1.5 text-sm font-semibold text-sidebar-foreground">
          Panel de administración
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
                // Insumos/Recetas/Productos/Precios tienen sub-rutas
                // (/admin/insumos/nuevo, /admin/recetas/[id], etc.) que
                // también deben marcar la sección como activa — pero
                // "/admin" (Dashboard) no debe quedar activo para todas
                // las sub-rutas, solo para el path exacto.
                const activo =
                  href === "/admin" ? pathname === href : pathname.startsWith(href);
                return (
                  <SidebarMenuItem key={href}>
                    <SidebarMenuButton isActive={activo} render={<Link href={href} />}>
                      <Icon />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <form action={logout}>
              <SidebarMenuButton type="submit">
                <LogOut />
                <span>Cerrar sesión</span>
              </SidebarMenuButton>
            </form>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
