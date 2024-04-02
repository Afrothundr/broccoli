import { useMutation } from "@blitzjs/rpc"
import { Button, Group, PasswordInput, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import signup from "src/auth/mutations/signup"
import { RequiredValidation } from "src/core/types"
import { email } from "../schemas"

type SignupFormProps = {
  onSuccess?: () => void
}

export const SignupForm = (props: SignupFormProps) => {
  const [signupMutation] = useMutation(signup)
  const form = useForm({
    initialValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },

    validate: {
      firstName: RequiredValidation,
      lastName: RequiredValidation,
      email: (value) => (email && /^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: (value) =>
        value.length >= 10 ? null : "Password must be at least 10 characters long",
    },
  })

  const handleSubmit = async (values) => {
    await signupMutation(values)
    props.onSuccess?.()
  }

  return (
    <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
      <TextInput withAsterisk label="First Name" {...form.getInputProps("firstName")} />
      <TextInput withAsterisk label="Last Name" {...form.getInputProps("lastName")} />
      <TextInput
        withAsterisk
        label="Email"
        placeholder="your@email.com"
        {...form.getInputProps("email")}
      />
      <PasswordInput withAsterisk label="Password" {...form.getInputProps("password")} />
      <Group justify="flex-end" mt="md">
        <Button type="submit">Submit</Button>
      </Group>
    </form>
  )
}

export default SignupForm
