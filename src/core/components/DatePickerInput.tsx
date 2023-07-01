import { DateInput } from "@mantine/dates"
import { FieldRenderProps } from "react-final-form"

export const DatePickerInput = ({
  input: { onChange, value, label },
  meta,
  ...rest
}: FieldRenderProps<any>) => {
  return (
    <DateInput
      label={label}
      placeholder={label}
      value={value}
      onChange={(date: Date) => onChange(date)}
      {...rest}
    />
  )
}

export default DatePickerInput
