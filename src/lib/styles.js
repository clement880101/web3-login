const STYLE_ID = 'w3l-styles';

/**
 * Every value a consumer might reasonably want to change is a custom property
 * with a fallback, so restyling needs no build tooling:
 *
 *   :root { --w3l-accent: #e11d48; --w3l-radius: 2px; }
 *
 * Class names are prefixed `w3l-` rather than hashed. A hash would need a build
 * step; a prefix is enough to stay out of a host application's way.
 */
export const CSS = `
.w3l-root {
  --w3l-font: var(--w3l-font-family, ui-sans-serif, system-ui, -apple-system,
    "Segoe UI", Roboto, Helvetica, Arial, sans-serif);
  --w3l-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  --w3l-radius-resolved: var(--w3l-radius, 8px);
  --w3l-accent-resolved: var(--w3l-accent, #4f46e5);
  --w3l-accent-fg-resolved: var(--w3l-accent-fg, #ffffff);
  --w3l-fg-resolved: var(--w3l-fg, #111827);
  --w3l-muted-resolved: var(--w3l-muted, #6b7280);
  --w3l-surface-resolved: var(--w3l-surface, #ffffff);
  --w3l-border-resolved: var(--w3l-border, #d1d5db);
  --w3l-warning-resolved: var(--w3l-warning, #b45309);
  --w3l-danger-resolved: var(--w3l-danger, #b91c1c);

  position: relative;
  display: inline-block;
  font-family: var(--w3l-font);
}

@media (prefers-color-scheme: dark) {
  .w3l-root {
    --w3l-fg-resolved: var(--w3l-fg, #f3f4f6);
    --w3l-muted-resolved: var(--w3l-muted, #9ca3af);
    --w3l-surface-resolved: var(--w3l-surface, #1f2430);
    --w3l-border-resolved: var(--w3l-border, #374151);
    --w3l-accent-resolved: var(--w3l-accent, #818cf8);
    --w3l-accent-fg-resolved: var(--w3l-accent-fg, #10121a);
    --w3l-warning-resolved: var(--w3l-warning, #fbbf24);
    --w3l-danger-resolved: var(--w3l-danger, #f87171);
  }
}

.w3l-btn {
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  line-height: 1.2;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  border-radius: var(--w3l-radius-resolved);
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  transition: background-color 120ms ease, border-color 120ms ease,
    opacity 120ms ease;
}

.w3l-btn:focus-visible {
  outline: 2px solid var(--w3l-accent-resolved);
  outline-offset: 2px;
}

.w3l-btn[disabled],
.w3l-btn[aria-disabled='true'] {
  cursor: default;
  opacity: 0.65;
}

.w3l-btn--primary {
  background: var(--w3l-accent-resolved);
  color: var(--w3l-accent-fg-resolved);
}

.w3l-btn--primary:hover:not([disabled]) {
  filter: brightness(1.08);
}

.w3l-btn--outline {
  background: transparent;
  color: var(--w3l-fg-resolved);
  border-color: var(--w3l-border-resolved);
}

/* Only the address wants a monospace face. An EIP-55 checksum also lives in
   its capitalisation, so its case must never be transformed. */
.w3l-btn--mono {
  font-family: var(--w3l-mono);
  font-weight: 500;
  text-transform: none;
}

.w3l-btn--outline:hover:not([disabled]) {
  border-color: var(--w3l-accent-resolved);
}

.w3l-btn--warning {
  background: var(--w3l-warning-resolved);
  color: var(--w3l-accent-fg-resolved);
}

.w3l-btn--warning:hover:not([disabled]) {
  filter: brightness(1.08);
}

.w3l-caret {
  width: 0.5rem;
  height: 0.5rem;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: translateY(-2px) rotate(45deg);
  opacity: 0.6;
}

.w3l-spinner {
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: w3l-spin 700ms linear infinite;
}

@keyframes w3l-spin {
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .w3l-spinner { animation-duration: 2.4s; }
  .w3l-btn { transition: none; }
}

.w3l-menu {
  position: absolute;
  z-index: 2147483000;
  top: calc(100% + 0.375rem);
  left: 0;
  min-width: 100%;
  width: max-content;
  margin: 0;
  padding: 0.25rem;
  list-style: none;
  background: var(--w3l-surface-resolved);
  color: var(--w3l-fg-resolved);
  border: 1px solid var(--w3l-border-resolved);
  border-radius: var(--w3l-radius-resolved);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
}

.w3l-menu__item {
  font: inherit;
  font-size: 0.875rem;
  display: block;
  width: 100%;
  box-sizing: border-box;
  text-align: left;
  padding: 0.5rem 0.75rem;
  border: 0;
  border-radius: calc(var(--w3l-radius-resolved) - 2px);
  background: transparent;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.w3l-menu__item:hover,
.w3l-menu__item:focus-visible {
  background: color-mix(in srgb, var(--w3l-accent-resolved) 14%, transparent);
  outline: none;
}

.w3l-alert {
  margin-top: 0.5rem;
  max-width: 22rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  line-height: 1.4;
  color: var(--w3l-danger-resolved);
  background: color-mix(in srgb, var(--w3l-danger-resolved) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--w3l-danger-resolved) 35%, transparent);
  border-radius: var(--w3l-radius-resolved);
}
`;

/**
 * Inject the stylesheet once per document. Idempotent, so any number of
 * buttons on a page share one <style> element, and safe to call where there is
 * no DOM at all.
 */
export function injectStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = CSS;
  document.head.appendChild(style);
}
