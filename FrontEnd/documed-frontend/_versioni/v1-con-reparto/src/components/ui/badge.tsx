import * as React from "react";

type Variant = "default" | "secondary" | "destructive" | "outline";

const VARIANT_CLASS: Record<Variant, string> = {
  default:     "badge text-bg-primary",
  secondary:   "badge text-bg-secondary",
  destructive: "badge text-bg-danger",
  outline:     "badge border border-secondary text-secondary",
};

interface BadgeProps extends React.ComponentProps<"span"> {
  variant?: Variant;
}

function Badge({ variant = "default", className = "", ...props }: BadgeProps) {
  return <span className={`${VARIANT_CLASS[variant]} ${className}`} {...props} />;
}

export { Badge };
