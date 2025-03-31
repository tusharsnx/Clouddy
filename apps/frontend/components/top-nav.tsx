import { ProfileDropdown } from "#/components/profile-dropdown";

export function TopNav() {
  return (
    <div className="py-4 flex justify-between items-center">
      <div className="p-2">Logo</div>
      <ProfileDropdown />
    </div>
  );
}
