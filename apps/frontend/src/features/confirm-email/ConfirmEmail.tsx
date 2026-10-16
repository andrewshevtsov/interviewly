"use client";

// Слой features: подтверждение смены email по токену из ссылки в письме.
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

import { useTranslations } from "@/shared/i18n-context";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { LocalizedLink } from "@/shared/ui/localized-link";
import { classifyEmailChangeError, CURRENT_USER_QUERY_KEY, userApi } from "@/entities/user";

/**
 * Props for {@link ConfirmEmail}.
 */
export interface ConfirmEmailProps {
  /**
   * Токен из query-параметра.
   */
  token: string;
}

/**
 * Подтверждает адрес по токену.
 * @param {ConfirmEmailProps} props - Токен из ссылки.
 * @returns {import('react').ReactNode} Карточка с состоянием подтверждения.
 */
export function ConfirmEmail(props: ConfirmEmailProps) {
  const { token } = props;
  const t = useTranslations("confirmEmail");
  const account = useTranslations("account");
  const queryClient = useQueryClient();

  const confirmation = useQuery({
    queryKey: ["users", "email-change", "confirm", token],
    /**
     * Отправляет токен на сервер.
     * @returns {Promise<import('@/entities/user').ConfirmedEmail>} Новый адрес аккаунта.
     */
    queryFn: () => userApi.confirmEmailChange(token),
    enabled: token !== "",
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (confirmation.isSuccess) {
      void queryClient.invalidateQueries({ queryKey: CURRENT_USER_QUERY_KEY });
    }
  }, [confirmation.isSuccess, queryClient]);

  let status = <p className="text-muted-foreground">{t("pending")}</p>;

  if (token === "") {
    status = <p className="text-destructive">{t("noToken")}</p>;
  } else if (confirmation.isError) {
    const key = classifyEmailChangeError(confirmation.error);
    status = (
      <p className="text-destructive">{key === "errEmailTaken" ? account("errEmailTaken") : t("errInvalid")}</p>
    );
  } else if (confirmation.isSuccess) {
    status = (
      <>
        <p className="font-medium">{t("success")}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("successText")} <strong>{confirmation.data.email}</strong>
        </p>
      </>
    );
  }

  return (
    <Card className="p-8">
      {status}
      <Button asChild className="mt-6">
        <LocalizedLink href="/profile">{t("toProfile")}</LocalizedLink>
      </Button>
    </Card>
  );
}
