import Link from "next/link";
import { Eye, Pencil } from "lucide-react";
import { getProductos } from "@/db/productos";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteProductoButton } from "./delete-producto-button";
import { GenerarPreciosButton } from "./generar-precios-button";

// Lista debe reflejar altas/bajas/ediciones inmediatamente: no cachear la
// prerenderización estática de esta página (mismo criterio que
// insumos/recetas).
export const dynamic = "force-dynamic";

export default async function ProductosPage() {
  const productos = await getProductos();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Productos</h1>
        <Button render={<Link href="/admin/productos/nuevo" />} nativeButton={false}>
          Nuevo producto
        </Button>
      </div>

      {productos.length === 0 ? (
        <p className="text-sm text-muted-foreground">Todavía no hay productos cargados.</p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Imagen</TableHead>
                <TableHead>Nombre público</TableHead>
                <TableHead>Receta</TableHead>
                <TableHead>Publicado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {productos.map((producto) => (
                <TableRow key={producto.id}>
                  <TableCell>
                    {/* Sin upload de imágenes todavía (ver proyecto.md,
                    sección "Imágenes y moneda"): placeholder visual fijo. */}
                    <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
                      Sin imagen
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{producto.nombrePublico}</TableCell>
                  <TableCell className="text-muted-foreground">{producto.receta.nombre}</TableCell>
                  <TableCell>
                    <Badge variant={producto.publicado ? "default" : "secondary"}>
                      {producto.publicado ? "Sí" : "No"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href={`/admin/productos/${producto.id}/editar`} />}
                        nativeButton={false}
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        render={<Link href="/admin/precios" />}
                        nativeButton={false}
                        aria-label="Ver precios"
                        title="Ver precios"
                      >
                        <Eye />
                      </Button>
                      <GenerarPreciosButton id={producto.id} />
                      <DeleteProductoButton id={producto.id} nombre={producto.nombrePublico} />
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
