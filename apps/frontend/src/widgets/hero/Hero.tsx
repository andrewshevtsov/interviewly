// Слой widgets: hero-секция домашней страницы - заголовок, CTA и мок редактора кода.
import { getServerTranslations } from "@/shared/i18n-server";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { LocalizedLink } from "@/shared/ui/localized-link";

const TRAFFIC_LIGHT_COLORS = ["bg-destructive", "bg-warning", "bg-success"];

/**
 * Hero section: headline, subtext, CTAs and a decorative code-editor mock.
 * @returns {import('react').ReactNode} The hero section.
 */
export async function Hero() {
  const hero = await getServerTranslations("hero");
  const navigation = await getServerTranslations("navigation");

  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center">
      <div>
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
          {hero("titleStart")}
          <br />
          <span className="text-primary drop-shadow-glow-primary">{hero("titleAccent")}</span>
          <br />
          {hero("titleEnd")}
        </h1>

        <p className="mt-6 max-w-md text-lg text-muted-foreground">{hero("description")}</p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Button asChild variant="secondary" size="lg">
            <LocalizedLink href="/sessions">{navigation("createSession")}</LocalizedLink>
          </Button>
          <Button asChild variant="outline" size="lg">
            <LocalizedLink href="#leaderboard">{navigation("leaderboard")}</LocalizedLink>
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden font-mono text-sm shadow-2xl">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <div className="flex gap-1.5">
            {TRAFFIC_LIGHT_COLORS.map((color) => (
              <span key={color} className={`h-2.5 w-2.5 rounded-full ${color}`} />
            ))}
          </div>
          <span className="text-xs uppercase text-muted-foreground">
            editor.py — {hero("editorTitle")} #4092
          </span>
        </div>

        <div className="space-y-1 p-4">
          <p>
            <span className="text-muted-foreground/60">1</span>{" "}
            <span className="text-primary">class</span>{" "}
            <span className="text-foreground">Solution</span>:
          </p>
          <p>
            <span className="text-muted-foreground/60">2</span>
            {"  "}
            <span className="text-primary">def</span>{" "}
            <span className="text-foreground">two_sum</span>
            (self, nums, target):
          </p>
          <p>
            <span className="text-muted-foreground/60">3</span>
            {"    "}
            <span className="text-muted-foreground"># {hero("realtimeSyncComment")}</span>
          </p>
          <p>
            <span className="text-muted-foreground/60">4</span>
            {"    "}
            prev_map = {"{}"}{" "}
            <span className="inline-block h-4 w-px animate-pulse bg-primary align-middle" />
          </p>
        </div>
      </Card>
    </section>
  );
}
