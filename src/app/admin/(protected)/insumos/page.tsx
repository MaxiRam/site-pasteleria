import { getInsumosPorTipo } from "@/db/insumos";
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
 *
 * Alta de insumos: fila inline dentro de cada tabla (ver
 * insumos-table.tsx > NuevoInsumoRow), no una página aparte.
 */
export default async function InsumosPage() {
  const [ingredientes, packaging] = await Promise.all([
    getInsumosPorTipo("ingrediente"),
    getInsumosPorTipo("packaging"),
  ]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold">Insumos</h1>

      <Tabs defaultValue="ingrediente">
        <TabsList>
          <TabsTrigger value="ingrediente">Ingredientes</TabsTrigger>
          <TabsTrigger value="packaging">Packaging</TabsTrigger>
        </TabsList>

        <TabsContent value="ingrediente" className="flex flex-col gap-4">
          <InsumosTable insumos={ingredientes} tipo="ingrediente" />
        </TabsContent>

        <TabsContent value="packaging" className="flex flex-col gap-4">
          <InsumosTable insumos={packaging} tipo="packaging" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
