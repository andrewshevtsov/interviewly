import { ProfilePage } from "@/views/profile-page";
import { DEMO_PROFILE_STATS } from "@/app/demo-data";

/**
 * Localized profile route - the signed-in user's personal cabinet (editable profile and stats).
 * The profile itself is fetched client-side for the signed-in user; stats are still demo data.
 * @returns {import('react').ReactNode} The profile page.
 */
export default function Page() {
  return <ProfilePage stats={DEMO_PROFILE_STATS} />;
}
