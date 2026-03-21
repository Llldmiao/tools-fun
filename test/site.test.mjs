import test from "node:test";
import assert from "node:assert/strict";

import { siteContent } from "../content/site-content.mjs";
import { renderSite } from "../src/render.mjs";
import { deriveContent, validateSiteContent } from "../src/validate.mjs";

test("content model validates and keeps ids unique", () => {
  assert.equal(validateSiteContent(siteContent), true);
  assert.equal(new Set(siteContent.tools.map((tool) => tool.slug)).size, siteContent.tools.length);
});

test("derived content groups tools by theme and preserves incubating themes", () => {
  const derived = deriveContent(siteContent);
  const interfaces = derived.orderedThemes.find((theme) => theme.slug === "interfaces");
  const incubating = derived.orderedThemes.find((theme) => theme.slug === "incubating-systems");

  assert.ok(interfaces);
  assert.ok(interfaces.tools.length > 0);
  assert.ok(incubating);
  assert.equal(incubating.tools.length, 0);
  assert.equal(incubating.stateLabel, "Incubating");
});

test("rendered home page includes current workbench and notes", () => {
  const pages = renderSite(siteContent);
  const home = pages["/index.html"];

  assert.match(home, /Currently Exploring/);
  assert.match(home, /Recent Lab Notes/);
  assert.match(home, /Browse the tool themes/);
});

test("rendered tools page uses experiment record cards and incubating theme copy", () => {
  const pages = renderSite(siteContent);
  const tools = pages["/tools/index.html"];

  assert.match(tools, /Evidence wall/);
  assert.match(tools, /Experiment record/);
  assert.match(tools, /Incubating/);
});

test("rendered about page keeps field note framing", () => {
  const pages = renderSite(siteContent);
  const about = pages["/about/index.html"];

  assert.match(about, /Builder field note/);
  assert.match(about, /The lens behind the catalog/);
  assert.match(about, /Context, not a resume/);
});

test("home falls back to current questions when there are no active explorations", () => {
  const fallbackContent = {
    ...siteContent,
    home: {
      ...siteContent.home,
      currentlyExploring: []
    }
  };
  const pages = renderSite(fallbackContent);

  assert.match(pages["/index.html"], /Current question/);
  assert.match(pages["/index.html"], /What would a personal site look like/);
});
