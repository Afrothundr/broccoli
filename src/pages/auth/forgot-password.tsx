import { BlitzPage } from "@blitzjs/next"
import { useMutation } from "@blitzjs/rpc"
import forgotPassword from "src/auth/mutations/forgotPassword"
import { ForgotPassword } from "src/auth/schemas"
import { Form, FORM_ERROR } from "src/core/components/Form"
import { LabeledTextField } from "src/core/components/LabeledTextField"
import { AuthLayout } from "./layout"

const ForgotPasswordPage: BlitzPage = () => {
  const [forgotPasswordMutation, { isSuccess }] = useMutation(forgotPassword)

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
        <Form
          submitText="Send Reset Password Instructions"
          schema={ForgotPassword}
          initialValues={{ email: "" }}
          onSubmit={async (values) => {
            try {
              await forgotPasswordMutation(values)
            } catch (error: any) {
              return {
                [FORM_ERROR]: "Sorry, we had an unexpected error. Please try again.",
              }
            }
          }}
        >
          <LabeledTextField name="email" label="Email" placeholder="Email" />
        </Form>
      )}
    </>
  )
}

ForgotPasswordPage.getLayout = (page) => <AuthLayout title="Reset Your Password">{page}</AuthLayout>

export default ForgotPasswordPage
