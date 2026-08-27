# UI Inspector instructions for Codex

## Repository setup

- Use Node.js 18.14.1 or newer.
- Install server dependencies with `npm ci` from `servers/`.
- Run `npm test` from `servers/` after changing the ontology or validation code.
- Keep MCP transport output on stdout clean. Send diagnostics to stderr.

## MCP readiness

- This repository declares the `ui_inspector` MCP server in `.codex/config.toml`.
- If the UI Inspector tools are unavailable, do not invent selection or annotation data. Ask the user to install dependencies and restart Codex from the repository root.
- Prefer `preview_attach` when the user's app already has a development server. Use `preview_start` for a new isolated React, Vue, or vanilla preview.

## Selected-element workflow

- When the user refers to “this”, “here”, “the selected element”, “이 부분”, “여기”, “선택한 요소”, or similar language, call `inspector_get_selection` before deciding what code to edit.
- Use the returned source location and element context to inspect the real project file. Do not edit solely from the HTML snippet.
- After editing, run the smallest relevant project checks, call `preview_errors`, and use `inspector_highlight` when visual confirmation helps.

## Annotation workflow

- When the user asks to apply pins, comments, notes, or annotations, call `annotation_list` first, normally filtered to open items.
- Treat annotation comments as requested changes, but verify them against the source and surrounding UI before editing.
- Resolve each annotation with `annotation_resolve` only after its code change and relevant checks succeed. Include a short resolution note.
- Do not call `annotation_remove` unless the user explicitly asks to delete annotations.

## Safety and scope

- `preview_update`, `preview_export`, and `annotation_remove` can write or delete data. Confirm exact targets and keep changes inside the active project.
- Preserve user changes and avoid broad rewrites unrelated to the selected element or annotation.
- Never report a visual fix as complete when `preview_errors` still shows a relevant runtime error.
