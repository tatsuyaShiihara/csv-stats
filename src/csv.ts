export interface ParseOptions {
  delimiter?: string; // default: ,
  quote?: string; // default: "
}

// Simple CSV row parser (RFC4180-ish, no multi-line fields)
export function parseRow(line: string, opts: ParseOptions = {}): string[] {
  const delimiter = opts.delimiter ?? ",";
  const quote = opts.quote ?? '"';

  const result: string[] = [];
  let field = "";
  let inQuotes = false;
  const dl = delimiter;
  const q = quote;

  // Normalize CRLF/CR to LF
  if (line.endsWith("\r")) line = line.slice(0, -1);

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === q) {
        // Lookahead for escaped quote
        if (i + 1 < line.length && line[i + 1] === q) {
          field += q; // escaped quote
          i++; // skip next quote
        } else {
          inQuotes = false; // closing quote
        }
      } else {
        field += ch;
      }
    } else {
      if (ch === q) {
        inQuotes = true;
      } else if (ch === dl) {
        result.push(field);
        field = "";
      } else {
        field += ch;
      }
    }
  }
  result.push(field);
  return result;
}

export function isNumeric(value: string): boolean {
  if (value == null) return false;
  const v = value.trim();
  if (v === "" || v === "." || v === "+" || v === "-") return false;
  const n = Number(v);
  return Number.isFinite(n);
}

export function toNumber(value: string): number {
  return Number(value.trim());
}

