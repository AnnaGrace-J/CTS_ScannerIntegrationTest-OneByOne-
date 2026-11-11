import { useId } from "react";

type DateFieldProps = {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
};

export function DateField({ label, value, onChange, disabled }: DateFieldProps) {
  const id = useId();
  return (
    <label className="block min-w-0" htmlFor={id}>
      <span className="mb-1 block text-xs font-bold uppercase text-slate-600">{label}</span>
      <input
        id={id}
        aria-label={label}
        className="enterprise-input"
        disabled={disabled}
        type="date"
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      />
    </label>
  );
}
