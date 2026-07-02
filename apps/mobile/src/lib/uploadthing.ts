import { generateReactNativeHelpers } from "@uploadthing/expo";
import type { OurFileRouter } from "broccoli-api/uploadthing";

import { API_URL } from "./api";
import { authClient } from "./auth-client";

// UploadThing helpers typed against broccoli-api's FileRouter — the same
// type-only workspace import trick as the tRPC client (no codegen).
//
// Uploads are a two-step dance: a handshake with broccoli-api (which gates on
// the better-auth session) and then a direct upload to UploadThing's servers.
// The custom fetch attaches the session cookie only to the handshake requests.
export const { useUploadThing } = generateReactNativeHelpers<OurFileRouter>({
  url: `${API_URL}/api/uploadthing`,
  fetch: (input, init) => {
    const cookie = authClient.getCookie();
    if (!cookie || !input.toString().startsWith(API_URL)) {
      return fetch(input, init);
    }
    const headers = new Headers(init?.headers);
    headers.set("Cookie", cookie);
    return fetch(input, { ...init, headers });
  },
});
