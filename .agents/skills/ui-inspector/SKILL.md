---
name: ui-inspector
description: Use UI Inspector with the active web project when the user asks to run or open UI Inspector, inspect a selected UI element, or apply browser annotations to code.
---

# UI Inspector

Use the globally configured `ui_inspector` MCP tools. Do not reinstall UI Inspector inside each project.

## Start or connect

- When the user provides or already has a local development URL, call `preview_attach` for that URL.
- When the active project is not running, inspect its existing package scripts, start the appropriate development server in that project, wait for its local URL, and then call `preview_attach`.
- Use `preview_start` only for a new isolated React, Vue, or vanilla preview rather than an existing application.
- Return the inspector preview URL and briefly tell the user to use **Inspect** for one element or **Annotate** for multiple requested changes.

## Selected elements

- When the user refers to “this”, “here”, “the selected element”, “이 부분”, “여기”, or “선택한 요소”, call `inspector_get_selection` before editing.
- Use the returned source location to inspect and edit the real project file. Do not edit from the HTML snippet alone.
- After editing, run the smallest relevant project check and call `preview_errors`.

## Annotations

- When the user asks to apply pins, comments, notes, or annotations, call `annotation_list` first.
- Resolve an annotation with `annotation_resolve` only after its change is implemented and checked.
- Do not remove annotations unless the user explicitly asks to delete them.

## Availability

If the `ui_inspector` tools are unavailable, explain that Codex has not loaded the global MCP server yet and ask the user to restart Codex or start a new task. Do not claim that a separate Node.js installation is required until the configured server command has actually been checked.
