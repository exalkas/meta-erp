/**
 * Utility function for combining class names
 * A simple implementation for concatenating class names with conditional logic
 */

export function cn(...inputs: (string | undefined | null | boolean)[]): string {
  return inputs.filter(Boolean).join(" ").trim();
}
