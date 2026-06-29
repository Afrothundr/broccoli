import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { expo } from "@better-auth/expo";
import { prisma } from "./db";

// better-auth, adapted for the mobile app (long-lived sessions). The mobile
// client talks to /api/auth/* on this service.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  // Long-lived sessions: mobile users shouldn't be forced to re-auth often.
  // Each request within updateAge slides the 30-day window forward, so an
  // actively-used app effectively stays signed in.
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    updateAge: 60 * 60 * 24, // refresh at most once per day
  },
  // The Expo client uses a deep-link scheme as its origin instead of a web
  // URL. The server-side expo() plugin trusts that scheme and serves the
  // authorization-proxy the native client needs; it must be paired with the
  // expoClient() plugin on the mobile side.
  plugins: [expo()],
  // Allow the mobile app's deep-link scheme so auth redirects/callbacks work.
  trustedOrigins: ["broccolimobile://"],
});
