import { ShowcasePage } from "@/views/showcase-page";
import { DEMO_PARTICIPANTS } from "@/app/demo-data";

/**
 * Route "/showcase" - the full participant search/browse screen.
 * @returns {import('react').ReactNode} The showcase page.
 */
export default function Page() {
  return <ShowcasePage participants={DEMO_PARTICIPANTS} />;
}
