import { Form, FormProps } from "src/core/components/Form"
import ItemTypeMultiSelect from "src/core/components/ItemTypeMultiSelect"
import { LabeledTextField } from "src/core/components/LabeledTextField"
import PriceInputField from "src/core/components/NumberInputField"
import Qty from "js-quantities"

import { z } from "zod"
import SelectInputField from "src/core/components/SelectInputField"
import { SelectItem } from "@mantine/core"
export { FORM_ERROR } from "src/core/components/Form"

interface ExtendedItemFormProps {
  itemTypeData: SelectItem[]
}
export function ItemForm<S extends z.ZodType<any, any>>(
  props: FormProps<S> & ExtendedItemFormProps
) {
  const unitData = [
    {
      label: "",
      value: "",
    },
    ...Qty.getUnits("mass").map((unit) => ({
      label: unit,
      value: unit,
    })),
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
      <SelectInputField name="unit" label="Unit" placeholder="Unit" data={unitData} />
      <ItemTypeMultiSelect
        name="itemTypes"
        label="Type"
        placeholder="Type"
        data={props.itemTypeData}
      />
      {/* template: <__component__ name="__fieldName__" label="__Field_Name__" placeholder="__Field_Name__"  type="__inputType__" /> */}
    </Form>
  )
}
