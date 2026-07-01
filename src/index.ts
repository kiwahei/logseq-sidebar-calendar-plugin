// ─── Plugin Entrypoint ──────────────────────────────────────────────────────────
// Slim wiring layer: connects Logseq lifecycle, event handlers, and modules.

import "@logseq/libs";
import { settings, state, initToToday, updateActivePage, applyThemeMode } from "./core";
import { render, handlePageClick, navigateToJournal, navigateToPage, formatDayPage, formatWithPattern } from "./calendar";

interface LogseqClickEvent {
  dataset: Record<string, string>;
}

async function main(): Promise<void> {
  initToToday();

  // Load and inject the stylesheet from the iframe context into the parent document
  try {
    const cssLink = document.querySelector('link[rel="stylesheet"]') as HTMLLinkElement | null;
    if (cssLink) {
      const cssUrl = cssLink.href;
      const cssContent = await fetch(cssUrl).then((r) => r.text());
      logseq.provideStyle(cssContent);
    }
  } catch (e) {
    console.error("[logseq-sidebar-calendar-plugin] failed to load/inject styles:", e);
  }

  // Register interactive event handlers via provideModel
  logseq.provideModel({
    prevMonth() {
      state.confirmCreatePageData = null;
      state.viewMonth--;
      if (state.viewMonth < 0) {
        state.viewMonth = 11;
        state.viewYear--;
      }
      render();
    },
    nextMonth() {
      state.confirmCreatePageData = null;
      state.viewMonth++;
      if (state.viewMonth > 11) {
        state.viewMonth = 0;
        state.viewYear++;
      }
      render();
    },
    goToToday() {
      state.confirmCreatePageData = null;
      initToToday();
      render();
    },
    async clickDay(e: LogseqClickEvent) {
      const dateStr = e.dataset.calTime;
      if (dateStr) {
        const date = new Date(Number(dateStr));
        const pageName = formatDayPage(date);
        const expectedJournalName = formatWithPattern(date, state.preferredDateFormat);
        const isJournal = pageName.toLowerCase() === expectedJournalName.toLowerCase();
        const tag = logseq.settings?.dayTags as string;
        await handlePageClick(pageName, isJournal, render, date, tag);
      }
    },
    cancelCreatePage() {
      state.confirmCreatePageData = null;
      render();
    },
    async confirmCreatePage() {
      if (state.confirmCreatePageData) {
        const { pageName, isJournal, date, tag } = state.confirmCreatePageData;
        state.confirmCreatePageData = null;
        try {
          const targetPageName = tag ? `${pageName} ${tag}` : pageName;
          await logseq.Editor.createPage(targetPageName, {}, { redirect: true, journal: isJournal });
        } catch (err) {
          console.error("[logseq-sidebar-calendar-plugin] failed to create page:", err);
          if (isJournal && date) {
            navigateToJournal(date);
          } else {
            navigateToPage(pageName);
          }
        }
        render();
      }
    },
    async clickWeek(e: LogseqClickEvent) {
      const label = e.dataset.calLabel;
      if (label) {
        const tag = logseq.settings?.weekTags as string;
        await handlePageClick(label, false, render, undefined, tag);
      }
    },
    async clickMonth(e: LogseqClickEvent) {
      const label = e.dataset.calLabel;
      if (label) {
        const tag = logseq.settings?.monthTags as string;
        await handlePageClick(label, false, render, undefined, tag);
      }
    },
    async clickQuarter(e: LogseqClickEvent) {
      const label = e.dataset.calLabel;
      if (label) {
        const tag = logseq.settings?.quarterTags as string;
        await handlePageClick(label, false, render, undefined, tag);
      }
    },
    async clickYear(e: LogseqClickEvent) {
      const label = e.dataset.calLabel;
      if (label) {
        const tag = logseq.settings?.yearTags as string;
        await handlePageClick(label, false, render, undefined, tag);
      }
    },
  });

  // Listen for theme mode changes
  logseq.App.onThemeModeChanged(({ mode }) => {
    applyThemeMode(mode, render);
  });

  // Listen for setting changes to update formatting immediately
  logseq.onSettingsChanged(() => {
    render();
  });

  // Listen for route changes to update the active page highlight
  logseq.App.onRouteChanged(async () => {
    await updateActivePage();
    render();
  });

  // Load user/graph configs
  try {
    const configs = await logseq.App.getUserConfigs();
    if (configs) {
      if (configs.preferredDateFormat) {
        state.preferredDateFormat = configs.preferredDateFormat;
      }
      if (configs.preferredThemeMode) {
        applyThemeMode(configs.preferredThemeMode, render);
      }
      if (configs.preferredStartOfWeek !== undefined) {
        const parsed = parseInt(String(configs.preferredStartOfWeek), 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 6) {
          state.globalLogseqConfigStartOfWeek = parsed;
        }
      }
    }

    // Try to query start-of-week directly from current graph configurations
    try {
      const graphConfigs = await logseq.App.getCurrentGraphConfigs();
      if (graphConfigs) {
        const rawStartOfWeek = graphConfigs["start-of-week"] !== undefined
          ? graphConfigs["start-of-week"]
          : graphConfigs[":start-of-week"];
        if (rawStartOfWeek !== undefined && rawStartOfWeek !== null) {
          const parsed = parseInt(String(rawStartOfWeek), 10);
          if (!isNaN(parsed) && parsed >= 0 && parsed <= 6) {
            state.globalLogseqConfigStartOfWeek = parsed;
          }
        }
      }
    } catch (graphErr) {
      console.warn("[logseq-sidebar-calendar-plugin] could not read getCurrentGraphConfigs:", graphErr);
    }
  } catch (e) {
    console.warn("[logseq-sidebar-calendar-plugin] could not read user configs, using fallback:", state.preferredDateFormat, e);
  }

  // Hide the floating main UI
  logseq.hideMainUI();

  // Fetch the initial active page name and render
  await updateActivePage();
  render();

  // Run a slow fallback interval loop (every 3 seconds) to ensure persistence
  // if Logseq re-renders the sidebar and unmounts the provideUI widget.
  // We skip re-rendering if the confirm dialog is open to prevent blinking.
  setInterval(() => {
    if (!state.confirmCreatePageData) {
      render();
    }
  }, 3000);
}

logseq.useSettingsSchema(settings).ready(main).catch(console.error);
