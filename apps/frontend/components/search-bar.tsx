import { StructuredInput } from "#/components/ui/structured-input/structured-input";

export function SearchBar() {
  return (
    <div className="flex justify-center">
      <StructuredInput className="border-2 w-full md:w-4/5 px-1 py-2 rounded-lg" />
    </div>
  );
}
