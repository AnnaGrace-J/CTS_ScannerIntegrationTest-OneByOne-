import { useId } from "react";

type Option = {
  label: string;
  value: string;
};

type SelectFieldProps = {
  label: string;
  value: string;
  options: Option[];
  onChange?: (value: string) => void;
  disabled?: boolean;
};

export function SelectField({ label, value, options, onChange, disabled }: SelectFieldProps) {
  const id = useId();
  return (
    <label className="block min-w-0" htmlFor={id}>
      <span className="mb-1 block text-xs font-bold uppercase text-slate-600">{label}</span>
      <select
        id={id}
        aria-label={label}
        className="enterprise-input"
        disabled={disabled}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
