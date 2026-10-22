"use client";

// Слой features: чат двух участников отклика - договориться о деталях встречи.
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type SubmitEvent } from "react";

import { useLocale, useTranslations } from "@/shared/i18n-context";
import { cn } from "@/shared/lib/cn";
import { formatDateTime } from "@/shared/lib/format-date-time";
import { Button } from "@/shared/ui/button";
import { CountBadge } from "@/shared/ui/count-badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Textarea } from "@/shared/ui/textarea";
import {
  MESSAGE_MAX_LENGTH,
  showcaseResponseApi,
  showcaseResponseKeys,
  useUnreadMessages,
  type ChatMessage,
} from "@/entities/showcase-response";

const POLL_INTERVAL_MS = 10_000;

/**
 * Пропсы {@link ChatPanel}.
 */
interface ChatPanelProps {
  /**
   * Отклик, по которому идёт переписка.
   */
  responseId: string;
}

/**
 * Список сообщений и поле ввода.
 * @param {ChatPanelProps} props - Отклик.
 * @returns {import('react').ReactNode} Переписка с формой отправки.
 */
function ChatPanel(props: ChatPanelProps) {
  const { responseId } = props;
  const locale = useLocale();
  const t = useTranslations("showcaseResponses");
  const common = useTranslations("common");
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useQuery({
    queryKey: showcaseResponseKeys.messages(responseId),
    /**
     * Загружает переписку по отклику.
     * @returns {Promise<ChatMessage[]>} Сообщения по порядку отправки.
     */
    queryFn: () => showcaseResponseApi.messages(responseId),
    refetchInterval: POLL_INTERVAL_MS,
  });

  const sendMutation = useMutation({
    /**
     * Отправляет сообщение собеседнику.
     * @returns {Promise<ChatMessage>} Отправленное сообщение.
     */
    mutationFn: () => showcaseResponseApi.sendMessage(responseId, text.trim()),
    /**
     * Очищает поле и перезапрашивает переписку.
     * @returns {Promise<void>} Завершается, когда переписка обновлена.
     */
    onSuccess: () => {
      setText("");

      return queryClient.invalidateQueries({ queryKey: showcaseResponseKeys.messages(responseId) });
    },
  });

  const markReadMutation = useMutation({
    /**
     * Отмечает чат прочитанным, пока он открыт.
     * @returns {Promise<void>} Завершается, когда отметка сохранена.
     */
    mutationFn: () => showcaseResponseApi.markChatRead(responseId),
    /**
     * Обновляет счётчики: значок на кнопке чата гаснет.
     * @returns {Promise<void>} Завершается, когда счётчики перезапрошены.
     */
    onSuccess: () => queryClient.invalidateQueries({ queryKey: showcaseResponseKeys.unread }),
  });
  const markRead = markReadMutation.mutate;

  const messageCount = messagesQuery.data?.length ?? 0;
  const lastMessageId = messagesQuery.data?.map((message) => message.id).pop();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messageCount]);

  useEffect(() => {
    if (messagesQuery.isSuccess) {
      markRead();
    }
  }, [messagesQuery.isSuccess, lastMessageId, markRead]);

  /**
   * Отправляет сообщение, если оно не пустое.
   * @param {SubmitEvent<HTMLFormElement>} event - Submit формы.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    if (text.trim() !== "") {
      sendMutation.mutate();
    }
  }

  let body = <p className="text-sm text-muted-foreground">{common("loading")}</p>;

  if (messagesQuery.isError) {
    body = <p className="text-sm text-destructive">{t("chatLoadError")}</p>;
  } else if (messagesQuery.data?.length === 0) {
    body = <p className="text-sm text-muted-foreground">{t("chatEmpty")}</p>;
  } else if (messagesQuery.data) {
    body = (
      <ul className="space-y-3">
        {messagesQuery.data.map((message: ChatMessage) => (
          <li key={message.id} className={cn("flex flex-col", message.mine ? "items-end" : "items-start")}>
            <span
              className={cn(
                "max-w-[85%] whitespace-pre-wrap break-words rounded-lg px-3 py-2 text-sm",
                message.mine ? "bg-primary text-primary-foreground" : "bg-muted",
              )}
            >
              {message.text}
            </span>
            <span className="mt-1 text-[10px] text-muted-foreground">
              {message.mine ? t("chatYou") : t("chatPartner")} · {formatDateTime(message.createdAt, locale)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-4">
      <div className="max-h-80 min-h-32 overflow-y-auto rounded-md border border-border p-3">
        {body}
        <div ref={bottomRef} />
      </div>

      <form className="space-y-2" onSubmit={handleSubmit}>
        <Textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          maxLength={MESSAGE_MAX_LENGTH}
          placeholder={t.raw("chatPlaceholder")}
          aria-label={t("chatPlaceholder")}
          className="min-h-20"
        />
        {sendMutation.isError && (
          <p className="text-sm text-destructive" role="alert">
            {t("chatSendError")}
          </p>
        )}
        <Button type="submit" isLoading={sendMutation.isPending} disabled={text.trim() === ""}>
          {sendMutation.isPending ? t("chatSending") : t("chatSend")}
        </Button>
      </form>
    </div>
  );
}

/**
 * Пропсы {@link ResponseChat}.
 */
export interface ResponseChatProps {
  /**
   * Отклик, по которому открывается чат (владелец уже принял или отклонил его).
   */
  responseId: string;
}

/**
 * Кнопка «чат» и окно с перепиской по отклику.
 * @param {ResponseChatProps} props - Отклик.
 * @returns {import('react').ReactNode} Кнопка с окном чата.
 */
export function ResponseChat(props: ResponseChatProps) {
  const t = useTranslations("showcaseResponses");
  const unread = useUnreadMessages();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          {t("chat")}
          <CountBadge count={unread.countFor(props.responseId)} />
        </Button>
      </DialogTrigger>
      <DialogContent closeLabel={t("close")}>
        <DialogHeader>
          <DialogTitle>{t("chatTitle")}</DialogTitle>
          <DialogDescription>{t("chatDescription")}</DialogDescription>
        </DialogHeader>
        <ChatPanel responseId={props.responseId} />
      </DialogContent>
    </Dialog>
  );
}
