// Слой widgets: секция "Витрина участников" - карточки партнёров для пробного интервью.
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/ui/card";
import { getServerTranslations } from "@/shared/i18n-server";

/**
 * A participant shown in the homepage showcase grid.
 */
interface Participant {
  /**
   * Unique id, used as the React key.
   */
  id: string;

  /**
   * Display name.
   */
  name: string;

  /**
   * Role/title shown under the name.
   */
  role: string;

  /**
   * Tech stack tags.
   */
  stack: string[];

  /**
   * Current availability status.
   */
  status: "available" | "in-session" | "top-rated";
}

const STATUS_LABEL_KEYS = {
  available: "available",
  "in-session": "inSession",
  "top-rated": "topRated",
} as const;

const PARTICIPANTS: Participant[] = [
  {
    id: "p-1",
    name: "Артём Соколов",
    role: "Senior Frontend Engineer",
    stack: ["React", "TypeScript", "Next.js"],
    status: "available",
  },
  {
    id: "p-2",
    name: "Елена Волкова",
    role: "Backend Specialist",
    stack: ["Python", "Go", "PostgreSQL"],
    status: "in-session",
  },
  {
    id: "p-3",
    name: "Марк Ченов",
    role: "Full Stack Developer",
    stack: ["Node.js", "Docker", "Kubernetes"],
    status: "top-rated",
  },
];

/**
 * Props for {@link StatusBadge}.
 */
interface StatusBadgeProps {
  /**
   * The participant's current status.
   */
  status: Participant["status"];

  /** Localized status label. */
  label: string;
}

/**
 * Renders a participant's status badge with the right color for the given status.
 * @param {StatusBadgeProps} props - The participant's current status.
 * @returns {import('react').ReactNode} The status badge.
 */
function StatusBadge(props: StatusBadgeProps) {
  const { label, status } = props;

  if (status === "available") {
    return (
      <Badge variant="success" className="uppercase">
        {label}
      </Badge>
    );
  }

  if (status === "in-session") {
    return (
      <Badge variant="warning" className="uppercase">
        {label}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-primary/40 uppercase text-primary">
      {label}
    </Badge>
  );
}

/**
 * "Витрина участников" section: a grid of participant cards for finding a mock-interview partner.
 * @returns {import('react').ReactNode} The showcase section.
 */
export async function Showcase() {
  const t = await getServerTranslations("showcase");

  return (
    <section id="showcase" className="mx-auto max-w-6xl px-6 py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="mt-2 text-muted-foreground">{t("description")}</p>
        </div>
        <Button variant="outline">{t("allCards")}</Button>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {PARTICIPANTS.map((participant) => (
          <Card key={participant.id}>
            <CardHeader className="flex-row items-start justify-between">
              <Avatar className="h-12 w-12 bg-muted">
                <AvatarFallback>{participant.name[0]}</AvatarFallback>
              </Avatar>
              <StatusBadge
                status={participant.status}
                label={t(STATUS_LABEL_KEYS[participant.status])}
              />
            </CardHeader>

            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold">{participant.name}</p>
                <p className="text-sm text-muted-foreground">{participant.role}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {participant.stack.map((tech) => (
                  <Badge
                    key={tech}
                    variant="muted"
                    className="rounded-md text-[10px] uppercase tracking-wide"
                  >
                    {tech}
                  </Badge>
                ))}
              </div>
            </CardContent>

            <CardFooter>
              <Button variant="outline" className="w-full">
                {t("respond")}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </section>
  );
}
