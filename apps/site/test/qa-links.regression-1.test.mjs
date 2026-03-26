import test from "node:test";
import assert from "node:assert/strict";

import { siteContent } from "../content/site-content.mjs";
import { renderSite } from "../src/render.mjs";

// Regression: ISSUE-001 — placeholder public links shipped as real destinations
// Found by /qa on 2026-03-21
// Report: .gstack/qa-reports/qa-report-localhost-2026-03-21.md

test("public site links do not use placeholder handles or example.com", () => {
  for (const link of siteContent.site.socialLinks) {
    assert.doesNotMatch(link.href, /your-handle/);
    assert.doesNotMatch(link.href, /example\.com/);
  }

  for (const tool of siteContent.tools) {
    for (const link of tool.links) {
      assert.doesNotMatch(link.href, /your-handle/);
      assert.doesNotMatch(link.href, /example\.com/);
    }
  }
});

test("tools without public links render an explicit note instead of dead buttons", () => {
  const toolsPage = renderSite(siteContent)["/tools/index.html"];

  assert.match(toolsPage, /Public links are not attached yet/);
  assert.doesNotMatch(toolsPage, /github\.com\/your-handle/);
  assert.doesNotMatch(toolsPage, /example\.com/);
});
