import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";

/**
 * Hashing de contraseñas con scrypt (node:crypto nativo).
 *
 * Evitamos bcrypt/argon2 a propósito: son dependencias nativas compiladas
 * adicionales, y ya tuvimos fricción con el postinstall de better-sqlite3.
 * scrypt viene en la stdlib de Node y es suficientemente fuerte para este
 * caso de uso (un solo admin, negocio familiar).
 */

const SALT_BYTES = 16;
const KEY_LENGTH = 64;

function deriveKey(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(derivedKey);
    });
  });
}

/**
 * Genera un salt random y deriva el hash de `password` con scrypt.
 * Devuelve un string `salt:hash` (ambos en hex) listo para persistir en
 * admins.passwordHash.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString("hex");
  const derivedKey = await deriveKey(password, salt);
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Verifica `password` contra un hash almacenado (formato `salt:hash`).
 * Nunca lanza por credenciales inválidas: devuelve false. Compara con
 * timingSafeEqual para no filtrar información por timing.
 */
export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const separatorIndex = stored.indexOf(":");
  if (separatorIndex === -1) {
    return false;
  }

  const salt = stored.slice(0, separatorIndex);
  const hashHex = stored.slice(separatorIndex + 1);

  let storedHash: Buffer;
  try {
    storedHash = Buffer.from(hashHex, "hex");
  } catch {
    return false;
  }

  const derivedKey = await deriveKey(password, salt);

  if (derivedKey.length !== storedHash.length) {
    return false;
  }

  return timingSafeEqual(derivedKey, storedHash);
}
