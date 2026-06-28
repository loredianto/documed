import * as React from "react";

type Variant = "default" | "outline" | "destructive" | "secondary" | "ghost";
type Size    = "default" | "sm" | "lg" | "xs";

const VARIANT_CLASS: Record<Variant, string> = {
  default:     "btn btn-primary",
  outline:     "btn btn-outline-primary",
  destructive: "btn btn-danger",
  secondary:   "btn btn-secondary",
  ghost:       "btn btn-light",
};

const SIZE_CLASS: Record<Size, string> = {
  xs:      "btn-sm",
  sm:      "btn-sm",
  default: "",
  lg:      "btn-lg",
};

interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

function Button({ variant = "default", size = "default", className = "", children, asChild = false, ...props }: ButtonProps) {
  const classes = [VARIANT_CLASS[variant], SIZE_CLASS[size], className].filter(Boolean).join(" ");

  // asChild: applica le classi DSI al figlio (es. <Link>) invece di annidare
  // un <a> dentro un <button> (HTML non valido e stile incoerente).
  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{ className?: string }>;
    return React.cloneElement(child, {
      className: [classes, child.props.className].filter(Boolean).join(" "),
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

export { Button };
