import { LabeledTextField } from "src/core/components/LabeledTextField"
import { Form, FORM_ERROR } from "src/core/components/Form"
import signup from "src/auth/mutations/signup"
import { Signup } from "src/auth/schemas"
import { useMutation } from "@blitzjs/rpc"
import { FloatingLabelInput } from "src/core/components/FloatingLabelInput"
import { useState } from "react"
import { Container, TextInput } from "@mantine/core"

type SignupFormProps = {
  onSuccess?: () => void
}

interface FormData {
  firstName: string
  lastName: string
  email: string
  password: string
}

export const SignupForm = (props: SignupFormProps) => {
  const [signupMutation] = useMutation(signup)
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  })

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prevFormData) => ({ ...prevFormData, [name]: value }))
  }

  return (
    <div>
      <h1>Create an Account</h1>
      <Container size="sm">
        <Form
          submitText="Create Account"
          schema={Signup}
          initialValues={{ email: "", password: "" }}
          onSubmit={async (values) => {
            try {
              await signupMutation(values)
              props.onSuccess?.()
            } catch (error: any) {
              if (error.code === "P2002" && error.meta?.target?.includes("email")) {
                // This error comes from Prisma
                return { email: "This email is already being used" }
              } else {
                console.log(error)
                return { [FORM_ERROR]: error.toString() }
              }
            }
          }}
        >
          {/* <LabeledTextField name="first_name" label="First Name" placeholder="First Name" />
        <LabeledTextField name="last_name" label="Last Name" placeholder="Last Name" />
        <LabeledTextField name="email" label="Email" placeholder="Email" />
        <LabeledTextField name="password" label="Password" placeholder="Password" type="password" /> */}
          <TextInput
            required
            label="First Name"
            placeholder="Enter your first name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
          />
          <TextInput
            required
            label="Last Name"
            placeholder="Enter your last name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
          />
          <TextInput
            required
            type="email"
            label="Email"
            placeholder="Enter your email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          <TextInput
            required
            type="password"
            label="Password"
            placeholder="Enter your password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </Form>
      </Container>
    </div>
  )
}

export default SignupForm
