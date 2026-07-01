// ─── Date Formatting Engine ─────────────────────────────────────────────────────
// date-fns based date formatter and plugin-specific format helpers.

import { format as dateFnsFormat, getISOWeek } from "date-fns";
import { state } from "../core/state";

export { getISOWeek };

// Map custom/Logseq token patterns to date-fns counterparts
const TOKEN_MAP: Record<string, string> = {
  yyyy: "yyyy",
  YYYY: "yyyy",
  yy: "yy",
  YY: "yy",
  MMMM: "MMMM",
  MMM: "MMM",
  MM: "MM",
  M: "M",
  do: "do",
  dd: "dd",
  d: "d",
  EEEE: "EEEE",
  EEE: "EEE",
  E: "EEE",
  GGGG: "RRRR",
  GG: "RR",
  ww: "II",
  w: "I",
  QQ: "QQQ",
  Q: "Q",
};

const TOKENS = Object.keys(TOKEN_MAP).sort((a, b) => b.length - a.length);

export function formatWithPattern(date: Date, pattern: string): string {
  let result = "";
  let i = 0;
  let inLiteral = false;
  let literalBuffer = "";

  const flushLiteral = () => {
    if (literalBuffer) {
      result += literalBuffer;
      literalBuffer = "";
    }
  };

  while (i < pattern.length) {
    const char = pattern[i];

    if (char === "'") {
      flushLiteral();
      inLiteral = !inLiteral;
      i++;
      continue;
    }

    if (inLiteral) {
      result += char;
      i++;
      continue;
    }

    let matchedToken = "";
    for (const token of TOKENS) {
      if (pattern.startsWith(token, i)) {
        matchedToken = token;
        break;
      }
    }

    if (matchedToken) {
      flushLiteral();
      result += dateFnsFormat(date, TOKEN_MAP[matchedToken]);
      i += matchedToken.length;
    } else {
      literalBuffer += char;
      i++;
    }
  }

  flushLiteral();
  return result;
}

// ─── Plugin-specific formatters ─────────────────────────────────────────────────

export function formatDay(date: Date): string {
  const pattern = (logseq.settings?.dayFormat as string) || "MMM do, yyyy";
  return formatWithPattern(date, pattern);
}

export function formatDayPage(date: Date): string {
  return formatWithPattern(date, state.preferredDateFormat);
}

export function formatMonth(date: Date): string {
  const pattern = (logseq.settings?.monthFormat as string) || "MMMM yyyy";
  return formatWithPattern(date, pattern);
}

export function formatWeek(date: Date): string {
  const pattern = (logseq.settings?.weekFormat as string) || "Www, GGGG";
  return formatWithPattern(date, pattern);
}

export function formatQuarter(date: Date): string {
  const pattern = (logseq.settings?.quarterFormat as string) || "QQ, yyyy";
  return formatWithPattern(date, pattern);
}

export function formatYear(date: Date): string {
  const pattern = (logseq.settings?.yearFormat as string) || "yyyy";
  return formatWithPattern(date, pattern);
}

