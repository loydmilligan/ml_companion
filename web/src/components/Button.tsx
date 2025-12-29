import type React from "react";
import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export default function Button({ variant = "primary", className, ...props }: ButtonProps) {
  return <button className={clsx("button", `button-${variant}`, className)} {...props} />;
}
