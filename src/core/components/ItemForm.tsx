import {
  Button,
  Group,
  MultiSelect,
  NativeSelect,
  NumberInput,
  TextInput,
  type ComboboxItem,
  type ComboboxItemGroup,
} from "@mantine/core"
import { useForm } from "@mantine/form"
import Qty from "js-quantities"
import isEqual from "lodash.isequal"
import { useEffect, useRef } from "react"
import { RequiredValidation, type FormProps } from "../types"

interface ExtendedItemFormProps {
  itemTypeData: ComboboxItemGroup[]
  groceryTripData: ComboboxItem[]
}
export function ItemForm({
  itemTypeData = [],
  groceryTripData = [],
  onSubmit,
  initialValues,
  submitText = "Submit",
}: FormProps & ExtendedItemFormProps) {
  const form = useForm({
    initialValues: {
      name: "",
      description: "",
      price: 0,
      quantity: 1,
      unit: "",
      groceryTripId: "",
      importId: "",
      itemTypes: [],
      ...initialValues,
    },
    validate: {
      name: RequiredValidation,
      price: (price) => (price || price === 0 ? null : "A price is required"),
      quantity: RequiredValidation,
      groceryTripId: RequiredValidation,
      itemTypes: (types) => (types?.length ? null : "At least one item type is required"),
    },
  })

  const refInitialValues = useRef(initialValues)

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

  useEffect(() => {
    if (!isEqual(refInitialValues.current, initialValues)) {
      refInitialValues.current = initialValues
      form.setValues({
        name: "",
        description: "",
        price: 0,
        quantity: 1,
        unit: "",
        groceryTripId: "",
        importId: "",
        itemTypes: [],
        ...initialValues,
      })
    }
  }, [form, initialValues])

  return (
    <form onSubmit={form.onSubmit((values) => onSubmit(values))}>
      <TextInput withAsterisk label="Name" {...form.getInputProps("name")} />
      <TextInput label="Description" {...form.getInputProps("description")} />
      <MultiSelect
        data={itemTypeData}
        label="Type"
        withAsterisk
        searchable
        {...form.getInputProps("itemTypes")}
      />
      <NumberInput
        withAsterisk
        label="Price"
        decimalScale={2}
        defaultValue={0}
        prefix="$"
        {...form.getInputProps("price")}
      />
      <Group>
        <NumberInput withAsterisk label="Quantity" {...form.getInputProps("quantity")} step={0.5} />
        <NativeSelect
          name="unit"
          label="Unit"
          placeholder="Unit"
          data={unitData}
          {...form.getInputProps("unit")}
        />
      </Group>
      <NativeSelect
        withAsterisk
        name="groceryTripId"
        label="Grocery Trip"
        data={groceryTripData}
        {...form.getInputProps("groceryTripId")}
      />
      <TextInput type="hidden" {...form.getInputProps("importId")} />
      <Group justify="flex-end" mt="md">
        <Button type="submit">{submitText}</Button>
      </Group>
    </form>
  )
}
