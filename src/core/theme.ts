// ─── Theme Handling ─────────────────────────────────────────────────────────────
// Applies theme mode (light/dark) to both local state and the iframe DOM.

import { state } from "./state";

/**
 * Apply the given theme mode to the iframe document root and trigger a re-render.
 * The render callback is provided to avoid a circular import with calendar.ts.
 */
export function applyThemeMode(mode: string, renderFn: () => void): void {
  state.activeThemeMode = mode;

  // Apply theme class locally to iframe document root
  const html = document.documentElement;
  if (mode === "dark") {
    html.classList.remove("light");
    html.classList.add("dark");
  } else {
    html.classList.remove("dark");
    html.classList.add("light");
  }

  renderFn();
}
