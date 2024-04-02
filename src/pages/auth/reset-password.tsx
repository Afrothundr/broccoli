import { BlitzPage, Routes } from "@blitzjs/next"
import { useMutation } from "@blitzjs/rpc"
import { Alert, Button, Group, PasswordInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { assert } from "blitz"
import Link from "next/link"
import { useRouter } from "next/router"
import { useState } from "react"
import resetPassword from "src/auth/mutations/resetPassword"
import { RequiredValidation } from "src/core/types"
import { AuthLayout } from "./layout"

const ResetPasswordPage: BlitzPage = () => {
  const router = useRouter()
  const token = router.query.token?.toString()
  const [resetPasswordMutation, { isSuccess }] = useMutation(resetPassword)
  const [error, setError] = useState<string>()

  const form = useForm({
    initialValues: {
      password: "",
      passwordConfirmation: "",
    },
    validate: {
      password: RequiredValidation,
      passwordConfirmation: (value, values) =>
        value === values.password ? null : "passwords must match",
    },
  })

  const onSubmit = async (values) => {
    setError(undefined)
    try {
      assert(token, "token is required.")
      await resetPasswordMutation({ ...values, token })
    } catch (error: any) {
      if (error.name === "ResetPasswordError") {
        setError(error.message)
      } else {
        setError("Sorry, we had an unexpected error. Please try again.")
      }
    }
  }

  return (
    <div>
      {isSuccess ? (
        <div>
          <h2>Password Reset Successfully</h2>
          <p>
            Go to the <Link href={Routes.Home()}>homepage</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
          <PasswordInput withAsterisk label="New Password" {...form.getInputProps("password")} />
          <PasswordInput
            withAsterisk
            label="Confirm New Password"
            {...form.getInputProps("passwordConfirmation")}
          />
          <Group justify="flex-end" mt="md">
            <Button type="submit">Reset Password</Button>
          </Group>
        </form>
      )}
      {error && (
        <Alert title="Error:" variant="light" color="pink" mt={2}>
          {error}
        </Alert>
      )}
    </div>
  )
}

ResetPasswordPage.getLayout = (page) => <AuthLayout title="Reset Your Password">{page}</AuthLayout>

export default ResetPasswordPage
