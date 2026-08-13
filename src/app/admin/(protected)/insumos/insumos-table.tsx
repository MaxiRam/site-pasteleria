import Link from "next/link";
import { Pencil } from "lucide-react";
import {
  getProductosQueUsanPackaging,
  getRecetasQueUsanInsumo,
  type Insumo,
} from "@/db/insumos";
import type { TipoInsumo } from "@/db/schema";
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
import { NuevoInsumoRow } from "./nuevo-insumo-row";

const UNIDAD_BASE: Record<string, string> = {
  ml: "ml",
  g: "g",
  kg: "g", // precioUnitarioBase de 'kg' está en gramos (ver calc/insumo.ts)
  unidad: "unidad",
};

const NOMBRE_TIPO: Record<TipoInsumo, string> = {
  ingrediente: "ingredientes",
  packaging: "packaging",
};

/**
 * Tabla de una pestaña (ingredientes o packaging). Server component: las
 * consultas de "quién usa este insumo" (para la advertencia de borrado) se
 * resuelven acá mismo, no hace falta pasarlas desde page.tsx.
 *
 * Siempre renderiza la tabla (aun con 0 insumos): la fila de alta
 * (NuevoInsumoRow) vive adentro, no tiene sentido esconder la tabla entera
 * cuando todavía no hay nada cargado.
 */
export async function InsumosTable({ insumos, tipo }: { insumos: Insumo[]; tipo: TipoInsumo }) {
  // Una consulta por insumo, todas en paralelo. No se puede resolver inline
  // en el JSX porque estos helpers son async (ver src/db/insumos.ts).
  const cascadePorInsumoId = new Map(
    await Promise.all(
      insumos.map(
        async (insumo) =>
          [
            insumo.id,
            {
              recetasQueLoUsan: await getRecetasQueUsanInsumo(insumo.id),
              productosQueLoUsan: await getProductosQueUsanPackaging(insumo.id),
            },
          ] as const,
      ),
    ),
  );

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
          <NuevoInsumoRow tipo={tipo} />
          {insumos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-muted-foreground">
                Todavía no hay {NOMBRE_TIPO[tipo]} cargados.
              </TableCell>
            </TableRow>
          ) : null}
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
                    recetasQueLoUsan={cascadePorInsumoId.get(insumo.id)!.recetasQueLoUsan}
                    productosQueLoUsan={cascadePorInsumoId.get(insumo.id)!.productosQueLoUsan}
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
