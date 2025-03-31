import type { ComponentProps, PropsWithChildren } from "react";
import { cn } from "#/lib/utils";

export default function SVG({
  className,
  children,
  ...props
}: PropsWithChildren<ComponentProps<"svg">>) {
  return (
    // biome-ignore lint/a11y/noSvgWithoutTitle:
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      className={cn("h-full w-full object-contain", className)}
    >
      {children}
    </svg>
  );
}
