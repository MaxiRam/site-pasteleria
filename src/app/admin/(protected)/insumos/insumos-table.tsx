import Link from "next/link";
import { Pencil } from "lucide-react";
import { getProductosQueUsanPackaging, getRecetasQueUsanInsumo, type Insumo } from "@/db/insumos";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatARS } from "@/lib/format";
import { DeleteInsumoButton } from "./delete-insumo-button";

const UNIDAD_BASE: Record<string, string> = {
  ml: "ml",
  g: "g",
  kg: "g", // precioUnitarioBase de 'kg' está en gramos (ver calc/insumo.ts)
  unidad: "unidad",
};

/**
 * Tabla de una pestaña (ingredientes o packaging). Server component: las
 * consultas de "quién usa este insumo" (para la advertencia de borrado) se
 * resuelven acá mismo, no hace falta pasarlas desde page.tsx.
 */
export function InsumosTable({ insumos }: { insumos: Insumo[] }) {
  if (insumos.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay insumos cargados.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Cantidad comprada</TableHead>
            <TableHead>Precio de compra</TableHead>
            <TableHead>Precio unitario base</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {insumos.map((insumo) => (
            <TableRow key={insumo.id}>
              <TableCell className="font-medium">{insumo.nombre}</TableCell>
              <TableCell>
                {insumo.cantidadComprada} {insumo.unidad}
              </TableCell>
              <TableCell>{formatARS(insumo.precioCompra)}</TableCell>
              <TableCell>
                {formatARS(insumo.precioUnitarioBase)}/{UNIDAD_BASE[insumo.unidad]}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    render={<Link href={`/admin/insumos/${insumo.id}/editar`} />}
                    nativeButton={false}
                    aria-label="Editar"
                    title="Editar"
                  >
                    <Pencil />
                  </Button>
                  <DeleteInsumoButton
                    id={insumo.id}
                    nombre={insumo.nombre}
                    recetasQueLoUsan={getRecetasQueUsanInsumo(insumo.id)}
                    productosQueLoUsan={getProductosQueUsanPackaging(insumo.id)}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
