/**
 * Normalizes a raw experience level string for display.
 * @param {string} level - Raw experience level, e.g. "junior", "middle", "senior".
 * @returns {string} Trimmed, lowercased level.
 */
export function formatLevel(level: string): string {
  return level.trim().toLowerCase();
}
