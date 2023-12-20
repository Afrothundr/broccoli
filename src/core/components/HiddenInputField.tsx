import { PropsWithoutRef, forwardRef } from "react"
import { useField } from "react-final-form"

export interface HiddenInputProps extends PropsWithoutRef<JSX.IntrinsicElements["input"]> {
  /** Field name. */
  name: string
}

export const HiddenInputField = forwardRef<HTMLInputElement, HiddenInputProps>(({ name }, ref) => {
  const { input } = useField(name)

  return (
    <div>
      <input {...input} ref={ref} type="hidden" />
    </div>
  )
})

export default HiddenInputField
