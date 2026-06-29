import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";

// better-auth, adapted for the mobile app (long-lived sessions). The mobile
// client talks to /api/auth/* on this service.
export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  // Allow the mobile app's deep-link scheme so auth redirects/callbacks work.
  trustedOrigins: ["broccolimobile://"],
});
