import { BlitzPage, Routes } from "@blitzjs/next"
import { Anchor, Text } from "@mantine/core"
import Link from "next/link"
import { useRouter } from "next/router"
import { LoginForm } from "src/auth/components/LoginForm"
import { AuthLayout } from "./layout"

const LoginPage: BlitzPage = () => {
  const router = useRouter()

  return (
    <>
      <LoginForm
        onSuccess={(user) => {
          return router.push(`/users/${user.id}`)
        }}
      />
      <Text ta="center" mt="lg">
        Don&apos;t have an account?{" "}
        <Link href={Routes.SignupPage()}>
          <Anchor<"a"> weight={700}>Sign Up</Anchor>
        </Link>
      </Text>
    </>
  )
}

LoginPage.getLayout = (page) => <AuthLayout title="Welcome to Broccoli">{page}</AuthLayout>

export default LoginPage
