const STATUS_IDS = new Set(["experiment", "usable", "ongoing", "archived", "incubating"]);
const LINK_TYPES = new Set(["demo", "repo", "notes", "writeup"]);

function invariant(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isAbsoluteHttpUrl(value) {
  return /^https?:\/\//.test(value) || /^mailto:/.test(value);
}

export function validateSiteContent(content) {
  invariant(content && typeof content === "object", "content must be an object");
  invariant(hasText(content.site?.title), "site.title is required");
  invariant(Array.isArray(content.themes), "themes must be an array");
  invariant(Array.isArray(content.tools), "tools must be an array");
  invariant(Array.isArray(content.statuses), "statuses must be an array");

  const themeIds = new Set();
  const themeSlugs = new Set();
  for (const theme of content.themes) {
    invariant(hasText(theme.id), "theme.id is required");
    invariant(hasText(theme.slug), `theme.slug is required for ${theme.id}`);
    invariant(!themeIds.has(theme.id), `duplicate theme id: ${theme.id}`);
    invariant(!themeSlugs.has(theme.slug), `duplicate theme slug: ${theme.slug}`);
    invariant(hasText(theme.name), `theme.name is required for ${theme.id}`);
    invariant(hasText(theme.summary), `theme.summary is required for ${theme.id}`);
    themeIds.add(theme.id);
    themeSlugs.add(theme.slug);
  }

  const toolIds = new Set();
  const toolSlugs = new Set();
  for (const tool of content.tools) {
    invariant(hasText(tool.id), "tool.id is required");
    invariant(hasText(tool.slug), `tool.slug is required for ${tool.id}`);
    invariant(!toolIds.has(tool.id), `duplicate tool id: ${tool.id}`);
    invariant(!toolSlugs.has(tool.slug), `duplicate tool slug: ${tool.slug}`);
    invariant(themeIds.has(tool.themeId), `tool ${tool.id} references missing theme ${tool.themeId}`);
    invariant(hasText(tool.name), `tool.name is required for ${tool.id}`);
    invariant(hasText(tool.hook), `tool.hook is required for ${tool.id}`);
    invariant(hasText(tool.description), `tool.description is required for ${tool.id}`);
    invariant(STATUS_IDS.has(tool.status), `tool ${tool.id} has invalid status ${tool.status}`);
    invariant(Array.isArray(tool.links), `tool.links must be an array for ${tool.id}`);
    for (const link of tool.links) {
      invariant(LINK_TYPES.has(link.type), `tool ${tool.id} has invalid link type ${link.type}`);
      invariant(hasText(link.label), `tool ${tool.id} link label is required`);
      invariant(isAbsoluteHttpUrl(link.href), `tool ${tool.id} has invalid link href ${link.href}`);
    }
    toolIds.add(tool.id);
    toolSlugs.add(tool.slug);
  }

  const statusIds = new Set();
  for (const status of content.statuses) {
    invariant(STATUS_IDS.has(status.id), `unknown status descriptor ${status.id}`);
    invariant(!statusIds.has(status.id), `duplicate status descriptor ${status.id}`);
    invariant(hasText(status.label), `status label is required for ${status.id}`);
    statusIds.add(status.id);
  }

  invariant(Array.isArray(content.home?.currentQuestions), "home.currentQuestions must be an array");
  invariant(Array.isArray(content.home?.recentNotes), "home.recentNotes must be an array");
  invariant(hasText(content.about?.title), "about.title is required");

  return true;
}

export function deriveContent(content) {
  validateSiteContent(content);

  const statusMap = new Map(content.statuses.map((status) => [status.id, status]));
  const toolsByTheme = new Map(content.themes.map((theme) => [theme.id, []]));

  for (const tool of content.tools) {
    toolsByTheme.get(tool.themeId).push({
      ...tool,
      statusMeta: statusMap.get(tool.status)
    });
  }

  const orderedThemes = [...content.themes]
    .sort((a, b) => a.order - b.order)
    .map((theme) => ({
      ...theme,
      tools: toolsByTheme.get(theme.id) ?? [],
      stateLabel: theme.incubating ? "Incubating" : null
    }));

  return {
    ...content,
    orderedThemes,
    home: {
      ...content.home,
      displayedExplorations:
        content.home.currentlyExploring.length > 0
          ? content.home.currentlyExploring
          : content.home.currentQuestions.map((question, index) => ({
              id: `question-${index + 1}`,
              title: question,
              detail: "Current question"
            }))
    }
  };
}
