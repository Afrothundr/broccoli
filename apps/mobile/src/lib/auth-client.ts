import { createAuthClient } from "better-auth/react";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";
import { API_URL } from "./api";

// better-auth client for the mobile app. Sessions are stored securely on the
// device via expo-secure-store and survive app restarts (long-lived mobile
// sessions, per PRD §4). Talks to broccoli-api's /api/auth/* routes.
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [
    expoClient({
      scheme: "broccolimobile",
      storagePrefix: "broccoli",
      storage: SecureStore,
    }),
  ],
});
