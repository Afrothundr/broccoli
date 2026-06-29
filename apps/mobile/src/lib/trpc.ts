import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "broccoli-api/router";
import { authClient } from "./auth-client";
import { API_URL } from "./api";

// Typed tRPC client. `AppRouter` is imported as a type directly from the
// broccoli-api workspace package — no codegen, no publish. The import is
// type-only, so it is erased at build time and never bundled by Metro.
export const trpc = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      // Attach the better-auth session cookie so protected procedures work.
      headers() {
        const cookie = authClient.getCookie();
        return cookie ? { Cookie: cookie } : {};
      },
    }),
  ],
});
