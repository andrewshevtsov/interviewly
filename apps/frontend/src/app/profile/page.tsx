import { ProfilePage } from "@/views/profile-page";
import { DEMO_PROFILE, DEMO_PROFILE_STATS } from "../demo-data";

/**
 * Route "/profile" - the signed-in user's personal cabinet (editable profile and stats).
 * @returns {import('react').ReactNode} The profile page.
 */
export default function Page() {
  return <ProfilePage profile={DEMO_PROFILE} stats={DEMO_PROFILE_STATS} />;
}
