"use client";

// Слой views: Шлюз "Открытой сессии". По GET /sessions/:id/me решает, что показать:
// комнату (участник), заявку/ожидание (гость по ссылке) или сообщение (закрыта / не найдена).
import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useQuery, type Query } from "@tanstack/react-query";

import { RequestAccessForm } from "@/features/join-session";
import { isSessionClosed, sessionApi, type MySessionState } from "@/entities/session";
import { getHttpStatus } from "@/shared/api/http-client";
import { getLocalizedHref } from "@/shared/i18n";
import { useLocale, useTranslations } from "@/shared/i18n-context";
import { LiveSessionRoom } from "./LiveSessionRoom";

const HTTP_UNAUTHORIZED = 401;
const WAITING_POLL_INTERVAL_MS = 3000;
// В комнате владение может перейти к другому интервьюеру - так права переключаются без перезагрузки.
const IN_ROOM_POLL_INTERVAL_MS = 5000;

/**
 * Пропсы {@link LiveSessionGate}.
 */
export interface LiveSessionGateProps {
  /**
   * Сессия, открытая по ссылке.
   */
  sessionId: string;
}

/**
 * Опрашивает состояние пользователя, пока он ждёт одобрения (часто) и пока он в комнате
 * (чтобы заметить передачу владения); в остальных случаях ждать нечего.
 * @param {Query<MySessionState>} query - Запрос положения пользователя.
 * @returns {number | false} Интервал опроса в мс или `false`, чтобы остановить опрос.
 */
function getPollInterval(query: Query<MySessionState>): number | false {
  const state = query.state.data;
  if (state?.role) {
    return IN_ROOM_POLL_INTERVAL_MS;
  }

  return state?.accessRequestStatus === "PENDING" ? WAITING_POLL_INTERVAL_MS : false;
}

/**
 * Пропсы {@link CenteredMessage}.
 */
interface CenteredMessageProps {
  /**
   * Содержимое по центру экрана.
   */
  children: ReactNode;
}

/**
 * Сообщение по центру экрана для состояний вне комнаты
 * @param {CenteredMessageProps} props
 * @returns {ReactNode}
 */
function CenteredMessage(props: CenteredMessageProps) {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 text-center text-muted-foreground">
      {props.children}
    </main>
  );
}

/**
 * Загружает состояние пользователя в сессии и рендерит подходящий экран; если пользователь
 * не авторизован - редирект на "/auth"
 * @param {LiveSessionGateProps} props
 * @returns {import('react').ReactNode} Комната, экран заявки или сообщение.
 */
export function LiveSessionGate(props: LiveSessionGateProps) {
  const { sessionId } = props;
  const router = useRouter();
  const locale = useLocale();
  const common = useTranslations("common");
  const t = useTranslations("interview");

  /**
   * Загружает состояние пользователя в этой сессии
   * @returns {Promise<MySessionState>} Роль и последняя заявка
   */
  function getMyState() {
    return sessionApi.getMyState(sessionId);
  }

  const stateQuery = useQuery({
    queryKey: ["sessions", sessionId, "me"],
    queryFn: getMyState,
    retry: false,
    refetchInterval: getPollInterval,
    // Ожидающий гость иногда уходит на другую вкладку - после одобрения он должен войти в комнату
    // сразу, а не когда вернётся
    refetchIntervalInBackground: true,
  });
  const isUnauthorized = getHttpStatus(stateQuery.error) === HTTP_UNAUTHORIZED;

  useEffect(() => {
    if (isUnauthorized) {
      router.replace(getLocalizedHref("/auth", locale));
    }
  }, [isUnauthorized, router, locale]);

  if (stateQuery.isPending || isUnauthorized) {
    return <CenteredMessage>{common("loading")}</CenteredMessage>;
  }

  // Упавший фоновый опрос не должен выкидывать из комнаты: пока есть прошлые данные, показываем их
  const state = stateQuery.data;
  if (!state) {
    return <CenteredMessage>{t("cannotOpenSession")}</CenteredMessage>;
  }

  if (isSessionClosed(state.sessionStatus)) {
    return <CenteredMessage>{t("sessionClosed")}</CenteredMessage>;
  }

  if (!state.role) {
    return (
      <CenteredMessage>
        <RequestAccessForm sessionId={sessionId} state={state} />
      </CenteredMessage>
    );
  }

  return <LiveSessionRoom sessionId={sessionId} isOwner={state.isOwner} currentUserId={state.userId} />;
}
