"use client";

// Слой features: форма профиля - редактируемые поля, уровень и стек.
import { useState, type SubmitEvent } from "react";

import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import type { Profile, ProfileLevel } from "@/entities/profile";

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
  label: string;
}

const LEVELS: LevelOption[] = [
  { id: "junior", label: "Junior" },
  { id: "middle", label: "Middle" },
  { id: "senior", label: "Senior" },
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
 * Prevents the default full-page submit for this demo form (no backend wired up yet).
 * @param {SubmitEvent<HTMLFormElement>} event - The form submit event.
 * @returns {void}
 */
function handleSubmit(event: SubmitEvent<HTMLFormElement>): void {
  event.preventDefault();
}

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
 * @param {ProfileFormProps} props - Props for the form.
 * @returns {import('react').ReactNode} The profile form.
 */
export function ProfileForm(props: ProfileFormProps) {
  const { profile } = props;
  // eslint-disable-next-line @typescript-eslint/naming-convention -- useState pair, not a real constant
  const [level, setLevel] = useState<ProfileLevel>(profile.level);
  const [stack, setStack] = useState<string[]>(profile.stack);

  /**
   * Toggles a stack tag on/off in the local selection.
   * @param {string} tech - Tag to toggle.
   * @returns {void}
   */
  function toggleStack(tech: string): void {
    setStack((current) => (current.includes(tech) ? current.filter((item) => item !== tech) : [...current, tech]));
  }

  return (
    <Card className="p-8">
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <Label htmlFor="profile-name">Имя и фамилия</Label>
          <Input id="profile-name" defaultValue={profile.name} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-role">Роль</Label>
          <Input id="profile-role" defaultValue={profile.role} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-email">Email</Label>
          <Input id="profile-email" type="email" defaultValue={profile.email} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="profile-telegram">Telegram</Label>
          <Input id="profile-telegram" defaultValue={profile.telegram} />
        </div>

        <div className="space-y-2">
          <Label>Уровень</Label>
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
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Стек</Label>
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
          <Label htmlFor="profile-bio">О себе (текст карточки)</Label>
          <Textarea id="profile-bio" defaultValue={profile.bio} />
        </div>

        <Button type="submit">Сохранить изменения</Button>
      </form>
    </Card>
  );
}
