import { ComboboxItemGroup, MultiSelect } from "@mantine/core"
import { ComponentPropsWithoutRef, PropsWithoutRef, forwardRef } from "react"
import { UseFieldConfig, useField } from "react-final-form"

export interface ItemTypeMultiSelectProps extends PropsWithoutRef<JSX.IntrinsicElements["input"]> {
  /** Field name. */
  name: string
  /** Field label. */
  label: string
  data: ComboboxItemGroup[]
  outerProps?: PropsWithoutRef<JSX.IntrinsicElements["div"]>
  labelProps?: ComponentPropsWithoutRef<"label">
  fieldProps?: UseFieldConfig<string>
}

export const ItemTypeMultiSelect = forwardRef<HTMLInputElement, ItemTypeMultiSelectProps>(
  ({ name, label, outerProps, fieldProps, data }, ref) => {
    const {
      input,
      meta: { touched, error, submitError, submitting },
    } = useField(name, fieldProps)

    const normalizedError = Array.isArray(error) ? error.join(", ") : error || submitError
    return (
      <div {...outerProps}>
        <MultiSelect
          {...input}
          data={data}
          disabled={submitting}
          label={label}
          placeholder={label}
          searchable
          ref={ref}
          error={touched && normalizedError}
        />
      </div>
    )
  }
)

export default ItemTypeMultiSelect
