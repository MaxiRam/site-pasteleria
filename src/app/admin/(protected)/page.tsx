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
          {/* nativeButton={false}: Button (Base UI) espera renderizar un
          <button> real por defecto; al usarlo como <Link> (un <a>) hay que
          avisarle explícitamente o tira un warning en consola. Mismo
          criterio en cualquier otro Button usado como link. */}
          <Button render={<Link href="/admin/insumos" />} nativeButton={false}>
            Ver insumos
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
