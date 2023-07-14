import { Routes } from "@blitzjs/next"
import { useMutation } from "@blitzjs/rpc"
import { AuthenticationError, PromiseReturnType } from "blitz"
import Link from "next/link"
import login from "src/auth/mutations/login"
import { Login } from "src/auth/schemas"
import { FORM_ERROR, Form } from "src/core/components/Form"
import { LabeledTextField } from "src/core/components/LabeledTextField"

type LoginFormProps = {
  onSuccess?: (user: PromiseReturnType<typeof login>) => void
}

export const LoginForm = (props: LoginFormProps) => {
  const [loginMutation] = useMutation(login)
  return (
    <Form
      submitText="Login"
      schema={Login}
      initialValues={{ email: "", password: "" }}
      onSubmit={async (values) => {
        try {
          const user = await loginMutation(values)
          props.onSuccess?.(user)
        } catch (error: any) {
          if (error instanceof AuthenticationError) {
            return { [FORM_ERROR]: "Sorry, those credentials are invalid" }
          } else {
            return {
              [FORM_ERROR]:
                "Sorry, we had an unexpected error. Please try again. - " + error.toString(),
            }
          }
        }
      }}
    >
      <LabeledTextField name="email" label="Email" placeholder="Email" />
      <LabeledTextField name="password" label="Password" placeholder="Password" type="password" />
      <div>
        <Link href={Routes.ForgotPasswordPage()}>Forgot your password?</Link>
      </div>
    </Form>
  )
}

export default LoginForm
