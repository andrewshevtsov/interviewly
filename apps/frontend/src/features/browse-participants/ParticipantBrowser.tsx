"use client";

// Слой features: поиск и фильтрация участников на "Витрине участников".
import { useMemo, useState } from "react";

import { useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import type { Participant, ParticipantLevel, ParticipantStatus } from "@/entities/participant";

const LEVELS: ParticipantLevel[] = ["junior", "middle", "senior"];

const STACK_OPTIONS = [
  "React",
  "TypeScript",
  "Next.js",
  "Node.js",
  "Python",
  "Go",
  "PostgreSQL",
  "Docker",
  "Rust",
  "Kubernetes",
];

const STATUS_LABEL_KEYS: Record<ParticipantStatus, "available" | "inSession" | "topRated"> = {
  available: "available",
  "in-session": "inSession",
  "top-rated": "topRated",
};

/**
 * Toggles a value in an array: removes it if present, appends it otherwise.
 * @template T
 * @param {T[]} values - Current selection.
 * @param {T} value - Value to toggle.
 * @returns {T[]} The updated selection.
 */
function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

/**
 * Props for {@link StatusBadge}.
 */
interface StatusBadgeProps {
  /**
   * The participant's current status.
   */
  status: ParticipantStatus;
}

/**
 * Renders a participant's status badge with the right color for the given status.
 * @param {StatusBadgeProps} props - The participant's current status.
 * @returns {import('react').ReactNode} The status badge.
 */
function StatusBadge(props: StatusBadgeProps) {
  const { status } = props;
  const t = useTranslations("showcase");

  if (status === "available") {
    return (
      <Badge variant="success" className="uppercase">
        {t(STATUS_LABEL_KEYS[status])}
      </Badge>
    );
  }

  if (status === "in-session") {
    return (
      <Badge variant="warning" className="uppercase">
        {t(STATUS_LABEL_KEYS[status])}
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-primary/40 uppercase text-primary">
      {t(STATUS_LABEL_KEYS[status])}
    </Badge>
  );
}

/**
 * Checks whether a participant matches the current search query (name, role or stack).
 * @param {Participant} participant - Participant to test.
 * @param {string} query - Lowercased, trimmed search query.
 * @returns {boolean} `true` if `participant` matches `query`.
 */
function matchesQuery(participant: Participant, query: string): boolean {
  if (!query) {
    return true;
  }

  const haystack = [participant.name, participant.role, ...participant.stack]
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

/**
 * Props for {@link ParticipantBrowser}.
 */
export interface ParticipantBrowserProps {
  /**
   * All participants to search and filter.
   */
  participants: Participant[];
}

/**
 * "Витрина участников" browser: a search box, level/stack filters and the resulting grid of
 * participant cards.
 * @param {ParticipantBrowserProps} props - Props for the browser.
 * @returns {import('react').ReactNode} The participant browser.
 */
export function ParticipantBrowser(props: ParticipantBrowserProps) {
  const { participants } = props;
  const [query, setQuery] = useState("");
  const [levels, setLevels] = useState<ParticipantLevel[]>([]);
  const [stack, setStack] = useState<string[]>([]);
  const showcase = useTranslations("showcase");
  const profile = useTranslations("profile");
  const leaderboard = useTranslations("leaderboard");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return participants.filter((participant) => {
      const matchesLevel = levels.length === 0 || levels.includes(participant.level);
      const matchesStack =
        stack.length === 0 || participant.stack.some((tech) => stack.includes(tech));

      return matchesLevel && matchesStack && matchesQuery(participant, normalizedQuery);
    });
  }, [participants, query, levels, stack]);

  return (
    <div className="grid gap-8 md:grid-cols-[240px_1fr]">
      <aside className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="participant-search">{showcase("searchLabel")}</Label>
          <Input
            id="participant-search"
            placeholder={showcase("searchPlaceholder")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>{profile("level")}</Label>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => setLevels((current) => toggleValue(current, level))}
                className={cn(
                  "rounded-md border px-3 py-1.5 font-mono text-xs font-medium uppercase tracking-wide transition-colors",
                  levels.includes(level)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                {profile(level)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{profile("stack")}</Label>
          <div className="flex flex-wrap gap-2">
            {STACK_OPTIONS.map((tech) => (
              <button
                key={tech}
                type="button"
                onClick={() => setStack((current) => toggleValue(current, tech))}
              >
                <Badge
                  variant={stack.includes(tech) ? "default" : "muted"}
                  className="rounded-md px-3 py-1 text-xs"
                >
                  {tech}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {showcase("foundCount")}: {filtered.length}
        </p>

        <div className="mt-4 grid gap-6 sm:grid-cols-2">
          {filtered.map((participant) => (
            <Card key={participant.id}>
              <CardHeader className="flex-row items-start justify-between">
                <Avatar className="h-12 w-12 bg-muted">
                  <AvatarFallback>{participant.name[0]}</AvatarFallback>
                </Avatar>
                <StatusBadge status={participant.status} />
              </CardHeader>

              <CardContent className="space-y-3">
                <div>
                  <p className="font-semibold">{participant.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {participant.role} ·{" "}
                    <span className="text-primary capitalize">{profile(participant.level)}</span>
                  </p>
                </div>

                <p className="text-sm text-muted-foreground">{participant.bio}</p>

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

              <CardFooter className="items-center justify-between gap-4">
                <span className="text-xs text-muted-foreground">
                  {participant.sessionsCount} {leaderboard("sessions")} · {participant.rating}
                </span>
                <Button variant="outline">{showcase("respond")}</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
