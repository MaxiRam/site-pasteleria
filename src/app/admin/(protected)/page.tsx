import Link from "next/link";
import { getInsumos } from "@/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Dashboard lee de la DB en cada visita (cantidad de insumos cargados): no
// debe quedar servido desde una prerenderización estática ni cacheado entre
// admins/mutaciones.
export const dynamic = "force-dynamic";

export default function AdminPage() {
  const insumos = getInsumos();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold">Panel de administración</h1>

      <Card className="w-fit">
        <CardHeader>
          <CardTitle>Insumos cargados</CardTitle>
          <CardDescription>
            {insumos.length} insumo{insumos.length === 1 ? "" : "s"} entre ingredientes y
            packaging.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button render={<Link href="/admin/insumos" />}>Ver insumos</Button>
        </CardContent>
      </Card>
    </div>
  );
}
