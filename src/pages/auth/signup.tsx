import { BlitzPage, Routes } from "@blitzjs/next"
import { Anchor, Container, Text } from "@mantine/core"
import Link from "next/link"
import { useRouter } from "next/router"
import { SignupForm } from "src/auth/components/SignupForm"
import { AuthLayout } from "./layout"

const SignupPage: BlitzPage = () => {
  const router = useRouter()

  return (
    <Container>
      <SignupForm />
      <Text ta="center" mt="lg">
        Have an account?{" "}
        <Link href={Routes.LoginPage()}>
          <Anchor<"a"> fw={700}>Log In</Anchor>
        </Link>
      </Text>
    </Container>
  )
}

SignupPage.redirectAuthenticatedTo = Routes.DashboardsPage()
SignupPage.getLayout = (page) => <AuthLayout title="Sign Up to Broccoli">{page}</AuthLayout>

export default SignupPage
