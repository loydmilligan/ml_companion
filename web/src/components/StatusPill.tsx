import clsx from "clsx";

type StatusPillProps = {
  label: string;
  tone?: "info" | "warning" | "success";
};

export default function StatusPill({ label, tone = "info" }: StatusPillProps) {
  return <span className={clsx("status-pill", `status-pill-${tone}`)}>{label}</span>;
}
