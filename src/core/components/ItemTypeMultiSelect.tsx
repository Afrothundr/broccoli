import { MultiSelect, SelectItem } from "@mantine/core"
import { forwardRef, ComponentPropsWithoutRef, PropsWithoutRef } from "react"
import { useField, UseFieldConfig } from "react-final-form"

export interface ItemTypeMultiSelectProps extends PropsWithoutRef<JSX.IntrinsicElements["input"]> {
  /** Field name. */
  name: string
  /** Field label. */
  label: string
  data: SelectItem[]
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
          data={data}
          disabled={submitting}
          label={label}
          placeholder={label}
          ref={ref}
        />
        {touched && normalizedError && (
          <div role="alert" style={{ color: "red" }}>
            {normalizedError}
          </div>
        )}
      </div>
    )
  }
)

export default ItemTypeMultiSelect
