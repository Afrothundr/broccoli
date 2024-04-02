import { Box, Button, Group, Slider } from "@mantine/core"
import { useForm } from "@mantine/form"
import type { FormProps } from "../types"

export function UpdateConsumedForm({ initialValues, onSubmit, submitText }: FormProps) {
  const form = useForm({
    initialValues: {
      percentConsumed: "",
      ...initialValues,
    },
  })

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
      <Box p={"1rem"} mb={"lg"}>
        <Slider
          color="green"
          label={`${form.values.percentConsumed}%`}
          defaultValue={0}
          marks={[
            { value: 25, label: "25%" },
            { value: 50, label: "50%" },
            { value: 75, label: "75%" },
          ]}
          {...form.getInputProps("percentConsumed")}
        />
      </Box>
      <Group justify="flex-end" mt="md">
        <Button type="submit">{submitText}</Button>
      </Group>
    </form>
  )
}
