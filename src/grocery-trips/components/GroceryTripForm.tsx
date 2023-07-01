import { Field } from "react-final-form"
import DatePickerInput from "src/core/components/DatePickerInput"
import { Form, FormProps } from "src/core/components/Form"
import { LabeledTextField } from "src/core/components/LabeledTextField"

import { z } from "zod"
export { FORM_ERROR } from "src/core/components/Form"

export function GroceryTripForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  return (
    <Form<S> {...props}>
      <LabeledTextField name="name" label="Name" required placeholder="name" type="text" />
      <LabeledTextField
        name="description"
        label="Description"
        placeholder="Description"
        type="text"
      />
      <Field component={DatePickerInput} name="createdAt" label="Date" defaultValue={new Date()} />
    </Form>
  )
}
