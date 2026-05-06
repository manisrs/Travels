/**
 * Minimal HTML escapes for SSR dynamic fields only.
 *
 * @param {string|null|undefined} raw
 */
export function escapeHtml(raw) {
  const s = raw == null ? "" : String(raw);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
