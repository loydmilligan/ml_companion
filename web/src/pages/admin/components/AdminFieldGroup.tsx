type AdminFieldGroupProps = {
  title?: string;
  children: React.ReactNode;
};

export default function AdminFieldGroup({
  title,
  children,
}: AdminFieldGroupProps) {
  return (
    <div className="admin-field-group">
      {title && <div className="admin-field-group__title">{title}</div>}
      <div className="admin-field-group__content">{children}</div>
    </div>
  );
}
