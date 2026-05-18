/**
 * A1.3 — hide a badge element when its inner value is empty or a "-"
 * placeholder. Mirrors the existing turn-reason hide pattern but applied
 * to the badge container (parent), not the inner span.
 */
export function applyHideIfEmpty(
  badgeEl: HTMLElement | null,
  value: string | null | undefined
): void {
  if (!badgeEl) return;
  const text = (value ?? "").trim();
  const isEmpty = text === "" || text === "-";
  badgeEl.classList.toggle("hidden", isEmpty);
}
