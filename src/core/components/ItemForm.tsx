import Qty from "js-quantities"
import { Form, FormProps } from "src/core/components/Form"
import { LabeledTextField } from "src/core/components/LabeledTextField"
import PriceInputField from "src/core/components/NumberInputField"

import { ComboboxItem, ComboboxItemGroup, Group } from "@mantine/core"
import SelectInputField from "src/core/components/SelectInputField"
import { z } from "zod"
import ItemTypeMultiSelect from "./ItemTypeMultiSelect"
export { FORM_ERROR } from "src/core/components/Form"

interface ExtendedItemFormProps {
  itemTypeData: ComboboxItemGroup[]
  groceryTripData: ComboboxItem[]
}
export function ItemForm<S extends z.ZodType<any, any>>({
  itemTypeData = [],
  groceryTripData = [],
  ...props
}: FormProps<S> & ExtendedItemFormProps) {
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
        required
        data={itemTypeData}
      />
      <PriceInputField name="price" label="Price" placeholder="Price" required />
      <Group>
        <LabeledTextField
          name="quantity"
          label="Quantity"
          placeholder="Quantity"
          type="number"
          step={0.5}
        />
        <SelectInputField name="unit" label="Unit" placeholder="Unit" data={unitData} />
      </Group>
      <SelectInputField
        name="groceryTripId"
        label="Grocery Trip"
        placeholder="Grocery Trip"
        data={groceryTripData}
        required
      />
    </Form>
  )
}
