import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertProjectName, assertSafeRemovalTarget, resolveInside } from "./path-safety.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_DIR = path.join(os.tmpdir(), "ui-inspector-preview");
const FRAMEWORKS = new Set(["react", "vue", "vanilla"]);

function npmInvocation() {
  if (process.platform !== "win32") {
    return { command: "npm", args: ["install", "--no-audit", "--no-fund"] };
  }

  const npmCli = process.env.npm_execpath || path.join(
    path.dirname(process.execPath),
    "node_modules",
    "npm",
    "bin",
    "npm-cli.js"
  );
  if (!fs.existsSync(npmCli)) {
    throw new Error("npm CLI not found. Install Node.js with npm and restart Codex.");
  }
  const packageManagerArgs = /pnpm(?:\.c?m?js)?$/i.test(path.basename(npmCli))
    ? ["install", "--lockfile=false", "--ignore-scripts"]
    : ["install", "--no-audit", "--no-fund"];
  return {
    command: process.execPath,
    args: [npmCli, ...packageManagerArgs],
  };
}

export class ProjectScaffold {
  async create(projectName, framework = "react", initialCode = {}, designTokens = null) {
    const safeName = assertProjectName(projectName);
    if (!FRAMEWORKS.has(framework)) {
      throw new Error(`Unknown framework: ${framework}`);
    }

    fs.mkdirSync(BASE_DIR, { recursive: true });
    const projectDir = fs.mkdtempSync(path.join(BASE_DIR, `${safeName}-`));
    const templateDir = path.join(__dirname, "templates", framework);

    if (!fs.existsSync(templateDir)) {
      throw new Error(`Unknown framework: ${framework}. Template not found at ${templateDir}`);
    }

    // 1. Copy template recursively
    await this.copyTemplate(templateDir, projectDir);

    // 2. Inject initial code files
    if (initialCode && Object.keys(initialCode).length > 0) {
      await this.injectFiles(projectDir, initialCode);
    }

    // 3. Inject design tokens into index.css if provided
    if (designTokens) {
      await this.injectDesignTokens(projectDir, designTokens);
    }

    // 4. npm install (invoke npm's JS CLI through Node on Windows)
    try {
      const { command, args } = npmInvocation();
      execFileSync(command, args, {
        cwd: projectDir,
        timeout: 300000,
        stdio: "pipe",
      });
    } catch (err) {
      try { await this.cleanup(projectDir); } catch (_) {}
      throw new Error(
        `Dependency installation failed: ${err.stderr?.toString() || err.stdout?.toString() || err.message}`
      );
    }

    // 5. Return result
    const fileTree = await this.buildFileTree(projectDir);
    return { projectDir, fileTree };
  }

  async copyTemplate(templateDir, destDir) {
    const SKIP = new Set(["node_modules", ".git", "package-lock.json"]);
    const entries = fs.readdirSync(templateDir, { withFileTypes: true });
    for (const entry of entries) {
      if (SKIP.has(entry.name)) continue;
      const srcPath = path.join(templateDir, entry.name);
      const destPath = path.join(destDir, entry.name);
      if (entry.isDirectory()) {
        fs.mkdirSync(destPath, { recursive: true });
        await this.copyTemplate(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  async injectFiles(projectDir, fileMap) {
    for (const [relPath, content] of Object.entries(fileMap)) {
      const resolved = resolveInside(projectDir, relPath);
      fs.mkdirSync(path.dirname(resolved), { recursive: true });
      fs.writeFileSync(resolved, content, "utf8");
    }
  }

  async injectDesignTokens(projectDir, designTokens) {
    const cssPath = path.join(projectDir, "src", "index.css");
    const tokenCss = this._designTokensToCss(designTokens);
    if (fs.existsSync(cssPath)) {
      const existing = fs.readFileSync(cssPath, "utf8");
      fs.writeFileSync(cssPath, tokenCss + "\n" + existing, "utf8");
    } else {
      fs.mkdirSync(path.dirname(cssPath), { recursive: true });
      fs.writeFileSync(cssPath, tokenCss, "utf8");
    }
  }

  _designTokensToCss(tokens) {
    const vars = Object.entries(tokens)
      .map(([key, value]) => {
        // Convert camelCase to kebab-case for CSS custom property names
        const cssVar = `--${key.replace(/([A-Z])/g, "-$1").toLowerCase()}`;
        return `  ${cssVar}: ${value};`;
      })
      .join("\n");
    return `:root {\n${vars}\n}`;
  }

  async buildFileTree(dir, _prefix = "") {
    const result = {};
    if (!fs.existsSync(dir)) return result;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git") continue;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        result[entry.name] = await this.buildFileTree(fullPath);
      } else {
        const stat = fs.statSync(fullPath);
        result[entry.name] = stat.size;
      }
    }
    return result;
  }

  async cleanup(projectDir) {
    const safeTarget = assertSafeRemovalTarget(BASE_DIR, projectDir);
    if (fs.existsSync(safeTarget)) {
      fs.rmSync(safeTarget, { recursive: true, force: true });
    }
  }
}
