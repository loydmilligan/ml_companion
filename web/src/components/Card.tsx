import type React from "react";
import clsx from "clsx";

type CardProps = React.HTMLAttributes<HTMLDivElement> & {
  tone?: "default" | "navy" | "glass";
};

export default function Card({ tone = "default", className, ...props }: CardProps) {
  return <div className={clsx("card", `card-${tone}`, className)} {...props} />;
}
