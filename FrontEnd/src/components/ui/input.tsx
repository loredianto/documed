import * as React from "react";

function Input({ className = "", type, ...props }: React.ComponentProps<"input">) {
  return <input type={type} className={`form-control ${className}`} {...props} />;
}

export { Input };
