import { Button, Group, TextInput } from "@mantine/core"
import { DateInput } from "@mantine/dates"
import { useForm } from "@mantine/form"
import { RequiredValidation, type FormProps } from "src/core/types"

export function GroceryTripForm({ onSubmit, initialValues, submitText = "Submit" }: FormProps) {
  const form = useForm({
    initialValues: {
      createdAt: "",
      name: "",
      description: "",
      ...initialValues,
    },
    validate: {
      createdAt: RequiredValidation,
      name: RequiredValidation,
    },
  })
  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
      <DateInput
        withAsterisk
        label="Date"
        {...form.getInputProps("createdAt")}
        defaultValue={new Date()}
      />
      <TextInput withAsterisk label="Name" {...form.getInputProps("name")} />
      <TextInput label="Description" {...form.getInputProps("description")} />
      <Group justify="flex-end" mt="md">
        <Button type="submit">{submitText}</Button>
      </Group>
    </form>
  )
}
