import { NumberInput } from "@mantine/core"
import { ComponentPropsWithoutRef, PropsWithoutRef, forwardRef } from "react"
import { UseFieldConfig, useField } from "react-final-form"

export interface PriceInputProps extends PropsWithoutRef<JSX.IntrinsicElements["input"]> {
  /** Field name. */
  name: string
  /** Field label. */
  label: string
  outerProps?: PropsWithoutRef<JSX.IntrinsicElements["div"]>
  labelProps?: ComponentPropsWithoutRef<"label">
  fieldProps?: UseFieldConfig<string>
}

export const PriceInputField = forwardRef<HTMLInputElement, PriceInputProps>(
  ({ name, label, outerProps, fieldProps, labelProps, type, ...props }, ref) => {
    const {
      input,
      meta: { touched, error, submitError, submitting },
    } = useField(name, {
      parse: Number as any,
      type: "number",
      ...fieldProps,
    })

    const normalizedError = Array.isArray(error) ? error.join(", ") : error || submitError

    return (
      <div {...outerProps}>
        <NumberInput
          {...{ ...input, type: "text" }}
          disabled={submitting}
          label={label}
          placeholder={label}
          ref={ref}
          decimalScale={2}
          defaultValue={0}
          prefix="$"
          error={touched && normalizedError}
        />
      </div>
    )
  }
)

export default PriceInputField
