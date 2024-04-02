import { BlitzPage } from "@blitzjs/next"
import { useMutation } from "@blitzjs/rpc"
import { Alert, Button, Group, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import { useState } from "react"
import forgotPassword from "src/auth/mutations/forgotPassword"
import { RequiredValidation } from "src/core/types"
import { AuthLayout } from "./layout"

const ForgotPasswordPage: BlitzPage = () => {
  const [forgotPasswordMutation, { isSuccess }] = useMutation(forgotPassword)
  const [error, setError] = useState<string>()

  const form = useForm({
    initialValues: {
      email: "",
    },
    validate: {
      email: RequiredValidation,
    },
  })

  const onSubmit = async (values) => {
    try {
      await forgotPasswordMutation(values)
    } catch (error: any) {
      setError("Sorry, we had an unexpected error. Please try again.")
    }
  }

  return (
    <>
      {isSuccess ? (
        <div>
          <h2>Request Submitted</h2>
          <p>
            If your email is in our system, you will receive instructions to reset your password
            shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
          <TextInput withAsterisk type="email" label="Email" {...form.getInputProps("email")} />
          <Group justify="flex-end" mt="md">
            <Button type="submit">Send Reset Password Instructions</Button>
          </Group>
          {error && (
            <Alert title="Error:" variant="light" color="pink">
              {error}
            </Alert>
          )}
        </form>
      )}
    </>
  )
}

ForgotPasswordPage.getLayout = (page) => <AuthLayout title="Reset Your Password">{page}</AuthLayout>

export default ForgotPasswordPage
