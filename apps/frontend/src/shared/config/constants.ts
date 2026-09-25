/* eslint-disable indent */
// Слой shared: общие константы без бизнес-логики, доступны всем слоям выше.
export const MAX_AI_HINTS_PER_SESSION = 3;
export const MAX_SESSION_SCORE = 10;

/**
 * Текстовые поля карточки профиля в порядке отображения. `group` выбирает пространство имён
 * `useTranslations()`, в котором ищется `lang` ("common" или "profile"), `name` - это
 * `<input name="...">` для `FormData`, а `type` определяет элемент поля.
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
 * Общие классы "кнопок"-переключателей уровня и стека: вариант `peer-checked:` связывает
 * видимый стиль с состоянием скрытого radio/checkbox без JS.
 */
export const TOGGLE_UNCHECKED_CLASSES =
    "border-border text-muted-foreground hover:text-foreground transition-colors";
export const TOGGLE_CHECKED_CLASSES =
    "peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground";
