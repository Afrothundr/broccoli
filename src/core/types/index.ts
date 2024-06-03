export type FormProps = {
  onSubmit: (values: Record<string, unknown>) => void
  initialValues?: Record<string, unknown>
  submitText?: string
}

export const RequiredValidation = (value) => (value ? null : "Required")

export const NON_PERISHABLE_TYPE = "Non-perishable"
