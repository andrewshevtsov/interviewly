// Слой entities: запросы к /profiles, привязанные к профилю текущего пользователя.
// Импортирует только entities (свой слайс) и shared.
import { httpClient } from "@/shared/api/http-client";
import type { Profile } from "./index";

/**
 * A profile as returned by the API - the editable {@link Profile} fields plus its id.
 */
interface ProfileDto extends Profile {
  /**
   * Profile identifier assigned by the backend.
   */
  id: string;
}

/**
 * Fills in array/string fields the DB allows as `null` (`stack`, `telegram`, `bio`) with the
 * `Profile` type's non-nullable defaults, so consumers like `ProfileForm` never see `null`.
 * @param {ProfileDto | null} dto - Raw API response.
 * @returns {ProfileDto | null} The normalized profile, or `null` if none exists.
 */
function normalizeProfile(dto: ProfileDto | null): ProfileDto | null {
  if (!dto) {
    return dto;
  }

  return {
    ...dto,
    telegram: dto.telegram ?? "",
    stack: dto.stack ?? [],
    bio: dto.bio ?? "",
  };
}

export const profileApi = {
  /**
   * Fetches the signed-in user's profile, or `null` if they haven't filled it in yet.
   * @returns {Promise<ProfileDto | null>} The profile, or `null` if none exists.
   */
  getMine(): Promise<ProfileDto | null> {
    return httpClient.get<ProfileDto | null>("/profiles/me").then((res) => {
      // Backend sends an EMPTY body (not JSON "null") when there's no profile yet:
      // NestJS turns a `null` controller return into a bodyless `response.end()`,
      // which axios parses as `""`, not `null` - normalize that here.
      return normalizeProfile(res.data || null);
    });
  },

  /**
   * Creates or replaces the signed-in user's profile with the full form state.
   * @param {Profile} profile - Complete profile form state.
   * @returns {Promise<ProfileDto>} The saved profile.
   */
  saveMine(profile: Profile): Promise<ProfileDto> {
    return httpClient
      .put<ProfileDto>("/profiles/me", profile)
      .then((res) => normalizeProfile(res.data) as ProfileDto);
  },
};
