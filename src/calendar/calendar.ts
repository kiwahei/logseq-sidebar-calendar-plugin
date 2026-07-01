// ─── Calendar Grid & Rendering ──────────────────────────────────────────────────
// Pure grid computation, Logseq DB queries, and decomposed HTML rendering.

import { MONTH_NAMES, DAY_NAMES_SHORT_HEADERS } from "../core/constants";
import { state, getStartOfWeekDayJS } from "../core/state";
import {
  getISOWeek,
  formatDay,
  formatDayPage,
  formatMonth,
  formatWeek,
  formatQuarter,
  formatYear,
} from "./date-format";

// ─── Helpers ────────────────────────────────────────────────────────────────────

export function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

export function getCalendarGrid(year: number, month: number): Date[][] {
  const firstDay = new Date(year, month, 1);
  const weekStartJS = getStartOfWeekDayJS();
  const offset = (firstDay.getDay() - weekStartJS + 7) % 7;
  const gridStart = new Date(year, month, 1 - offset);

  const rows: Date[][] = [];
  let cursor = new Date(gridStart);

  for (let r = 0; r < 6; r++) {
    const row: Date[] = [];
    for (let c = 0; c < 7; c++) {
      row.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push(row);
  }
  return rows;
}

// ─── Logseq DB query ────────────────────────────────────────────────────────────

async function getExistingPages(pageNames: string[]): Promise<Set<string>> {
  try {
    const query = `
      [:find ?name
       :in $ [?name ...]
       :where
       [?p :block/name ?name]
       (not [?p :block/recycled? true])
       (not [?p :logseq.property/deleted-at _])]
    `;
    const lowerNames = pageNames.map(name => name.toLowerCase());
    const results = (await logseq.DB.datascriptQuery(query, lowerNames)) as any[][];
    if (results && Array.isArray(results)) {
      const resultSet = new Set(results.map(r => r[0]));
      return resultSet;
    }
  } catch (e) {
    console.error("[logseq-sidebar-calendar-plugin] datascriptQuery failed:", e);
  }
  return new Set();
}

// ─── HTML Builders (decomposed from render) ─────────────────────────────────────

function getHeaderHtml(): string {
  const weekStartJS = getStartOfWeekDayJS();
  const rearranged = [
    ...DAY_NAMES_SHORT_HEADERS.slice(weekStartJS),
    ...DAY_NAMES_SHORT_HEADERS.slice(0, weekStartJS)
  ];
  return rearranged.map(name => `<th>${name}</th>`).join("");
}

function buildTableBody(
  rows: Date[][],
  existingPages: Set<string>,
  activePageName: string | null,
  viewMonth: number,
): string {
  let tbodyContent = "";

  for (const week of rows) {
    tbodyContent += "<tr>";

    const thursday = new Date(week[0]);
    thursday.setDate(thursday.getDate() + 4);
    const weekNum = getISOWeek(thursday);
    const weekLabel = formatWeek(thursday);

    const hasWeekPage = existingPages.has(weekLabel.toLowerCase());
    let weekClasses = `week-cell clickable${hasWeekPage ? " has-page" : ""}`;
    if (activePageName && weekLabel.toLowerCase() === activePageName) {
      weekClasses += " active-page";
    }

    tbodyContent += `<td><span class="${weekClasses}" data-on-click="clickWeek" data-cal-label="${weekLabel}">${weekNum}</span></td>`;

    for (const day of week) {
      let classes = "day-cell";
      if (day.getMonth() !== viewMonth) classes += " other-month";
      if (isToday(day)) classes += " today";

      const pageName = formatDayPage(day);
      if (existingPages.has(pageName.toLowerCase())) {
        classes += " has-page";
      }
      if (activePageName && pageName.toLowerCase() === activePageName) {
        classes += " active-page";
      }

      const timeVal = day.getTime();
      const titleVal = formatDay(day);

      tbodyContent += `<td><span class="${classes}" title="${titleVal}" data-on-click="clickDay" data-cal-time="${timeVal}">${day.getDate()}</span></td>`;
    }

    tbodyContent += "</tr>";
  }

  return tbodyContent;
}

function buildConfirmOverlay(): string {
  const data = state.confirmCreatePageData;
  if (!data) return "";

  return `
    <div class="confirm-dialog-overlay">
      <div class="confirm-dialog">
        <div class="confirm-title">Create Page?</div>
        <div class="confirm-desc">Create ${data.isJournal ? "journal page" : "page"} for <strong>${data.pageName}</strong>?</div>
        <div class="confirm-actions">
          <button class="confirm-btn btn-cancel" data-on-click="cancelCreatePage">Cancel</button>
          <button class="confirm-btn btn-create" data-on-click="confirmCreatePage">Create</button>
        </div>
      </div>
    </div>
  `;
}

function buildHeader(
  viewDate: Date,
  monthLabel: string,
  quarterLabel: string,
  yearLabel: string,
  existingPages: Set<string>,
  activePageName: string | null,
): string {
  const hasMonthPage = existingPages.has(monthLabel.toLowerCase());
  const hasQuarterPage = existingPages.has(quarterLabel.toLowerCase());
  const hasYearPage = existingPages.has(yearLabel.toLowerCase());

  const monthClass = `clickable${hasMonthPage ? " has-page" : ""}${activePageName && monthLabel.toLowerCase() === activePageName ? " active-page" : ""}`;
  const quarterClass = `clickable${hasQuarterPage ? " has-page" : ""}${activePageName && quarterLabel.toLowerCase() === activePageName ? " active-page" : ""}`;
  const yearClass = `clickable${hasYearPage ? " has-page" : ""}${activePageName && yearLabel.toLowerCase() === activePageName ? " active-page" : ""}`;
  const quarterShort = `Q${Math.floor(viewDate.getMonth() / 3) + 1}`;

  return `
    <div class="panel-header" style="display: flex; flex-direction: column; width: 100%; gap: 8px; margin-bottom: 8px;">
      <div style="display: flex; gap: 4px; font-size: 12px; font-weight: 700; color: var(--cal-text); align-self: center;">
        <span class="${yearClass}" data-on-click="clickYear" data-cal-label="${yearLabel}">${yearLabel}</span>
        <span class="${quarterClass}" data-on-click="clickQuarter" data-cal-label="${quarterLabel}" style="font-size: 11px; font-weight: 600; color: var(--cal-secondary-text);">(${quarterShort})</span>
      </div>
      <div style="display: flex; flex-direction: row; justify-content: space-between; align-items: center; width: 100%; gap: 8px;">
        <div class="header-left" style="display: flex; align-items: center; gap: 4px; font-size: 12px; font-weight: 700; color: var(--cal-text);">
          <span class="${monthClass}" data-on-click="clickMonth" data-cal-label="${monthLabel}">${MONTH_NAMES[viewDate.getMonth()]}</span>
        </div>
        <div class="header-right" style="display: flex; align-items: center; gap: 8px;">
          <span class="clickable" data-on-click="prevMonth" title="Previous Month" style="font-size: 11px; font-weight: 600; padding: 2px 4px; display: flex; align-items: center; justify-content: center; color: var(--cal-secondary-text);">&lt;</span>
          <span class="clickable" data-on-click="goToToday" style="font-size: 11px; font-weight: 600; padding: 2px 6px; color: var(--cal-secondary-text);">Today</span>
          <span class="clickable" data-on-click="nextMonth" title="Next Month" style="font-size: 11px; font-weight: 600; padding: 2px 4px; display: flex; align-items: center; justify-content: center; color: var(--cal-secondary-text);">&gt;</span>
        </div>
      </div>
    </div>
  `;
}

// ─── Main Render ────────────────────────────────────────────────────────────────

let renderCount = 0;

export async function render(): Promise<void> {
  renderCount++;
  const currentRenderId = renderCount;

  const viewDate = new Date(state.viewYear, state.viewMonth, 1);
  const rows = getCalendarGrid(state.viewYear, state.viewMonth);

  // Collect all page names for batch existence check
  const allDates: Date[] = [];
  for (const week of rows) {
    for (const day of week) {
      allDates.push(day);
    }
  }

  const dayPageNames = allDates.map(d => formatDayPage(d));
  const monthLabel = formatMonth(viewDate);
  const quarterLabel = formatQuarter(viewDate);
  const yearLabel = formatYear(viewDate);

  const weekPageNames = rows.map(week => {
    const thursday = new Date(week[0]);
    thursday.setDate(thursday.getDate() + 4);
    return formatWeek(thursday);
  });

  const queryPageNames = [...dayPageNames, ...weekPageNames, monthLabel, quarterLabel, yearLabel];
  const showExistIndicator = logseq.settings?.showExistIndicator !== false;
  const existingPages = showExistIndicator ? await getExistingPages(queryPageNames) : new Set<string>();

  // Guard against stale renders
  if (currentRenderId !== renderCount) {
    return;
  }

  // Assemble the template from decomposed builders
  const template = `
    <div id="logseq-calendar-panel" class="${state.activeThemeMode}">
      ${buildConfirmOverlay()}
      ${buildHeader(viewDate, monthLabel, quarterLabel, yearLabel, existingPages, state.activePageName)}

      <table id="logseq-calendar-grid">
        <thead>
          <tr>
            <th class="wk-col">Wk</th>
            ${getHeaderHtml()}
          </tr>
        </thead>
        <tbody id="logseq-calendar-body">
          ${buildTableBody(rows, existingPages, state.activePageName, state.viewMonth)}
        </tbody>
      </table>
    </div>
  `;

  logseq.provideUI({
    key: "logseq-calendar-panel-container",
    path: "#left-sidebar .wrap",
    template: template,
  });
}
