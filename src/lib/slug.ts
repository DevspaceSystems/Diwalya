export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Ensures a slug is unique by appending a random suffix if needed.
 * In a real-world app, you'd check the DB, but for this implementation
 * we'll use a short random string to avoid collisions if names are identical.
 */
export function generateUniqueSlug(name: string): string {
  const baseSlug = generateSlug(name);
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${baseSlug}-${randomSuffix}`;
}
