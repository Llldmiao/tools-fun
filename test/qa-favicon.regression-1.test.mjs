import test from "node:test";
import assert from "node:assert/strict";

import { renderSite } from "../src/render.mjs";
import { siteContent } from "../content/site-content.mjs";

// Regression: ISSUE-002 — favicon requests returned 404 on every page load
// Found by /qa on 2026-03-21
// Report: .gstack/qa-reports/qa-report-localhost-2026-03-21.md

test("every rendered page declares a favicon", () => {
  const pages = renderSite(siteContent);

  for (const html of Object.values(pages)) {
    assert.match(html, /rel="icon" href="\/favicon\.svg"/);
  }
});
