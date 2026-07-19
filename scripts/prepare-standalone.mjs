import { cp, mkdir, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();
const standaloneRoot = path.join(projectRoot, ".next", "standalone");

if (!existsSync(standaloneRoot)) {
  throw new Error(
    "Standalone output was not found. Ensure next.config.mjs uses output: 'standalone'.",
  );
}

async function replaceDirectory(source, destination) {
  if (!existsSync(source)) {
    return;
  }

  await rm(destination, { recursive: true, force: true });
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination, { recursive: true });
}

await replaceDirectory(
  path.join(projectRoot, ".next", "static"),
  path.join(standaloneRoot, ".next", "static"),
);
await replaceDirectory(
  path.join(projectRoot, "public"),
  path.join(standaloneRoot, "public"),
);

console.log("Standalone assets prepared: .next/static and public");
