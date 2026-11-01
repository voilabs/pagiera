import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Reproduce a deployment that receives apps/web as its entire source tree.
// Supply no parent scripts or package source. Full builds install their own
// dependencies, since Turbopack rejects junctions outside its project root.
const web = fileURLToPath(new URL("../apps/web/", import.meta.url));
const parent = fs.realpathSync(os.tmpdir());
const isolated = fs.mkdtempSync(path.join(parent, "pagiera-web-build-"));
const modules = path.join(isolated, "node_modules");
const fullBuild = process.argv.includes("--build");
try {
  for (const entry of fs.readdirSync(web, { withFileTypes: true })) {
    if (["node_modules", ".next", ".source", ".git"].includes(entry.name) || entry.name.endsWith(".tsbuildinfo")) continue;
    if (entry.name.startsWith(".env") && entry.name !== ".env.example") continue;
    fs.cpSync(path.join(web, entry.name), path.join(isolated, entry.name), { recursive: true });
  }
  if (fullBuild) {
    const install = spawnSync("bun", ["install", "--ignore-scripts"], { cwd: isolated, stdio: "inherit" });
    if (install.error) throw install.error;
    assert.equal(install.status, 0, "Isolated dependency installation failed");
  } else {
    fs.symlinkSync(path.join(web, "node_modules"), modules, process.platform === "win32" ? "junction" : "dir");
  }
  for (const script of ["check-docs.mjs", "check-i18n.cjs", "check-seo.mjs"]) {
    const result = spawnSync(process.execPath, [path.join("scripts", script)], { cwd: isolated, stdio: "inherit" });
    if (result.error) throw result.error;
    assert.equal(result.status, 0, `Isolated website check failed: ${script}`);
  }
  if (fullBuild) {
    const result = spawnSync("bun", ["run", "build"], { cwd: isolated, stdio: "inherit" });
    if (result.error) throw result.error;
    assert.equal(result.status, 0, "Isolated website production build failed");
  }
  console.log(`Isolated web context passed: app-local checks${process.argv.includes("--build") ? " and full production build" : ""}, without repository scripts or package source.`);
} finally {
  // Remove the dependency junction first; never recurse into shared dependencies.
  if (fs.existsSync(modules) && fs.lstatSync(modules).isSymbolicLink()) {
    fs.unlinkSync(modules);
  }
  const resolved = fs.realpathSync(isolated);
  assert.equal(path.dirname(resolved), parent, "Test cleanup must stay in its temporary parent");
  assert.ok(path.basename(resolved).startsWith("pagiera-web-build-"));
  fs.rmSync(resolved, { recursive: true, force: true });
}
