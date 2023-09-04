import Qty from "js-quantities"
import { Form, FormProps } from "src/core/components/Form"
import ItemTypeMultiSelect from "src/core/components/ItemTypeMultiSelect"
import { LabeledTextField } from "src/core/components/LabeledTextField"
import PriceInputField from "src/core/components/NumberInputField"

import { Group, SelectItem } from "@mantine/core"
import SelectInputField from "src/core/components/SelectInputField"
import { z } from "zod"
export { FORM_ERROR } from "src/core/components/Form"

interface ExtendedItemFormProps {
  itemTypeData: SelectItem[]
  groceryTripData: SelectItem[]
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
      <ItemTypeMultiSelect
        name="itemTypes"
        label="Type"
        placeholder="Type"
        data={props.itemTypeData}
      />
      <Group>
        <PriceInputField name="price" label="Price" placeholder="Price" required />
        <LabeledTextField
          name="quantity"
          label="Quantity"
          placeholder="Quantity"
          type="number"
          step={0.5}
        />
      </Group>
      <SelectInputField name="unit" label="Unit" placeholder="Unit" data={unitData} />
      <SelectInputField
        name="groceryTripId"
        label="Grocery Trip"
        placeholder="Grocery Trip"
        data={props.groceryTripData}
        required
      />
    </Form>
  )
}
