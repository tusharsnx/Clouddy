import { cva } from "class-variance-authority";
import { z } from "zod";
import { $createBoxGroup } from "#/components/ui/structured-input/nodes/box-node";

const Variants = {
  a: "text-[hsl(271_79_80)] bg-[hsl(271_79_10)]",
  b: "text-[hsl(204_93_80)] bg-[hsl(204_93_10)]",
};

const tagStyles = cva("mx-0.5 py-2 px-4 rounded-full outline-none text-base", {
  variants: {
    variant: Variants,
  },
});

type Variant = keyof typeof Variants;
const VariantTypeSchema = z.enum(
  Object.keys(Variants) as [Variant, ...Variant[]],
);

export function $createFileTagNode(text: string) {
  const variant = Math.random() > 0.5 ? "a" : "b";
  const className = tagStyles({ variant });
  return $createBoxGroup(text, className);
}
