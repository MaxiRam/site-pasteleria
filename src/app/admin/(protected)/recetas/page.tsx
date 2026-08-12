import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { getRecetas } from "@/db/recetas";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteRecetaButton } from "./delete-receta-button";

// Lista debe reflejar altas/bajas/ediciones inmediatamente: no cachear la
// prerenderización estática de esta página (mismo criterio que insumos).
export const dynamic = "force-dynamic";

export default async function RecetasPage() {
  const recetas = await getRecetas();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Recetas</h1>
        <Button render={<Link href="/admin/recetas/nuevo" />} nativeButton={false}>
          Nueva receta
        </Button>
      </div>

      {recetas.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay recetas cargadas.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Diámetro base</TableHead>
                <TableHead>Insumos</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recetas.map((receta) => (
                <TableRow key={receta.id}>
                  <TableCell className="font-medium">{receta.nombre}</TableCell>
                  <TableCell>{receta.diametroBase}cm</TableCell>
                  <TableCell>{receta.insumos.length}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={`/admin/recetas/${receta.id}`} />}
                        nativeButton={false}
                        aria-label="Ver"
                        title="Ver"
                      >
                        <Eye />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={`/admin/recetas/${receta.id}/editar`} />}
                        nativeButton={false}
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Pencil />
                      </Button>
                      <DeleteRecetaButton id={receta.id} nombre={receta.nombre} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
