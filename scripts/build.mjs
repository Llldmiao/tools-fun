import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { siteContent } from "../content/site-content.mjs";
import { renderSite } from "../src/render.mjs";
import { validateSiteContent } from "../src/validate.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const distDir = join(root, "dist");

await rm(distDir, { recursive: true, force: true });
await mkdir(distDir, { recursive: true });

validateSiteContent(siteContent);
const pages = renderSite(siteContent);

for (const [pathname, html] of Object.entries(pages)) {
  const fullPath = join(distDir, pathname);
  await mkdir(dirname(fullPath), { recursive: true });
  await writeFile(fullPath, html, "utf8");
}

const [css, js] = await Promise.all([
  readFile(join(root, "src", "site.css"), "utf8"),
  readFile(join(root, "src", "site.js"), "utf8")
]);

const favicon = await readFile(join(root, "src", "favicon.svg"), "utf8");

await Promise.all([
  writeFile(join(distDir, "site.css"), css, "utf8"),
  writeFile(join(distDir, "site.js"), js, "utf8"),
  writeFile(join(distDir, "favicon.svg"), favicon, "utf8")
]);

console.log(`Built ${Object.keys(pages).length} pages into ${distDir}`);
