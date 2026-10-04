// Слой views: главный экран - лендинг с витриной участников.
// Разрешено импортировать widgets, features, entities, shared.
import { Footer } from "@/widgets/footer";
import { Hero } from "@/widgets/hero";
import { LiveSessionPreview } from "@/widgets/live-session-preview";
import { Navbar } from "@/widgets/navbar";
import { Showcase } from "@/widgets/showcase";

/**
 * Renders the app's home screen: navbar, hero, participant showcase and a live-session preview.
 * @returns {import('react').ReactNode} The home page.
 */
export function HomePage() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Showcase />
      <LiveSessionPreview />
      <Footer />
    </div>
  );
}
