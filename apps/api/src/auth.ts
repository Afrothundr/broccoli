import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { expo } from "@better-auth/expo";
import { prisma } from "./db";

// Google OAuth is env-gated: a deploy without credentials simply doesn't
// offer the provider (sign-in attempts get a clean "provider not found")
// instead of a half-configured flow that fails mid-consent. Credentials come
// from a "Web application" OAuth client in Google Cloud Console with
// <BETTER_AUTH_URL>/api/auth/callback/google as an authorized redirect URI.
const googleOAuth =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined;

// better-auth, adapted for the mobile app (long-lived sessions). The mobile
// client talks to /api/auth/* on this service.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  socialProviders: googleOAuth,
  // A Google sign-in whose (verified) email matches an existing
  // email/password user attaches to that user instead of minting a duplicate
  // account with a second copy of their kitchen.
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
      // Local accounts can't verify their email (no verification flow yet),
      // and better-auth's default refuses to link onto an unverified local
      // account — every Google sign-in for an existing user died with
      // account_not_linked. Relaxing this accepts a known trade-off: someone
      // who pre-registers a password account with your email would be linked
      // to your later Google sign-in. Fine for the closed alpha; restore the
      // default when email verification ships (bd broccoli-api tracker).
      requireLocalEmailVerified: false,
    },
  },
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
  // Behind Railway's proxy the client IP arrives in x-forwarded-for. Without
  // this, better-auth can't tell clients apart and rate-limits ALL users out
  // of one shared per-path bucket (3 sign-in attempts/min globally).
  advanced: {
    ipAddress: {
      ipAddressHeaders: ["x-forwarded-for"],
    },
  },
});
