import { FieldInput } from "./form-field";

type Props = {
  value: string;
  onChange: (digits: string) => void;
  placeholder?: string;
  className?: string;
};

/** 10-digit India mobile with fixed +91 prefix (non-editable). */
export function IndiaPhoneInput({ value, onChange, placeholder = "9876543210", className }: Props) {
  return (
    <div className={`relative ${className ?? ""}`}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 select-none text-[13px] font-medium text-zinc-500">
        +91
      </span>
      <FieldInput
        className="pl-12"
        placeholder={placeholder}
        inputMode="numeric"
        maxLength={10}
        autoComplete="tel"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 10))}
      />
    </div>
  );
}
