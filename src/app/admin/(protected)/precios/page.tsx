import Link from "next/link";
import { getPrecios } from "@/db/precios";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ActualizarPreciosButton } from "./actualizar-precios-button";
import { PrecioRow } from "./precio-row";

// Lista debe reflejar altas/bajas/ediciones inmediatamente: no cachear la
// prerenderización estática de esta página (mismo criterio que
// insumos/recetas/productos).
export const dynamic = "force-dynamic";

/**
 * Sin "Nuevo precio": los precios se generan automáticamente para los 5
 * diámetros al crear un producto (ver
 * admin/(protected)/productos/actions.ts > crearProductoAction), con el
 * margen default de cada diámetro. Para productos creados antes de esa
 * automatización, "Generar precios" en /admin/productos hace el mismo
 * backfill.
 *
 * Margen, precio de venta y confirmado se editan directo en la fila (ver
 * precio-row.tsx) — "Editar" solo hace falta si querés ver el costo
 * recalculado en vivo (por si cambió el precio de algún insumo desde la
 * última vez) antes de decidir el margen nuevo.
 */
export default async function PreciosPage() {
  const precios = await getPrecios();

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Precios</h1>
        <ActualizarPreciosButton />
      </div>

      <p className="text-sm text-muted-foreground">
        Los precios se generan automáticamente (los 5 diámetros) al crear un producto en{" "}
        <Link href="/admin/productos" className="underline">
          Productos
        </Link>
        . Margen, precio de venta y confirmado se editan directo en la fila.
      </p>

      <p className="text-sm text-muted-foreground">
        Regla de visibilidad pública: un producto+diámetro solo aparece en el catálogo del
        cliente si el producto está publicado <span className="font-medium text-foreground">y</span>{" "}
        este precio está confirmado.
      </p>

      {precios.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Todavía no hay precios cargados — creá un producto en{" "}
          <Link href="/admin/productos" className="underline">
            Productos
          </Link>{" "}
          para generarlos automáticamente.
        </p>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>Diámetro</TableHead>
                <TableHead>Costo calculado</TableHead>
                <TableHead>Margen</TableHead>
                <TableHead>Precio sugerido</TableHead>
                <TableHead>Precio de venta</TableHead>
                <TableHead>Confirmado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {precios.map((precio) => (
                <PrecioRow key={precio.id} precio={precio} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
