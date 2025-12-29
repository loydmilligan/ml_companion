import type React from "react";
import clsx from "clsx";

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  helperText?: string;
  error?: string;
};

export default function Field({ label, helperText, error, className, ...props }: FieldProps) {
  return (
    <label className={clsx("field", className)}>
      <span className="field-label">{label}</span>
      <input className={clsx("field-input", error && "field-input-error")} {...props} />
      {error ? <span className="field-error">{error}</span> : null}
      {helperText && !error ? <span className="field-helper">{helperText}</span> : null}
    </label>
  );
}
