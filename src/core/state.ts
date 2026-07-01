// ─── Application State ──────────────────────────────────────────────────────────
// Centralized mutable state for the calendar widget.
// Using a plain exported object for simplicity in this small plugin.

export interface ConfirmCreatePageData {
  pageName: string;
  isJournal: boolean;
  date?: Date;
  tag?: string;
}

export const state = {
  viewYear: 0,
  viewMonth: 0,
  preferredDateFormat: "yyyy-MM-dd",
  activeThemeMode: "light",
  globalLogseqConfigStartOfWeek: 6, // Sunday default (Logseq format: 0=Mon, 6=Sun)
  activePageName: null as string | null,
  confirmCreatePageData: null as ConfirmCreatePageData | null,
};

/** Reset viewYear/viewMonth to the current date. */
export function initToToday(): void {
  const now = new Date();
  state.viewYear = now.getFullYear();
  state.viewMonth = now.getMonth();
}

/** Fetch the currently active page name from Logseq and store it. */
export async function updateActivePage(): Promise<void> {
  try {
    const page = await logseq.Editor.getCurrentPage();
    if (page) {
      state.activePageName = page.name.toLowerCase();
    } else {
      state.activePageName = null;
    }
  } catch (e) {
    state.activePageName = null;
  }
}

const dayMap: Record<string, number> = {
  "monday": 0,
  "tuesday": 1,
  "wednesday": 2,
  "thursday": 3,
  "friday": 4,
  "saturday": 5,
  "sunday": 6,
  "0": 0,
  "1": 1,
  "2": 2,
  "3": 3,
  "4": 4,
  "5": 5,
  "6": 6,
};

/**
 * Compute the JS day-of-week (0=Sun, 6=Sat) for the start of the week,
 * respecting the plugin setting override and Logseq's global config.
 */
export function getStartOfWeekDayJS(): number {
  let logseqStartOfWeek = 6; // Default to Sunday (6)
  if (state.globalLogseqConfigStartOfWeek !== undefined) {
    logseqStartOfWeek = state.globalLogseqConfigStartOfWeek;
  }

  const settingVal = logseq.settings?.startOfWeek;
  let startOfWeek = logseqStartOfWeek;
  if (settingVal !== undefined && settingVal !== null && settingVal !== "") {
    const valStr = String(settingVal).toLowerCase();
    if (dayMap[valStr] !== undefined) {
      startOfWeek = dayMap[valStr];
    } else {
      const parsed = parseInt(valStr, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 6) {
        startOfWeek = parsed;
      }
    }
  }

  // Map Logseq day format (0 = Monday, ..., 6 = Sunday) to JS day format (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  return (startOfWeek + 1) % 7;
}
