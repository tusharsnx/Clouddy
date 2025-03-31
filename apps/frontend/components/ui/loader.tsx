import Logo from "./logo";

export function Loader() {
  return (
    <div className="h-full flex justify-center items-center animate-pulse duration-[1500ms]">
      <Logo />
    </div>
  );
}
