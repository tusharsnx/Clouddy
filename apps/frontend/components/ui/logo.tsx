import { type VariantProps, cva } from "class-variance-authority";
import Link from "next/link";
import { cn } from "#/lib/utils";
import SVG from "./svg";

const LogoVariants = cva("", {
  variants: {
    size: {
      sm: "size-10",
      default: "size-16",
      lg: "size-20",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

const LogoBaseVariants = cva("", {
  variants: {
    variant: {
      light: "black",
      dark: "white",
    },
  },
  defaultVariants: {
    variant: "dark",
  },
});

const LogoGlyphVariants = cva("", {
  variants: {
    variant: {
      light: "white",
      dark: "black",
    },
  },
  defaultVariants: {
    variant: "dark",
  },
});

type LogoVariantProps = VariantProps<typeof LogoVariants> &
  VariantProps<typeof LogoBaseVariants> &
  VariantProps<typeof LogoGlyphVariants>;

export default function Logo({
  variant,
  size,
}: { className?: string } & LogoVariantProps) {
  return (
    <Link href="/">
      <SVG
        width="76"
        height="78"
        viewBox="0 0 76 78"
        fill="none"
        className={cn(LogoVariants({ size }))}
      >
        <ellipse
          cx="38"
          cy="39"
          rx="38"
          ry="39"
          fill={LogoBaseVariants({ variant })}
        />
        <path
          d="M32.1845 47.7417C32.1845 47.7417 26.5937 31.3434 30.2277 30.1197C33.8617 28.8959 47 37.4622 47 37.4622C45.3228 47.2521 41.1297 48.7207 32.1845 47.7417Z"
          fill={LogoGlyphVariants({ variant })}
          stroke={LogoGlyphVariants({ variant })}
        />
      </SVG>
    </Link>
  );
}
