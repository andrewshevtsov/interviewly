"use client";

// Слой features: поиск и фильтрация участников на "Витрине участников" - запросы идут на backend,
// выдача постраничная ("показать ещё"). Кнопку действия на карточке подставляет вызывающий слой.
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { useMemo, useState, type ReactNode } from "react";

import { STACK_OPTIONS } from "@/shared/config/constants";
import { useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { useDebouncedValue } from "@/shared/lib/use-debounced-value";
import { Avatar, AvatarFallback } from "@/shared/ui/avatar";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { participantApi, type Participant, type ParticipantLevel, type ShowcaseFilters } from "@/entities/participant";

const LEVELS: ParticipantLevel[] = ["junior", "middle", "senior"];
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Добавляет значение в массив или убирает, если оно там уже есть.
 * @template T
 * @param {T[]} values - Текущий выбор.
 * @param {T} value - Переключаемое значение.
 * @returns {T[]} Обновлённый выбор.
 */
function toggleValue<T>(values: T[], value: T): T[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

/**
 * Пропсы {@link StatusBadge}.
 */
interface StatusBadgeProps {
  /**
   * Участник сейчас в активной сессии.
   */
  inSession: boolean;
}

/**
 * Бейдж доступности: "на сессии" или "свободен".
 * @param {StatusBadgeProps} props - Состояние участника.
 * @returns {ReactNode} Бейдж.
 */
function StatusBadge(props: StatusBadgeProps) {
  const t = useTranslations("showcase");

  return props.inSession
    ? <Badge variant="warning" className="uppercase">{t("inSession")}</Badge>
    : <Badge variant="success" className="uppercase">{t("available")}</Badge>;
}

/**
 * Пропсы {@link ParticipantBrowser}.
 */
export interface ParticipantBrowserProps {
  /** Кнопка на карточке (например, «откликнуться»): её передаёт виджет, потому что фичи не могут импортировать друг друга. */
  renderAction: (participant: Participant) => ReactNode;
}

/**
 * Витрина участников: поиск, фильтры по уровню и стеку, сетка карточек и "показать ещё".
 * @param {ParticipantBrowserProps} props - Пропсы витрины.
 * @returns {ReactNode} Витрина.
 */
export function ParticipantBrowser(props: ParticipantBrowserProps) {
  const { renderAction } = props;
  const [query, setQuery] = useState("");
  const [levels, setLevels] = useState<ParticipantLevel[]>([]);
  const [stack, setStack] = useState<string[]>([]);
  const common = useTranslations("common");
  const showcase = useTranslations("showcase");
  const profile = useTranslations("profile");
  const leaderboard = useTranslations("leaderboard");

  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const filters = useMemo<ShowcaseFilters>(
    () => ({ levels, stack, query: debouncedQuery }),
    [levels, stack, debouncedQuery],
  );

  const participantsQuery = useInfiniteQuery({
    queryKey: ["showcase", "cards", filters],
    /**
     * Загружает страницу выдачи по текущим фильтрам.
     * @param {{ pageParam: string | undefined }} context - Курсор страницы.
     * @param {string | undefined} context.pageParam - Курсор из предыдущего ответа.
     * @returns {Promise<import('@/entities/participant').ParticipantsPage>} Страница карточек.
     */
    queryFn: ({ pageParam }) => participantApi.list(filters, pageParam),
    initialPageParam: undefined as string | undefined,
    /**
     * Курсор следующей страницы.
     * @param {import('@/entities/participant').ParticipantsPage} lastPage - Последняя загруженная страница.
     * @returns {string | undefined} Курсор.
     */
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    placeholderData: keepPreviousData,
  });

  const participants = participantsQuery.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="grid gap-8 md:grid-cols-[240px_1fr]">
      <aside className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="participant-search">{showcase("searchLabel")}</Label>
          <Input
            id="participant-search"
            placeholder={showcase.raw("searchPlaceholder")}
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
                aria-pressed={levels.includes(level)}
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
                aria-pressed={stack.includes(tech)}
                onClick={() => setStack((current) => toggleValue(current, tech))}
              >
                <Badge variant={stack.includes(tech) ? "default" : "muted"} className="rounded-md px-3 py-1 text-xs">
                  {tech}
                </Badge>
              </button>
            ))}
          </div>
        </div>
      </aside>

      <div>
        {participantsQuery.isPending && <p className="text-muted-foreground">{common("loading")}</p>}

        {participantsQuery.isError && (
          <div className="space-y-3">
            <p className="text-sm text-destructive">{showcase("loadError")}</p>
            <Button variant="outline" onClick={() => void participantsQuery.refetch()}>
              {showcase("retry")}
            </Button>
          </div>
        )}

        {participantsQuery.isSuccess && (
          <>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {showcase("shownCount")}: {participants.length}
            </p>

            {participants.length === 0
              ? <p className="mt-6 text-muted-foreground">{showcase("empty")}</p>
              : (
                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                  {participants.map((participant) => (
                    <Card key={participant.id}>
                      <CardHeader className="flex-row items-start justify-between">
                        <Avatar className="h-12 w-12 bg-muted">
                          <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <StatusBadge inSession={participant.inSession} />
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div>
                          <p className="font-semibold">{participant.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {participant.role} ·{" "}
                            <span className="text-primary capitalize">{profile(participant.level)}</span>
                          </p>
                        </div>

                        {participant.bio && <p className="text-sm text-muted-foreground">{participant.bio}</p>}

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
                          {participant.interviewsCount} {leaderboard("sessions")}
                        </span>
                        {renderAction(participant)}
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}

            {participantsQuery.hasNextPage && (
              <div className="mt-8 flex justify-center">
                <Button
                  variant="outline"
                  isLoading={participantsQuery.isFetchingNextPage}
                  onClick={() => void participantsQuery.fetchNextPage()}
                >
                  {participantsQuery.isFetchingNextPage ? showcase("loadingMore") : showcase("loadMore")}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
