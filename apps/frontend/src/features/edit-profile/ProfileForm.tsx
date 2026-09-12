"use client";

// Слой features: форма профиля - редактируемые поля, уровень и стек.
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type SubmitEvent } from "react";

import { cn } from "@/shared/lib/cn";
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

  const [name, setName] = useState(profile.name);
  const [role, setRole] = useState(profile.role);
  const [email, setEmail] = useState(profile.email);
  const [telegram, setTelegram] = useState(profile.telegram);
  const [level, setLevel] = useState<ProfileLevel>(profile.level);
  const [stack, setStack] = useState<string[]>(profile.stack);
  const [bio, setBio] = useState(profile.bio);

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
   * Toggles a stack tag on/off in the local selection.
   * @param {string} tech - Tag to toggle.
   * @returns {void}
   */
  function toggleStack(tech: string): void {
    setStack((current) =>
      current.includes(tech) ? current.filter((item) => item !== tech) : [...current, tech],
    );
  }

  /**
   * Submits the whole profile card for saving.
   * @param {SubmitEvent<HTMLFormElement>} event - The form submit event.
   * @returns {void}
   */
  function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
    event.preventDefault();
    saveMutation.mutate({ name, role, email, telegram, level, stack, bio });
  }

  return (
    <Card className="p-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="profile-name">{t("fullName")}</Label>
          <Input id="profile-name" value={name} onChange={(event) => setName(event.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-role">{t("role")}</Label>
          <Input id="profile-role" value={role} onChange={(event) => setRole(event.target.value)} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email">{common("email")}</Label>
          <Input
            id="profile-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-telegram">{common("telegram")}</Label>
          <Input id="profile-telegram" value={telegram} onChange={(event) => setTelegram(event.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>{t("level")}</Label>
          <div className="flex gap-2">
            {LEVELS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLevel(item.id)}
                className={cn(
                  "rounded-md border px-4 py-2 text-sm font-medium transition-colors",
                  level === item.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground hover:text-foreground",
                )}
              >
                <span className="capitalize">{t(item.labelKey)}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>{t("stack")}</Label>
          <div className="flex flex-wrap gap-2">
            {STACK_OPTIONS.map((tech) => (
              <button key={tech} type="button" onClick={() => toggleStack(tech)}>
                <Badge
                  variant={stack.includes(tech) ? "default" : "muted"}
                  className="rounded-md px-3 py-1 text-xs font-mono uppercase tracking-wide"
                >
                  {tech}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-bio">{t("bio")}</Label>
          <Textarea id="profile-bio" value={bio} onChange={(event) => setBio(event.target.value)} />
        </div>

        {saveMutation.isError && <p className="text-sm text-destructive">{t("saveError")}</p>}
        {saveMutation.isSuccess && <p className="text-sm text-muted-foreground">{t("saveSuccess")}</p>}

        <Button type="submit" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? t("savePending") : t("saveChanges")}
        </Button>
      </form>
    </Card>
  );
}
