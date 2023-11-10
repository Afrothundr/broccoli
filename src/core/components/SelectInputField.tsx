import { ComboboxItem, NativeSelect } from "@mantine/core"
import { ComponentPropsWithoutRef, PropsWithoutRef, forwardRef } from "react"
import { UseFieldConfig, useField } from "react-final-form"

export interface SelectInputFieldProps extends PropsWithoutRef<JSX.IntrinsicElements["select"]> {
  /** Field name. */
  name: string
  /** Field label. */
  label: string
  data: ComboboxItem[]
  outerProps?: PropsWithoutRef<JSX.IntrinsicElements["div"]>
  labelProps?: ComponentPropsWithoutRef<"label">
  fieldProps?: UseFieldConfig<string>
}

export const SelectInputField = forwardRef<HTMLInputElement, SelectInputFieldProps>(
  ({ name, label, outerProps, fieldProps, data }, ref) => {
    const {
      input,
      meta: { touched, error, submitError, submitting },
    } = useField(name, fieldProps)

    const normalizedError = Array.isArray(error) ? error.join(", ") : error || submitError

    return (
      <div {...outerProps}>
        <NativeSelect
          {...input}
          data={data}
          disabled={submitting}
          label={label}
          placeholder={label}
          error={touched && normalizedError}
        />
        {/* {touched && normalizedError && (
          <div role="alert" style={{ color: "red" }}>
            {normalizedError}
          </div>
        )} */}
      </div>
    )
  }
)

export default SelectInputField
