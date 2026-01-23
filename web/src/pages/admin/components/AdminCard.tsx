import clsx from "clsx";
import Card from "../../../components/Card";

type AdminCardProps = {
  children: React.ReactNode;
  title?: string;
  icon?: string;
  color?: "blue" | "green" | "purple" | "gray";
  className?: string;
};

export default function AdminCard({
  children,
  title,
  icon,
  color,
  className,
}: AdminCardProps) {
  return (
    <Card
      className={clsx(
        "admin-card",
        color && `admin-card--${color}`,
        className
      )}
    >
      {(title || icon) && (
        <div className="admin-card__header">
          {icon && <span className="admin-card__icon">{icon}</span>}
          {title && <h3 className="admin-card__title">{title}</h3>}
        </div>
      )}
      {children}
    </Card>
  );
}
