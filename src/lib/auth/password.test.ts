import { describe, expect, it } from "vitest";
import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
  it("roundtrip: la password correcta verifica contra su propio hash", async () => {
    const stored = await hashPassword("correcta-123");
    await expect(verifyPassword("correcta-123", stored)).resolves.toBe(true);
  });

  it("una password incorrecta falla la verificación", async () => {
    const stored = await hashPassword("correcta-123");
    await expect(verifyPassword("otra-cosa", stored)).resolves.toBe(false);
  });

  it("dos hashes de la misma password son distintos (salt random)", async () => {
    const a = await hashPassword("misma-password");
    const b = await hashPassword("misma-password");
    expect(a).not.toBe(b);
  });

  it("un stored hash malformado (sin ':') no lanza y devuelve false", async () => {
    await expect(verifyPassword("cualquiera", "hash-sin-separador")).resolves.toBe(
      false,
    );
  });

  it("DUMMY_PASSWORD_HASH nunca verifica true (no es un hash real)", async () => {
    await expect(
      verifyPassword("cualquier-password", DUMMY_PASSWORD_HASH),
    ).resolves.toBe(false);
  });
});
