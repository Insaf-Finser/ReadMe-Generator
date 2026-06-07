interface FormFieldProps {
  label: string
  hint?: string
  children: React.ReactNode
}

export function FormField({ label, hint, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <label className="form-label">{label}</label>
      {hint && <p className="form-hint">{hint}</p>}
      {children}
    </div>
  )
}
