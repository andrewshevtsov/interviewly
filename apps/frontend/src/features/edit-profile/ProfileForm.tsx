"use client";

// Слой features: форма профиля - редактируемые поля, уровень и стек.
// Полностью неконтролируемая форма: значения читаются через FormData при submit,
// без useState на поля. Уровень и стек - обычные radio/checkbox, стилизованные под
// кнопки/бейджи через Tailwind `peer-checked:`, а не через JS-состояние.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { SubmitEvent } from "react";

import { PROFILE_FIELDS, TOGGLE_CHECKED_CLASSES, TOGGLE_UNCHECKED_CLASSES } from "@/shared/config/constants";
import { cn } from "@/shared/lib/cn";
import type { MessageKey } from "@/shared/i18n";
import { useTranslations } from "@/shared/i18n-context";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { profileApi, type Profile, type ProfileLevel } from "@/entities/profile";

/**
 * A single option in the "Уровень" toggle group.
 */
interface LevelOption {
  /**
   * Level identifier.
   */
  id: ProfileLevel;

  /**
   * Level label.
   */
  labelKey: ProfileLevel;
}

const LEVELS: LevelOption[] = [
  { id: "junior", labelKey: "junior" },
  { id: "middle", labelKey: "middle" },
  { id: "senior", labelKey: "senior" },
];

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

/**
 * Props for {@link ProfileForm}.
 */
export interface ProfileFormProps {
  /**
   * Initial profile values to populate the form with.
   */
  profile: Profile;
}

/**
 * Editable profile form: name, role, contact fields, level toggle, stack tags and bio.
 * Saves the whole card to the signed-in user's profile on submit.
 * @param {ProfileFormProps} props - Props for the form.
 * @returns {import('react').ReactNode} The profile form.
 */
export function ProfileForm(props: ProfileFormProps) {
  const { profile } = props;
  const queryClient = useQueryClient();
  const common = useTranslations("common");
  const t = useTranslations("profile");

  /**
   * Labels a text/textarea field from the right translation namespace.
   * @param {(typeof PROFILE_FIELDS)[number]} field - Field descriptor from `PROFILE_FIELDS`.
   * @returns {string} The field's translated label.
   */
  function fieldLabel(field: (typeof PROFILE_FIELDS)[number]): string {
    return field.group === "common"
      ? common(field.lang as MessageKey<"common">)
      : t(field.lang as MessageKey<"profile">);
  }

  const saveMutation = useMutation({
    mutationFn: profileApi.saveMine,
    /**
     * Updates the cached profile query with the just-saved data.
     * @param {Profile} saved - The profile as saved by the backend.
     * @returns {void}
     */
    onSuccess: (saved) => {
      queryClient.setQueryData(["profile", "me"], saved);
    },
  });

  /**
   * Reads the whole card from the native form and submits it.
   * @param {SubmitEvent<HTMLFormElement>} event - The form submit event.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const { name, role, email, telegram, level, bio } = Object.fromEntries(formData) as Record<
      "name" | "role" | "email" | "telegram" | "level" | "bio",
      string
    >;
    const stack = formData.getAll("stack") as string[];

    saveMutation.mutate({ name, role, email, telegram, level: level as ProfileLevel, stack, bio });
  }

  return (
    <Card className="p-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
        {PROFILE_FIELDS.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>{fieldLabel(field)}</Label>
            {field.type === "textarea"
              ? (
                <Textarea id={field.id} name={field.name} defaultValue={profile[field.name]} />
              )
              : (
                <Input
                  id={field.id}
                  name={field.name}
                  type={field.type}
                  defaultValue={profile[field.name]}
                  required={field.required}
                />
              )}
          </div>
        ))}

        <div className="space-y-2">
          <Label>{t("level")}</Label>
          <div className="flex gap-2">
            {LEVELS.map((item) => (
              <label key={item.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="level"
                  value={item.id}
                  defaultChecked={profile.level === item.id}
                  className="peer sr-only"
                />
                <span
                  className={cn(
                    "block rounded-md border px-4 py-2 text-sm font-medium capitalize",
                    TOGGLE_UNCHECKED_CLASSES,
                    TOGGLE_CHECKED_CLASSES,
                  )}
                >
                  {t(item.labelKey)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("stack")}</Label>
          <div className="flex flex-wrap gap-2">
            {STACK_OPTIONS.map((tech) => (
              <label key={tech} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="stack"
                  value={tech}
                  defaultChecked={profile.stack.includes(tech)}
                  className="peer sr-only"
                />
                <Badge
                  variant="muted"
                  className={cn(
                    "rounded-md px-3 py-1 text-xs font-mono uppercase tracking-wide",
                    "peer-checked:border-transparent peer-checked:bg-primary peer-checked:text-primary-foreground",
                  )}
                >
                  {tech}
                </Badge>
              </label>
            ))}
          </div>
        </div>

        {saveMutation.isError && <p className="text-sm text-destructive">{t("saveError")}</p>}
        {saveMutation.isSuccess && <p className="text-sm text-muted-foreground">{t("saveSuccess")}</p>}

        <Button type="submit" isLoading={saveMutation.isPending}>
          {saveMutation.isPending ? t("savePending") : t("saveChanges")}
        </Button>
      </form>
    </Card>
  );
}
