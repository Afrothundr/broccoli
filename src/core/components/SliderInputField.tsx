import { Slider, Text } from "@mantine/core"
import { ComponentPropsWithoutRef, PropsWithoutRef, ReactNode, forwardRef } from "react"
import { UseFieldConfig, useField } from "react-final-form"

export interface SliderInputProps extends PropsWithoutRef<JSX.IntrinsicElements["input"]> {
  /** Field name. */
  name: string
  /** Field label. */
  label: string | ((value: number) => ReactNode)
  outerProps?: PropsWithoutRef<JSX.IntrinsicElements["div"]>
  labelProps?: ComponentPropsWithoutRef<"label">
  fieldProps?: UseFieldConfig<string>
}

export const SliderInputField = forwardRef<HTMLInputElement, SliderInputProps>(
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
      <div {...outerProps} style={{ padding: "1rem" }}>
        <Slider
          {...input}
          color="green"
          disabled={submitting}
          label={label}
          ref={ref}
          defaultValue={0}
          marks={[
            { value: 25, label: "25%" },
            { value: 50, label: "50%" },
            { value: 75, label: "75%" },
          ]}
        />
        {touched && error && (
          <Text c="red" mt="sm">
            {normalizedError}
          </Text>
        )}
      </div>
    )
  }
)

export default SliderInputField
