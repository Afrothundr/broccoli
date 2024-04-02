import { BlitzPage, Routes } from "@blitzjs/next"
import { Anchor, Stack, Text } from "@mantine/core"
import Link from "next/link"
import { useRouter } from "next/router"
import { LoginForm } from "src/auth/components/LoginForm"
import { AuthLayout } from "./layout"

const LoginPage: BlitzPage = () => {
  const router = useRouter()

  return (
    <>
      <LoginForm />
      <Stack align="center" mt="lg">
        <div>
          <Anchor>
            <Link href={Routes.ForgotPasswordPage()}>Forgot your password?</Link>
          </Anchor>
        </div>
        <Text ta="center">
          Don&apos;t have an account?{" "}
          <Link href={Routes.SignupPage()}>
            <Text c="blue" fw={700}>
              Sign Up
            </Text>
          </Link>
        </Text>
      </Stack>
    </>
  )
}

LoginPage.redirectAuthenticatedTo = Routes.DashboardsPage()
LoginPage.getLayout = (page) => <AuthLayout title="Welcome to Broccoli">{page}</AuthLayout>

export default LoginPage
