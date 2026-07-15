/**
 * PHP-style empty() function for TypeScript
 */
export function isEmpty(value: any): boolean {
  // 1. Check for null/undefined
  if (value == null) return true;

  // 2. Check for empty string, false, 0, "0"
  if (value === "" || value === 0 || value === "0" || value === false) return true;

  // 3. Check for empty arrays
  if (Array.isArray(value) && value.length === 0) return true;

  // 4. Check for empty objects (optional, like PHP's empty array behavior)
  if (typeof value === "object" && Object.keys(value).length === 0) return true;

  return false;
}
