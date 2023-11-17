import { Form, FormProps } from "src/core/components/Form"
import { z } from "zod"
import SliderInputField from "./SliderInputField"
export { FORM_ERROR } from "src/core/components/Form"

export function UpdateConsumedForm<S extends z.ZodType<any, any>>({ ...props }: FormProps<S>) {
  return (
    <Form<S> {...props}>
      <SliderInputField name="percentConsumed" label={(value) => `${value}%`} required />
    </Form>
  )
}
