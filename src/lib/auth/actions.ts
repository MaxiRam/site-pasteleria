"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "./password";
import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  SESSION_COOKIE_OPTIONS,
} from "./session";

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 días

// Mensaje deliberadamente genérico: no debe distinguir "email inexistente"
// de "password incorrecta", para no facilitar enumeración de usuarios.
const GENERIC_LOGIN_ERROR = "Email o contraseña incorrectos";

// PENDIENTE: sin rate limiting ni lockout de intentos fallidos. Aceptable
// por ahora (un solo admin, bajo tráfico), pero si esto se expone a
// internet sin más capas (ej. proxy/CDN con rate limit) conviene agregar
// un límite de intentos por IP/email antes de producción.

export async function login(
  formData: FormData,
): Promise<{ error: string } | void> {
  const emailRaw = formData.get("email");
  const passwordRaw = formData.get("password");

  if (typeof emailRaw !== "string" || typeof passwordRaw !== "string") {
    return { error: GENERIC_LOGIN_ERROR };
  }

  // Mismo criterio de normalización que insumos.nombre (ver proyecto.md):
  // lowercase antes de comparar, para no depender de la capitalización.
  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw;

  if (!email || !password) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const [admin] = await db.select().from(admins).where(eq(admins.email, email));

  // Si el email no existe, igual corremos verifyPassword (contra un hash
  // dummy) para pagar el mismo costo de scrypt que la rama de password
  // incorrecta. Sin esto, un email inexistente responde en <1ms y uno
  // existente tarda el costo completo de scrypt: un timing side-channel
  // que filtra qué emails están registrados aunque el mensaje de error
  // sea idéntico (medido: ~35ms vs ~0.3ms, ~100x).
  const passwordOk = await verifyPassword(
    password,
    admin?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );
  if (!admin || !passwordOk) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const token = createSessionToken(admin.id);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...SESSION_COOKIE_OPTIONS,
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect("/admin");
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/admin/login");
}

// Wrapper con la firma que espera useActionState (prevState, formData) =>
// state. login() en sí mismo respeta la firma pedida (formData) => ...;
// este wrapper solo la adapta para el form de login.
export async function loginFormAction(
  _prevState: { error: string } | undefined,
  formData: FormData,
): Promise<{ error: string } | undefined> {
  const result = await login(formData);
  return result ?? undefined;
}
