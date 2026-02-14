import fs from "node:fs";
import path from "node:path";

const nextDir = path.join(process.cwd(), ".next");

for (const d of ["dev", "cache"]) {
  try {
    fs.rmSync(path.join(nextDir, d), { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
}
