// Слой widgets: превью живой сессии - видео-панели, AI-подсказка и редактор кода.
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

/**
 * Props for {@link VideoPanel}.
 */
interface VideoPanelProps {
  /**
   * Panel label, e.g. "ВИДЕО ИНТЕРВЬЮЕРА".
   */
  label: string;

  /**
   * Name tag shown over the video, e.g. "Мария (Интервьюер)".
   */
  name: string;
}

/**
 * Placeholder video panel (e.g. "ВИДЕО ИНТЕРВЬЮЕРА") with a name tag.
 * @param {VideoPanelProps} props - Panel label and the person's name tag.
 * @returns {import('react').ReactNode} The video panel.
 */
function VideoPanel(props: VideoPanelProps) {
  const { label, name } = props;

  return (
    <Card className="relative flex h-32 items-center justify-center bg-muted/40 text-xs tracking-wide text-muted-foreground">
      {label}
      <span className="absolute bottom-2 left-2 rounded-md bg-background/80 px-2 py-1 text-xs text-foreground">
        {name}
      </span>
    </Card>
  );
}

/**
 * Live session preview section: mock interviewer/candidate video feed, an AI hint and the shared
 * code editor - illustrates what happens once a session starts.
 * @returns {import('react').ReactNode} The live session preview section.
 */
export function LiveSessionPreview() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <Card className="grid gap-4 p-4 md:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-4">
          <VideoPanel label="ВИДЕО ИНТЕРВЬЮЕРА" name="Мария (Интервьюер)" />
          <VideoPanel label="ВИДЕО КАНДИДАТА" name="Вы" />

          <Card className="bg-muted/40 p-4">
            <p className="text-xs font-semibold tracking-wide text-primary">AI-ПОДСКАЗКА</p>
            <p className="mt-2 text-sm text-muted-foreground">
              «Подумайте о сложности поиска в неотсортированном массиве против хеш-таблицы…»
            </p>
          </Card>

          <Button variant="outline" className="uppercase tracking-wide">
            Подсказка ИИ (2/3)
          </Button>
        </div>

        <Card className="flex flex-col font-mono text-sm">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-primary">main.py</span>
              <span className="text-xs text-muted-foreground">Автосохранение...</span>
            </div>
            <span className="flex items-center gap-1.5 text-xs text-success">
              <span className="h-1.5 w-1.5 rounded-full bg-success" />
              SYNCED
            </span>
          </div>

          <div className="flex-1 space-y-2 p-4">
            <p className="text-muted-foreground"># Задача: развернуть связный список на месте</p>
            <p>
              <span className="text-primary">def</span> <span className="text-foreground">reverse_list</span>
              (head):
            </p>
            <p className="pl-4">prev, curr = None, head</p>
            <p className="pl-4">
              <span className="text-primary">while</span> curr:
            </p>
            <p className="pl-8">next_temp = curr.next</p>
            <p className="pl-8">curr.next = prev</p>
            <p className="pl-8">prev = curr</p>
            <p className="pl-8">curr = next_temp</p>
            <p className="pl-4">
              <span className="text-primary">return</span> prev
            </p>
            <p className="italic text-muted-foreground">Ждём объяснение решения от кандидата…</p>
          </div>

          <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs">
            <span className="text-muted-foreground">ID сессии: SECURE-77-X9</span>
            <Button size="sm" className="uppercase tracking-wide">
              Открыть комнату
            </Button>
          </div>
        </Card>
      </Card>
    </section>
  );
}
