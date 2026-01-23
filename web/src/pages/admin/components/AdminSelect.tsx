import clsx from "clsx";

type AdminSelectOption = {
  value: string;
  label: string;
};

type AdminSelectProps = {
  icon?: string;
  label: string;
  helper?: string;
  value: string;
  onChange: (value: string) => void;
  options: AdminSelectOption[];
  disabled?: boolean;
};

export default function AdminSelect({
  icon,
  label,
  helper,
  value,
  onChange,
  options,
  disabled = false,
}: AdminSelectProps) {
  return (
    <div className={clsx("admin-select", disabled && "admin-select--disabled")}>
      <label className="admin-select__label">
        {icon && <span className="admin-select__icon">{icon}</span>}
        <span>{label}</span>
      </label>
      <select
        className="admin-select__input field-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {helper && <span className="admin-select__helper">{helper}</span>}
    </div>
  );
}
