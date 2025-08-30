# csv-stats

Simple TypeScript CLI that reads a CSV file and prints the average and maximum of a specified column.

Features:

- Select column by name (with `--header`) or 0-based index
- Configurable delimiter (default `,`)
- Skips non-numeric values by default; `--strict` to fail on them

Usage

```
csv-stats <file> -c <column> [options]

Options:
  -c, --column <value>   Column name (if --header) or 0-based index
  -d, --delimiter <ch>   Field delimiter (default: ,)
      --header           First row is header; enables name lookup
      --strict           Fail on non-numeric values (otherwise skip)
  -p, --precision <n>    Decimal places for output (default: 4)
  -h, --help             Show help

Examples:
  csv-stats data.csv -c price --header
  csv-stats data.csv -c 2 -d ';'
```

Development

1. Install deps (Node 18+):
   - `npm install`
2. Build:
   - `npm run build`
3. Run:
   - `node dist/cli.js <args>`

During development, you can run with ts-node:

```
npm run dev -- <args>
```

Examples

- Sample CSVs are in `examples/`.
- Quick demos:
  - `npm run demo` — uses `examples/sample.csv` with `--header` and column name `price`
  - `npm run demo:index` — same file selecting column by index `1`
  - `npm run demo:sc` — semicolon-delimited file `examples/sample_semicolon.csv`
- Validate output matches expectations:
  - `npm run check`

Notes

- The CSV parser supports quoted fields and escaped quotes (e.g. `""` inside quotes), but does not support multi-line fields in this minimal scaffold.
- If you need multi-line field support or more CSV features, consider swapping to a library like `csv-parse` later.
