import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges conditional class names and resolves conflicting Tailwind utility classes.
 * @param {ClassValue[]} inputs - Class name values (strings, objects, arrays, falsy values).
 * @returns {string} The merged class name string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
