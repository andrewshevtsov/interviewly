/* eslint-disable indent */
// Слой shared: общие константы без бизнес-логики, доступны всем слоям выше.
export const MAX_AI_HINTS_PER_SESSION = 3;
export const SESSION_ID_LENGTH = 12;
export const MAX_SESSION_SCORE = 10;

/**
 * Text/textarea fields on the profile card, in display order. `group` selects which
 * `useTranslations()` namespace `lang` is looked up in ("common" vs "profile"), `name`
 * is the `<input name="...">` used for `FormData`, and `type` picks the field element.
 */
export const PROFILE_FIELDS = [
    {
        id: "profile-name",
        name: "name",
        lang: "fullName",
        group: "profile",
        type: "text",
        required: true,
    },
    {
        id: "profile-role",
        name: "role",
        lang: "role",
        group: "profile",
        type: "text",
        required: true,
    },
    {
        id: "profile-email",
        name: "email",
        lang: "email",
        group: "common",
        type: "email",
        required: true,
    },
    {
        id: "profile-telegram",
        name: "telegram",
        lang: "telegram",
        group: "common",
        type: "text",
        required: false,
    },
    {
        id: "profile-bio",
        name: "bio",
        lang: "bio",
        group: "profile",
        type: "textarea",
        required: false,
    },
] as const;

/**
 * Classes shared by the level/stack toggle "buttons": a `peer-checked:` variant makes the
 * hidden radio/checkbox's checked state drive the visible style, instead of JS.
 */
export const TOGGLE_UNCHECKED_CLASSES =
    "border-border text-muted-foreground hover:text-foreground transition-colors";
export const TOGGLE_CHECKED_CLASSES =
    "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground";
