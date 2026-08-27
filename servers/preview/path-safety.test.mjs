import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { assertProjectName, assertSafeRemovalTarget, resolveInside } from "./path-safety.mjs";

const base = fs.mkdtempSync(path.join(os.tmpdir(), "ui-inspector-path-test-"));
const project = fs.mkdtempSync(path.join(base, "demo-"));

try {
  assert.equal(assertProjectName("demo-1.0"), "demo-1.0");
  assert.equal(assertProjectName("한국어-프로젝트"), "한국어-프로젝트");

  for (const badName of ["", ".", "..", "../outside", "..\\outside", "CON", "name with spaces"]) {
    assert.throws(() => assertProjectName(badName));
  }

  assert.equal(resolveInside(project, "src/App.tsx"), path.resolve(project, "src/App.tsx"));

  for (const badPath of ["", "../outside", "..\\outside", "/absolute", "C:\\absolute", "\\\\server\\share"]) {
    assert.throws(() => resolveInside(project, badPath));
  }

  assert.throws(() => resolveInside(project, `..${path.sep}demo-evil${path.sep}file.txt`));
  assert.equal(assertSafeRemovalTarget(base, project), path.resolve(project));

  console.log("Path safety tests passed");
} finally {
  fs.rmSync(base, { recursive: true, force: true });
}
