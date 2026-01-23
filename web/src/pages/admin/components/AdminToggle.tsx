import clsx from "clsx";

type AdminToggleProps = {
  icon: string;
  label: string;
  helper?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

export default function AdminToggle({
  icon,
  label,
  helper,
  checked,
  onChange,
  disabled = false,
}: AdminToggleProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.checked);
  };

  return (
    <label
      className={clsx("admin-toggle", disabled && "admin-toggle--disabled")}
    >
      <input
        type="checkbox"
        className="admin-toggle__checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
      />
      <span className="admin-toggle__icon">{icon}</span>
      <div className="admin-toggle__text">
        <span className="admin-toggle__label">{label}</span>
        {helper && <span className="admin-toggle__helper">{helper}</span>}
      </div>
    </label>
  );
}
