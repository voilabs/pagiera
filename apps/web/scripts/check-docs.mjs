/**
 * The documentation check reads this app's content modules *and* the editor
 * package's native element inventory, so it can only run with the monorepo
 * checked out. Deploy images that copy `apps/web` on its own have neither the
 * root `scripts/` directory nor `packages/pagiera`, and the build was failing
 * on the missing module rather than on anything about the site.
 *
 * Local builds and CI still gate on the check; an isolated build context skips
 * it and says so.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const checker = resolve(here, "../../../scripts/check-docs.cjs");
const elementTypes = resolve(
  here,
  "../../../packages/pagiera/src/internal/lib/editor/types.ts",
);

if (!existsSync(checker) || !existsSync(elementTypes)) {
  console.log(
    "Skipping documentation check: the monorepo sources it inspects are not present in this build context.",
  );
  process.exit(0);
}

const result = spawnSync(process.execPath, [checker], { stdio: "inherit" });
process.exit(result.status ?? 1);
