import { auth } from "../src/auth";

// Seeds a local test user through better-auth's own server API so password
// hashing / account rows are identical to a real sign-up. Idempotent: if the
// user already exists, verifies the password still signs in instead.
//
// Run: pnpm --filter broccoli-api db:seed:test
// Sign in from the mobile app with these credentials against the local API.

const TEST_EMAIL = "test@broccoli.local";
const TEST_PASSWORD = "broccoli-test-1234";
const TEST_NAME = "Broccoli Test User";

async function main() {
  const signUp = await auth.api.signUpEmail({
    body: { email: TEST_EMAIL, password: TEST_PASSWORD, name: TEST_NAME },
  }).catch(() => null);

  if (signUp?.user) {
    console.log(`Created test user: ${TEST_EMAIL}`);
  } else {
    // Likely already seeded — confirm the credentials still work.
    const signIn = await auth.api.signInEmail({
      body: { email: TEST_EMAIL, password: TEST_PASSWORD },
    }).catch(() => null);
    if (!signIn?.user) {
      throw new Error(
        `Test user ${TEST_EMAIL} exists but the password doesn't match. ` +
          "Delete the row (and its sessions/accounts) and re-run."
      );
    }
    console.log(`Test user already exists and password verified: ${TEST_EMAIL}`);
  }

  console.log(`  email:    ${TEST_EMAIL}`);
  console.log(`  password: ${TEST_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
