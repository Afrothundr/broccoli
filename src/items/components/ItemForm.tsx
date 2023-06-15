import { useQuery } from "@blitzjs/rpc"
import { ItemStatusType } from "@prisma/client"
import React, { Suspense } from "react"
import { Form, FormProps } from "src/core/components/Form"
import ItemTypeMultiSelect from "src/core/components/ItemTypeMultiSelect"
import { LabeledTextField } from "src/core/components/LabeledTextField"
import PriceInputField from "src/core/components/NumberInputField"
import getItemTypes from "src/item-types/queries/getItemTypes"

import { z } from "zod"
export { FORM_ERROR } from "src/core/components/Form"

export function ItemForm<S extends z.ZodType<any, any>>(props: FormProps<S>) {
  const [{ itemTypes }] = useQuery(getItemTypes, {
    orderBy: { name: "asc" },
  })
  // const data = itemTypes.map((item) => ({
  //   label: item.name,
  //   value: item.id.toString(),
  // }))
  const data = [
    { label: "foo", value: "foo" },
    { label: "foo2", value: "foo2" },
  ]
  return (
    <Form<S> {...props}>
      <LabeledTextField name="name" label="Name" required placeholder="name" type="text" />
      <LabeledTextField
        name="description"
        label="Description"
        placeholder="Description"
        type="text"
      />
      <PriceInputField name="price" label="Price" placeholder="Price" required />
      <LabeledTextField
        name="quantity"
        label="Quantity"
        placeholder="Quantity"
        type="number"
        step={0.5}
      />
      <ItemTypeMultiSelect name="itemType" label="Type" placeholder="Type" data={data} />
      <LabeledTextField name="unit" label="Unit" placeholder="Unit" type="text" />
      {/* template: <__component__ name="__fieldName__" label="__Field_Name__" placeholder="__Field_Name__"  type="__inputType__" /> */}
    </Form>
  )
}
