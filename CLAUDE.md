# retroflightsim

## Code search and lint: ast-grep

- For searches that depend on code structure (calls, declarations, imports, syntax patterns), use
  `ast-grep run --lang ts -p '<pattern>' src/script` (or `--lang python` for `tools/*.py`).
  Use plain text search only for genuinely textual matches (strings, comments, log lines).
- Lint rules live in `ast-grep/rules/` (config: `sgconfig.yml`). Run them with `npm run lint:sg`
  and keep it at zero errors. When a bug class bites twice, add a rule for it.
