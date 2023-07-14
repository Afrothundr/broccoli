import { useMutation } from "@blitzjs/rpc"
import signup from "src/auth/mutations/signup"
import { Signup } from "src/auth/schemas"
import { FORM_ERROR, Form } from "src/core/components/Form"
import { LabeledTextField } from "src/core/components/LabeledTextField"

type SignupFormProps = {
  onSuccess?: () => void
}

export const SignupForm = (props: SignupFormProps) => {
  const [signupMutation] = useMutation(signup)

  return (
    <>
      <Form
        submitText="Create Account"
        schema={Signup}
        initialValues={{ email: "", firstName: "", lastName: "", password: "" }}
        onSubmit={async (values) => {
          try {
            await signupMutation(values)
            props.onSuccess?.()
          } catch (error: any) {
            if (error.code === "P2002" && error.meta?.target?.includes("email")) {
              // This error comes from Prisma
              return { email: "This email is already being used" }
            } else {
              return { [FORM_ERROR]: error.toString() }
            }
          }
        }}
      >
        <LabeledTextField name="firstName" label="First Name" placeholder="First Name" />
        <LabeledTextField name="lastName" label="Last Name" placeholder="Last Name" />
        <LabeledTextField name="email" label="Email" placeholder="Email" />
        <LabeledTextField name="password" label="Password" placeholder="Password" type="password" />
      </Form>
    </>
  )
}

export default SignupForm
