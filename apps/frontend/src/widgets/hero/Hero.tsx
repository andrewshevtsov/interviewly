// Слой widgets: hero-секция домашней страницы - заголовок, CTA и мок редактора кода.
import Link from "next/link";

import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

const TRAFFIC_LIGHT_COLORS = ["bg-destructive", "bg-warning", "bg-success"];

/**
 * Hero section: headline, subtext, CTAs and a decorative code-editor mock.
 * @returns {import('react').ReactNode} The hero section.
 */
export function Hero() {
  return (
    <section className="mx-auto grid max-w-6xl gap-12 px-6 py-24 md:grid-cols-2 md:items-center">
      <div>
        <h1 className="text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
          Проведи
          <br />
          <span className="text-primary drop-shadow-glow-primary">техническое</span>
          <br />
          интервью.
        </h1>

        <p className="mt-6 max-w-md text-lg text-muted-foreground">
          Живой кодинг вдвоём, камера, AI-подсказки и честная обратная связь. Для работодателей и
          для тех, кто готовится к офферу.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Button asChild variant="secondary" size="lg">
            <Link href="/sessions">Создать сессию</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="#leaderboard">Лидерборд</Link>
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
          <span className="text-xs text-muted-foreground">EDITOR.PY — ИНТЕРВЬЮ #4092</span>
        </div>

        <div className="space-y-1 p-4">
          <p>
            <span className="text-muted-foreground/60">1</span>{" "}
            <span className="text-primary">class</span> <span className="text-foreground">Solution</span>:
          </p>
          <p>
            <span className="text-muted-foreground/60">2</span>
            {"  "}
            <span className="text-primary">def</span> <span className="text-foreground">two_sum</span>
            (self, nums, target):
          </p>
          <p>
            <span className="text-muted-foreground/60">3</span>
            {"    "}
            <span className="text-muted-foreground"># синхронизация в реальном времени</span>
          </p>
          <p>
            <span className="text-muted-foreground/60">4</span>
            {"    "}
            prev_map = {"{}"} <span className="inline-block h-4 w-px animate-pulse bg-primary align-middle" />
          </p>
        </div>
      </Card>
    </section>
  );
}
