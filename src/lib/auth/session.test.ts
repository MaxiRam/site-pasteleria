import { afterEach, describe, expect, it, vi } from "vitest";
import { createSessionToken, verifySessionToken } from "./session";

describe("createSessionToken / verifySessionToken", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("roundtrip: un token recién creado verifica y devuelve el adminId", () => {
    const token = createSessionToken(42);
    expect(verifySessionToken(token)).toEqual({ adminId: 42 });
  });

  it("un token tamperado (firma modificada) es rechazado", () => {
    const token = createSessionToken(1);
    const separatorIndex = token.indexOf(".");
    const payload = token.slice(0, separatorIndex);
    const signature = token.slice(separatorIndex + 1);

    // Cambia un solo char de la firma, preservando el largo.
    const tamperedChar = signature[0] === "a" ? "b" : "a";
    const tamperedSignature = tamperedChar + signature.slice(1);
    const tampered = `${payload}.${tamperedSignature}`;

    expect(verifySessionToken(tampered)).toBeNull();
  });

  it("un token con el payload alterado (misma firma) es rechazado", () => {
    const token = createSessionToken(1);
    const separatorIndex = token.indexOf(".");
    const payload = token.slice(0, separatorIndex);
    const signature = token.slice(separatorIndex + 1);
    const tamperedPayload = payload.endsWith("A")
      ? `B${payload.slice(1)}`
      : `A${payload.slice(1)}`;

    expect(verifySessionToken(`${tamperedPayload}.${signature}`)).toBeNull();
  });

  it("un token vencido (más de 7 días) es rechazado", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = createSessionToken(7);

    vi.setSystemTime(new Date("2026-01-09T00:00:00Z")); // +8 días
    expect(verifySessionToken(token)).toBeNull();
  });

  it("un token justo antes de vencer todavía es válido", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const token = createSessionToken(7);

    vi.setSystemTime(new Date("2026-01-07T23:00:00Z")); // +6 días 23h
    expect(verifySessionToken(token)).toEqual({ adminId: 7 });
  });

  it("un token malformado (sin separador) es rechazado", () => {
    expect(verifySessionToken("token-sin-punto")).toBeNull();
  });

  it("un token vacío es rechazado", () => {
    expect(verifySessionToken("")).toBeNull();
  });
});
