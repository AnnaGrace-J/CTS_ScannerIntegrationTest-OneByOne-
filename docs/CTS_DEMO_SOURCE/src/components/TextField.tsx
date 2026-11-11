import { useId } from "react";

type TextFieldProps = {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
};

export function TextField({ label, value, onChange, placeholder, disabled, type = "text" }: TextFieldProps) {
  const id = useId();
  return (
    <label className="block min-w-0" htmlFor={id}>
      <span className="mb-1 block text-xs font-bold uppercase text-slate-600">{label}</span>
      <input
        id={id}
        aria-label={label}
        className="enterprise-input"
        disabled={disabled}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}
