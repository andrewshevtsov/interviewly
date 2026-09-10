// Слой views: главный экран - лендинг с витриной участников и лидербордом.
// Разрешено импортировать widgets, features, entities, shared.
import { Footer } from "@/widgets/footer";
import { Hero } from "@/widgets/hero";
import { Leaderboard } from "@/widgets/leaderboard";
import { LiveSessionPreview } from "@/widgets/live-session-preview";
import { Navbar } from "@/widgets/navbar";
import { Showcase } from "@/widgets/showcase";

/**
 * Renders the app's home screen: navbar, hero, participant showcase, a live-session preview and
 * the leaderboard.
 * @returns {import('react').ReactNode} The home page.
 */
export function HomePage() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Showcase />
      <LiveSessionPreview />
      <Leaderboard />
      <Footer />
    </div>
  );
}
