import { TIPOS_INSUMO, type TipoInsumo } from "@/db/schema";
import { crearInsumoAction } from "../actions";
import { InsumoForm } from "../insumo-form";

function tipoValido(tipo: string | undefined): TipoInsumo {
  return TIPOS_INSUMO.includes(tipo as TipoInsumo) ? (tipo as TipoInsumo) : "ingrediente";
}

export default async function NuevoInsumoPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { tipo: tipoParam } = await searchParams;
  const defaultTipo = tipoValido(tipoParam);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Nuevo insumo</h1>
      <InsumoForm
        action={crearInsumoAction}
        defaultTipo={defaultTipo}
        submitLabel="Crear insumo"
      />
    </div>
  );
}
