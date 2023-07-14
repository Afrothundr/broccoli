import { BlitzPage, Routes } from "@blitzjs/next"
import { Anchor, Text } from "@mantine/core"
import Link from "next/link"
import { useRouter } from "next/router"
import { SignupForm } from "src/auth/components/SignupForm"
import { AuthLayout } from "./layout"

const SignupPage: BlitzPage = () => {
  const router = useRouter()

  return (
    <>
      <SignupForm onSuccess={() => router.push(Routes.ItemsPage())} />
      <Text ta="center" mt="lg">
        Have an account?{" "}
        <Link href={Routes.LoginPage()}>
          <Anchor<"a"> weight={700}>Log In</Anchor>
        </Link>
      </Text>
    </>
  )
}

SignupPage.redirectAuthenticatedTo = "/grocery-trips"
SignupPage.getLayout = (page) => <AuthLayout title="Sign Up to Broccoli">{page}</AuthLayout>

export default SignupPage
