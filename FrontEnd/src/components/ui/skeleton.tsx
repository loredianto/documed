import React from "react";

function Skeleton({ className = "", style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={`placeholder-glow ${className}`}
      style={style}
      {...props}
    >
      <span className="placeholder w-100" />
    </div>
  );
}

export { Skeleton };
