import { ProfilePage } from "@/views/profile-page";
import { DEMO_PROFILE, DEMO_PROFILE_STATS } from "@/app/demo-data";

/**
 * Localized profile route.
 * @returns {import('react').ReactNode} The profile page.
 */
export default function Page() {
  return <ProfilePage profile={DEMO_PROFILE} stats={DEMO_PROFILE_STATS} />;
}
