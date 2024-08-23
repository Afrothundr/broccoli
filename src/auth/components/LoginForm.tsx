import { useMutation } from "@blitzjs/rpc"
import { Box, Button, Group, PasswordInput, TextInput } from "@mantine/core"
import { useForm } from "@mantine/form"
import type { PromiseReturnType } from "blitz"
import login from "src/auth/mutations/login"
import { RequiredValidation } from "src/core/types"

type LoginFormProps = {
  onSuccess?: (user: PromiseReturnType<typeof login>) => void
}

export const LoginForm = (props: LoginFormProps) => {
  const [loginMutation, { error }] = useMutation(login)
  const form = useForm({
    initialValues: {
      email: "",
      password: "",
    },

    validate: {
      email: (value) => (value && /^\S+@\S+$/.test(value) ? null : "Invalid email"),
      password: RequiredValidation,
    },
  })

  const handleSubmit = async (values) => {
    form.clearErrors()
    try {
      const user = await loginMutation(values)
      props.onSuccess?.(user)
    } catch (error) {
      form.setErrors({ email: "Invalid email or password" })
    }
  }

  return (
    <Box maw={340} mx="auto">
      <form onSubmit={form.onSubmit((values) => handleSubmit(values))}>
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
    </Box>
  )
}

export default LoginForm
