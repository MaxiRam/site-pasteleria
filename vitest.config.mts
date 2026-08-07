import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // SESSION_SECRET es requerido (fail-fast) por src/lib/auth/session.ts
    // al importarse. Los tests necesitan uno seteado; nunca usar este
    // valor fuera de tests.
    env: {
      SESSION_SECRET: "test-session-secret-not-for-production",
    },
  },
});
