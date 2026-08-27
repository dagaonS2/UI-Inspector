import fs from "node:fs";
import path from "node:path";

const WINDOWS_RESERVED_NAME = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

export function assertProjectName(name) {
  if (
    typeof name !== "string" ||
    !/^[\p{L}\p{N}][\p{L}\p{N}._-]{0,63}$/u.test(name) ||
    name === "." ||
    name === ".." ||
    WINDOWS_RESERVED_NAME.test(name)
  ) {
    throw new Error(
      "project_name must be 1-64 letters or numbers, optionally followed by letters, numbers, dot, underscore, or hyphen"
    );
  }
  return name;
}

function assertContained(baseDir, targetPath, label) {
  const base = path.resolve(baseDir);
  const target = path.resolve(targetPath);
  const relative = path.relative(base, target);
  if (
    relative === "" ||
    relative === ".." ||
    relative.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relative)
  ) {
    throw new Error(`${label}: ${targetPath}`);
  }
  return target;
}

function assertNoSymlinkTraversal(baseDir, targetPath) {
  const base = path.resolve(baseDir);
  const target = path.resolve(targetPath);
  const relative = path.relative(base, target);
  let cursor = base;
  for (const segment of relative.split(path.sep)) {
    cursor = path.join(cursor, segment);
    if (fs.existsSync(cursor) && fs.lstatSync(cursor).isSymbolicLink()) {
      throw new Error(`Symbolic-link traversal blocked: ${targetPath}`);
    }
  }
}

export function resolveInside(baseDir, relativePath) {
  if (
    typeof relativePath !== "string" ||
    relativePath.length === 0 ||
    relativePath.includes("\0") ||
    path.isAbsolute(relativePath) ||
    path.win32.isAbsolute(relativePath) ||
    relativePath.split(/[\\/]+/).includes("..")
  ) {
    throw new Error(`Unsafe relative path: ${relativePath}`);
  }

  const target = assertContained(baseDir, path.resolve(baseDir, relativePath), "Path escapes managed root");
  assertNoSymlinkTraversal(baseDir, target);
  return target;
}

export function assertSafeRemovalTarget(baseDir, targetPath) {
  const target = assertContained(baseDir, targetPath, "Removal target is outside managed root");
  if (!fs.existsSync(target)) return target;

  if (fs.lstatSync(target).isSymbolicLink()) {
    throw new Error(`Refusing to recursively remove a symbolic link: ${targetPath}`);
  }

  const realBase = fs.realpathSync.native(path.resolve(baseDir));
  const realTarget = fs.realpathSync.native(target);
  assertContained(realBase, realTarget, "Removal target resolves outside managed root");
  return target;
}
