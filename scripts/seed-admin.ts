/**
 * Seed idempotente del único admin del negocio (no hay flujo de signup).
 * Lee ADMIN_EMAIL / ADMIN_PASSWORD del entorno; si ya existe un admin con
 * ese email no hace nada.
 *
 * Uso:
 *   ADMIN_EMAIL=admin@ejemplo.com ADMIN_PASSWORD=algo-seguro npm run db:seed
 *
 * Corre también en el build de Vercel (ver buildCommand en vercel.json), así
 * que sin ADMIN_EMAIL/ADMIN_PASSWORD sale con código 0 en vez de romper: que
 * falte el seed del admin no tiene por qué tumbar un deploy.
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { admins } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn(
      "Sin ADMIN_EMAIL y/o ADMIN_PASSWORD en el entorno: no se seedea ningún admin. " +
        "Ver .env.example.",
    );
    return;
  }

  const [existing] = await db.select().from(admins).where(eq(admins.email, email));
  if (existing) {
    console.log(`Ya existe un admin con email ${email}, no se hace nada.`);
    return;
  }

  const passwordHash = await hashPassword(password);
  await db.insert(admins).values({ email, passwordHash });
  console.log(`Admin ${email} creado.`);
}

main().catch((err) => {
  console.error("Error al seedear admin:", err);
  process.exit(1);
});
