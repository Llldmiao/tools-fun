import { deriveContent } from "./validate.mjs";

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function navMarkup(site, pathname) {
  return `
    <nav class="site-nav" aria-label="Primary">
      <a class="site-mark" href="/">${escapeHtml(site.title)}</a>
      <div class="nav-links">
        ${site.nav
          .map(
            (item) => `
              <a href="${item.href}" ${item.href === pathname ? 'aria-current="page"' : ""}>
                ${escapeHtml(item.label)}
              </a>
            `
          )
          .join("")}
      </div>
    </nav>
  `;
}

function shell({ site, pathname, title, lead, body, footerNote }) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="${escapeHtml(site.description)}" />
    <title>${escapeHtml(title)} · ${escapeHtml(site.title)}</title>
    <link rel="stylesheet" href="/site.css" />
    <script defer src="/site.js"></script>
  </head>
  <body data-pathname="${pathname}">
    <a class="skip-link" href="#content">Skip to content</a>
    <div class="page-shell">
      ${navMarkup(site, pathname)}
      <main id="content" class="page-content">
        <header class="page-header">
          <p class="eyebrow">${escapeHtml(lead.eyebrow)}</p>
          <h1>${escapeHtml(title)}</h1>
          <p class="page-intro">${escapeHtml(lead.copy)}</p>
        </header>
        ${body}
      </main>
      <footer class="site-footer">
        <p>${escapeHtml(footerNote)}</p>
        <ul class="footer-links" aria-label="External links">
          ${site.socialLinks
            .map(
              (link) => `<li><a href="${link.href}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a></li>`
            )
            .join("")}
        </ul>
      </footer>
    </div>
  </body>
</html>`;
}

function renderStatusPill(statusMeta) {
  return `<span class="status-pill status-pill--${statusMeta.tone}">${escapeHtml(statusMeta.label)}</span>`;
}

function renderToolCard(tool) {
  const detailId = `${tool.slug}-detail`;
  const hasLinks = tool.links.length > 0;
  const linkMarkup = hasLinks
    ? `<ul class="tool-card__links" aria-label="${escapeHtml(tool.name)} links">
        ${tool.links
          .map(
            (link) =>
              `<li><a href="${link.href}" target="_blank" rel="noreferrer">${escapeHtml(link.label)}</a></li>`
          )
          .join("")}
      </ul>`
    : `<p class="tool-card__link-note">Public links are not attached yet. Ask me about this tool directly.</p>`;
  return `
    <article class="tool-card" id="${tool.slug}">
      <div class="tool-card__header">
        <div>
          <p class="tool-card__kicker">Experiment record</p>
          <h3>${escapeHtml(tool.name)}</h3>
        </div>
        ${renderStatusPill(tool.statusMeta)}
      </div>
      <p class="tool-card__hook">${escapeHtml(tool.hook)}</p>
      <div class="tool-card__desktop">
        <p class="tool-card__description">${escapeHtml(tool.description)}</p>
        ${linkMarkup}
      </div>
      <button
        class="tool-card__toggle"
        type="button"
        aria-expanded="false"
        aria-controls="${detailId}"
      >
        Open record
      </button>
      <div class="tool-card__mobile-detail" id="${detailId}" hidden>
        <p class="tool-card__description">${escapeHtml(tool.description)}</p>
        ${linkMarkup}
      </div>
    </article>
  `;
}

function renderHome(content) {
  const sections = `
    <section class="panel panel--lead" aria-labelledby="currently-exploring-title">
      <div class="panel-heading">
        <p class="section-label">${escapeHtml(content.home.eyebrow)}</p>
        <h2 id="currently-exploring-title">Currently Exploring</h2>
      </div>
      <div class="exploration-grid">
        ${content.home.displayedExplorations
          .map(
            (item) => `
              <article class="exploration-card">
                <h3>${escapeHtml(item.title)}</h3>
                <p>${escapeHtml(item.detail)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>

    <section class="panel" aria-labelledby="lab-notes-title">
      <div class="panel-heading">
        <p class="section-label">Selected excerpts</p>
        <h2 id="lab-notes-title">Recent Lab Notes</h2>
      </div>
      <div class="notes-list">
        ${content.home.recentNotes
          .map(
            (note) => `
              <article class="note-card">
                <div class="note-card__meta">
                  <span>${escapeHtml(note.label)}</span>
                  <span>${escapeHtml(note.date)}</span>
                </div>
                <h3>${escapeHtml(note.title)}</h3>
                <p>${escapeHtml(note.excerpt)}</p>
              </article>
            `
          )
          .join("")}
      </div>
    </section>

    <section class="panel panel--tools-entry" aria-labelledby="theme-entry-title">
      <div class="panel-heading">
        <p class="section-label">Direction map</p>
        <h2 id="theme-entry-title">Browse the tool themes</h2>
      </div>
      <div class="theme-entry-grid">
        ${content.orderedThemes
          .map(
            (theme) => `
              <a class="theme-teaser" href="/tools/#${theme.slug}">
                <strong>${escapeHtml(theme.name)}</strong>
                <span>${escapeHtml(theme.summary)}</span>
              </a>
            `
          )
          .join("")}
      </div>
    </section>

    <section class="panel panel--light" aria-labelledby="quick-context-title">
      <div class="panel-heading">
        <p class="section-label">Quick context</p>
        <h2 id="quick-context-title">Why this site exists</h2>
      </div>
      <p class="single-column-copy">${escapeHtml(content.home.intro)}</p>
      <a class="text-link" href="/about/">Read the field note</a>
    </section>
  `;

  return shell({
    site: content.site,
    pathname: "/",
    title: content.home.title,
    lead: {
      eyebrow: "Working notebook",
      copy: content.home.intro
    },
    footerNote: "Built as a small evidence wall for active experiments.",
    body: sections
  });
}

function renderTools(content) {
  const sections = `
    <section class="panel panel--lead" aria-labelledby="tools-map-title">
      <div class="panel-heading">
        <p class="section-label">Evidence wall</p>
        <h2 id="tools-map-title">Themes, grouped instead of dumped</h2>
      </div>
      <p class="single-column-copy">
        This first release is a curated shelf, not a full archive. Sparse is intentional.
      </p>
      <div class="theme-anchor-list" aria-label="Theme navigation">
        ${content.orderedThemes
          .map((theme) => `<a href="#${theme.slug}">${escapeHtml(theme.name)}</a>`)
          .join("")}
      </div>
    </section>

    ${content.orderedThemes
      .map((theme) => {
        const hasTools = theme.tools.length > 0;
        return `
          <section class="panel panel--theme" id="${theme.slug}" aria-labelledby="${theme.slug}-title">
            <div class="panel-heading">
              <p class="section-label">${hasTools ? `${theme.tools.length} record${theme.tools.length > 1 ? "s" : ""}` : "Theme state"}</p>
              <h2 id="${theme.slug}-title">${escapeHtml(theme.name)}</h2>
            </div>
            <p class="single-column-copy">${escapeHtml(theme.summary)}</p>
            ${
              hasTools
                ? `<div class="tool-grid">${theme.tools.map(renderToolCard).join("")}</div>`
                : `<div class="incubating-card" role="note" aria-label="${escapeHtml(theme.name)} incubating">
                    ${renderStatusPill({ label: "Incubating", tone: "ink" })}
                    <p>${escapeHtml(theme.incubatingNote ?? "This theme is active but not shipped yet.")}</p>
                  </div>`
            }
          </section>
        `;
      })
      .join("")}
  `;

  return shell({
    site: content.site,
    pathname: "/tools/",
    title: "Tools",
    lead: {
      eyebrow: "Selected records",
      copy:
        "Grouped by theme so the point of view stays visible. The goal is not quantity. The goal is legibility."
    },
    footerNote: "Every tool here exists because a repeated irritation felt worth sharpening.",
    body: sections
  });
}

function renderAbout(content) {
  const sections = `
    <section class="panel panel--lead" aria-labelledby="lens-title">
      <div class="panel-heading">
        <p class="section-label">Builder field note</p>
        <h2 id="lens-title">${escapeHtml(content.about.title)}</h2>
      </div>
      <p class="single-column-copy">${escapeHtml(content.about.lens)}</p>
    </section>

    <section class="panel panel--split" aria-labelledby="about-story-title">
      <div>
        <div class="panel-heading">
          <p class="section-label">Why these tools exist</p>
          <h2 id="about-story-title">The lens behind the catalog</h2>
        </div>
        <div class="prose-stack">
          ${content.about.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("")}
        </div>
      </div>
      <aside class="fact-stack" aria-label="Quick facts">
        ${content.about.facts
          .map(
            (fact) => `
              <article class="fact-card">
                <span>${escapeHtml(fact.label)}</span>
                <strong>${escapeHtml(fact.value)}</strong>
              </article>
            `
          )
          .join("")}
      </aside>
    </section>

    <section class="panel panel--light" aria-labelledby="contact-title">
      <div class="panel-heading">
        <p class="section-label">Next move</p>
        <h2 id="contact-title">If you want the sharper version</h2>
      </div>
      <p class="single-column-copy">
        The fastest way to understand this site is to open a tool, read the note around it, and ask why that angle felt worth building.
      </p>
      <a class="text-link" href="mailto:${escapeHtml(content.site.email)}">Send me a note</a>
    </section>
  `;

  return shell({
    site: content.site,
    pathname: "/about/",
    title: "About",
    lead: {
      eyebrow: "Context, not a resume",
      copy:
        "Enough background to make the work legible, without flattening it into a standard profile page."
    },
    footerNote: "Small tools are how I keep ideas honest.",
    body: sections
  });
}

export function renderSite(rawContent) {
  const content = deriveContent(rawContent);

  return {
    "/index.html": renderHome(content),
    "/tools/index.html": renderTools(content),
    "/about/index.html": renderAbout(content)
  };
}
