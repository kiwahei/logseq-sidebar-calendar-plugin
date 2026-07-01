// ─── Navigation & Page Handling ──────────────────────────────────────────────────
// Handles journal navigation, page existence checks, and the create-page flow.

import { state } from "../core/state";
import { formatDayPage } from "./date-format";

// ─── Simple navigators ──────────────────────────────────────────────────────────

export function navigateToJournal(date: Date): void {
  const pageName = formatDayPage(date);
  logseq.App.pushState("page", { name: pageName });
}

export function navigateToPage(pageName: string): void {
  logseq.App.pushState("page", { name: pageName });
}

// ─── Page click handler ─────────────────────────────────────────────────────────

/**
 * Handles clicking a page link (day, week, month, quarter, year).
 * Checks if the page exists, and either navigates, auto-creates, or shows
 * the confirmation dialog.
 *
 * @param renderFn - callback to trigger a re-render after state changes
 */
export async function handlePageClick(
  pageName: string,
  isJournal: boolean,
  renderFn: () => void,
  date?: Date,
  tag?: string,
): Promise<void> {
  try {
    const page = await logseq.Editor.getPage(pageName);
    if (page && !page["recycled?"]) {
      if (isJournal && date) {
        navigateToJournal(date);
      } else {
        navigateToPage(pageName);
      }
    } else {
      const autoCreate = !!logseq.settings?.autoCreatePage;
      if (autoCreate) {
        try {
          const targetPageName = tag ? `${pageName} ${tag}` : pageName;
          await logseq.Editor.createPage(targetPageName, {}, { redirect: true, journal: isJournal });
        } catch (err) {
          console.error("[logseq-sidebar-calendar-plugin] failed to auto-create page:", err);
          if (isJournal && date) {
            navigateToJournal(date);
          } else {
            navigateToPage(pageName);
          }
        }
        renderFn(); // Re-render to update the calendar UI dots
      } else {
        state.confirmCreatePageData = { pageName, isJournal, date, tag };
        renderFn();
      }
    }
  } catch (err) {
    console.error(`[logseq-sidebar-calendar-plugin] failed to check page existence for ${pageName}:`, err);
    if (isJournal && date) {
      navigateToJournal(date);
    } else {
      navigateToPage(pageName);
    }
  }
}
