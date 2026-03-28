/** Email como chave de login/signup: sem espaços, minúsculas. */
export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
