import React, { Suspense } from "react"
import { Form, FormProps } from "src/core/components/Form"
import { LabeledTextField } from "src/core/components/LabeledTextField"

import { z } from "zod"
import { LabeledSelectField } from "src/core/components/LabelSelectField"
import getUsers from "src/users/queries/getUsers"
import { usePaginatedQuery } from "@blitzjs/rpc"
export { FORM_ERROR } from "src/core/components/Form"

export function ReminderForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  const [{ users: users }] = usePaginatedQuery(getUsers, {
    orderBy: {
      id: "asc",
    },
  })

  return (
    <Form<S> {...props}>
      <LabeledTextField name="time" label="Time" placeholder="Time" type="text" />
      <LabeledSelectField name="id" label="User Id" placeholder="User Id" options={users} />
      {/* template: <__component__ name="__fieldName__" label="__Field_Name__" placeholder="__Field_Name__"  type="__inputType__" /> */}
    </Form>
  )
}
