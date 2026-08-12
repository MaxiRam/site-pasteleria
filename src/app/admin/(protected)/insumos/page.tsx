import Link from "next/link";
import { getInsumosPorTipo } from "@/db/insumos";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InsumosTable } from "./insumos-table";

// Lista debe reflejar altas/bajas/ediciones inmediatamente: no cachear la
// prerenderización estática de esta página.
export const dynamic = "force-dynamic";

/**
 * Pestañas Ingredientes/Packaging con estado 100% client-side (Tabs de
 * shadcn) — ambas tablas se resuelven en el server y se pasan como children,
 * cambiar de pestaña no dispara ningún request nuevo. Antes esto era
 * ?tipo= como query param con navegación de página completa por cada
 * cambio de pestaña.
 */
export default function InsumosPage() {
  const ingredientes = getInsumosPorTipo("ingrediente");
  const packaging = getInsumosPorTipo("packaging");

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold">Insumos</h1>

      <Tabs defaultValue="ingrediente">
        <TabsList>
          <TabsTrigger value="ingrediente">Ingredientes</TabsTrigger>
          <TabsTrigger value="packaging">Packaging</TabsTrigger>
        </TabsList>

        <TabsContent value="ingrediente" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button render={<Link href="/admin/insumos/nuevo?tipo=ingrediente" />} nativeButton={false}>
              Nuevo ingrediente
            </Button>
          </div>
          <InsumosTable insumos={ingredientes} />
        </TabsContent>

        <TabsContent value="packaging" className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button render={<Link href="/admin/insumos/nuevo?tipo=packaging" />} nativeButton={false}>
              Nuevo packaging
            </Button>
          </div>
          <InsumosTable insumos={packaging} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
