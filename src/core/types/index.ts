export type FormProps = {
  onSubmit: (values: Record<string, unknown>) => void
  initialValues?: Record<string, unknown>
  submitText?: string
}

export const RequiredValidation = (value) => (value ? null : "Required")
