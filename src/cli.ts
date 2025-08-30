#!/usr/bin/env node
import fs from 'node:fs';
import readline from 'node:readline';
import { parseRow, isNumeric, toNumber } from './csv.js';

interface CliOptions {
  file?: string;
  column?: string; // name or index (0-based)
  delimiter?: string; // default ,
  header?: boolean; // has header row
  strict?: boolean; // error on non-numeric
  precision?: number; // digits after decimal
}

function printHelp() {
  const help = `csv-stats - Compute average and max for a CSV column

Usage:
  csv-stats <file> -c <column> [options]

Arguments:
  <file>                 Path to CSV file

Options:
  -c, --column <value>   Column name (if --header) or 0-based index
  -d, --delimiter <ch>   Field delimiter (default: ,)
      --header           First row is header; enables name lookup
      --strict           Fail on non-numeric values (otherwise skip)
  -p, --precision <n>    Decimal places for output (default: 4)
  -h, --help             Show this help

Examples:
  csv-stats data.csv -c price --header
  csv-stats data.csv -c 2 -d ';'
`;
  process.stdout.write(help);
}

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = { delimiter: ',', header: false, strict: false, precision: 4 };
  const args = [...argv];

  // Grab first non-flag as file
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('-')) {
      opts.file = a;
      args.splice(i, 1);
      break;
    }
  }

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    switch (a) {
      case '-h':
      case '--help':
        printHelp();
        process.exit(0);
      case '-c':
      case '--column':
        opts.column = args[++i];
        break;
      case '-d':
      case '--delimiter':
        opts.delimiter = args[++i];
        break;
      case '--header':
        opts.header = true;
        break;
      case '--strict':
        opts.strict = true;
        break;
      case '-p':
      case '--precision':
        opts.precision = Number(args[++i]);
        break;
      default:
        throw new Error(`Unknown option: ${a}`);
    }
  }

  return opts;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (!opts.file) {
    process.stderr.write('Error: missing <file>\n\n');
    printHelp();
    process.exit(1);
  }
  if (!opts.column && opts.column !== '0') {
    process.stderr.write('Error: missing --column\n');
    process.exit(1);
  }
  if (!fs.existsSync(opts.file)) {
    process.stderr.write(`Error: file not found: ${opts.file}\n`);
    process.exit(1);
  }
  if ((opts.delimiter ?? ',').length !== 1) {
    process.stderr.write('Error: --delimiter must be a single character\n');
    process.exit(1);
  }

  const delimiter = opts.delimiter ?? ',';
  const precision = Number.isFinite(opts.precision) ? Math.max(0, (opts.precision as number) | 0) : 4;

  const rl = readline.createInterface({
    input: fs.createReadStream(opts.file, { encoding: 'utf8' }),
    crlfDelay: Infinity,
  });

  let lineNo = 0;
  let headers: string[] | null = null;
  let colIndex: number | null = null;
  const colArg = opts.column as string;

  let count = 0;
  let sum = 0;
  let max = -Infinity;

  for await (const line of rl) {
    lineNo++;
    if (lineNo === 1 && opts.header) {
      headers = parseRow(line, { delimiter });
      if (/^\d+$/.test(colArg)) {
        colIndex = Number(colArg);
      } else {
        colIndex = headers.indexOf(colArg);
        if (colIndex === -1) {
          process.stderr.write(`Error: column name not found in header: ${colArg}\n`);
          process.exit(1);
        }
      }
      continue;
    }

    const fields = parseRow(line, { delimiter });
    if (colIndex == null) {
      if (/^\d+$/.test(colArg)) {
        colIndex = Number(colArg);
      } else {
        // No header; cannot resolve name
        process.stderr.write('Error: --header required when using a column name\n');
        process.exit(1);
      }
    }

    if (colIndex < 0 || colIndex >= fields.length) {
      // out of range; treat as missing
      if (opts.strict) {
        process.stderr.write(`Error: line ${lineNo} has no column index ${colIndex}\n`);
        process.exit(1);
      }
      continue;
    }

    const v = fields[colIndex];
    if (!isNumeric(v)) {
      if (opts.strict) {
        process.stderr.write(`Error: non-numeric value at line ${lineNo}: '${v}'\n`);
        process.exit(1);
      }
      continue;
    }

    const num = toNumber(v);
    sum += num;
    count += 1;
    if (num > max) max = num;
  }

  if (count === 0) {
    process.stdout.write('No numeric values found for the selected column.\n');
    process.exit(0);
  }

  const avg = sum / count;
  const fmt = (n: number) => n.toFixed(precision);
  const label = headers && colIndex != null ? (headers[colIndex] ?? String(colIndex)) : String(colIndex);

  process.stdout.write(`Column: ${label}\n`);
  process.stdout.write(`Count: ${count}\n`);
  process.stdout.write(`Average: ${fmt(avg)}\n`);
  process.stdout.write(`Max: ${fmt(max)}\n`);
}

main().catch((err) => {
  process.stderr.write((err && err.stack) ? String(err.stack) : String(err));
  process.exit(1);
});

