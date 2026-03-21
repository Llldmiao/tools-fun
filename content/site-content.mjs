export const siteContent = {
  site: {
    title: "Lengmiao's Lab",
    description:
      "A log-driven personal site for strange, useful, and playful tools.",
    owner: "Lengmiao",
    email: "hello@example.com",
    nav: [
      { href: "/", label: "Home" },
      { href: "/tools/", label: "Tools" },
      { href: "/about/", label: "About" }
    ],
    socialLinks: [
      { label: "GitHub", href: "https://github.com/your-handle" },
      { label: "X", href: "https://x.com/your-handle" },
      { label: "Email", href: "mailto:hello@example.com" }
    ]
  },
  statuses: [
    {
      id: "experiment",
      label: "Experiment",
      tone: "warm",
      description: "A live idea still being shaped."
    },
    {
      id: "usable",
      label: "Usable",
      tone: "stable",
      description: "Something I can actually rely on."
    },
    {
      id: "ongoing",
      label: "Ongoing",
      tone: "signal",
      description: "Still evolving in public."
    },
    {
      id: "archived",
      label: "Archived",
      tone: "muted",
      description: "A finished experiment I still want visible."
    },
    {
      id: "incubating",
      label: "Incubating",
      tone: "ink",
      description: "A theme or idea not shipped yet."
    }
  ],
  themes: [
    {
      id: "interfaces",
      slug: "interfaces",
      name: "Interfaces",
      summary: "Tools that change how a small interaction feels.",
      order: 1
    },
    {
      id: "automation",
      slug: "automation",
      name: "Automation",
      summary: "Little systems that save attention, not just time.",
      order: 2
    },
    {
      id: "play",
      slug: "play",
      name: "Play",
      summary: "Ideas that started as jokes and turned useful.",
      order: 3
    },
    {
      id: "incubating-systems",
      slug: "incubating-systems",
      name: "Incubating Systems",
      summary: "Problems I keep circling but have not shipped yet.",
      order: 4,
      incubating: true,
      incubatingNote: "Thinking through attention, personal search, and note resurfacing."
    }
  ],
  home: {
    eyebrow: "Current workbench",
    title: "I turn odd angles on everyday problems into tools that can run.",
    intro:
      "This is not a portfolio wall. It is a working desk: active questions, recent notes, and a catalog of tools that came out of them.",
    currentlyExploring: [
      {
        id: "exploration-quiet-ui",
        title: "Can interface feedback feel more like annotation than notification?",
        detail:
          "I keep testing ways to make tools feel alive without screaming for attention."
      },
      {
        id: "exploration-humane-automation",
        title: "What makes automation feel helpful instead of alienating?",
        detail:
          "Most automation removes the wrong friction. I am more interested in preserving judgment while removing repetition."
      }
    ],
    currentQuestions: [
      "What would a personal site look like if it behaved more like a lab notebook than a landing page?",
      "Which tiny tool ideas reveal the most about how I think?",
      "How little interface can I use before a page stops feeling alive?"
    ],
    recentNotes: [
      {
        id: "note-annotation",
        label: "Recent note",
        date: "2026-03-20",
        title: "Annotation beats announcement",
        excerpt:
          "Status markers and tiny labels build more trust than oversized hero copy. I want the site to feel quietly alive."
      },
      {
        id: "note-curation",
        label: "Recent note",
        date: "2026-03-18",
        title: "Sparse is okay if it is obviously curated",
        excerpt:
          "Three strong tools feel better than twelve weak ones. The page should act like a selected shelf, not a missing inventory."
      },
      {
        id: "note-evidence",
        label: "Recent note",
        date: "2026-03-14",
        title: "The tools page is an evidence wall",
        excerpt:
          "The point is not to say I have ideas. The point is to show those ideas survived contact with implementation."
      }
    ]
  },
  about: {
    title: "Builder field note",
    lens:
      "I like problems that are too small for a startup and too weird for a roadmap, but still annoying enough to deserve a tool.",
    paragraphs: [
      "Most of what I build starts with a behavior I cannot stop noticing: a noisy interaction, a missing shortcut, or a piece of software that almost feels humane but stops one step early.",
      "I gravitate toward tools that compress friction without flattening judgment. I would rather make a tiny thing with a sharp point of view than a big generic system.",
      "This site is intentionally narrow. It is less 'everything I have ever done' and more 'here are the experiments that best explain how I think.'"
    ],
    facts: [
      { label: "Works best on", value: "interfaces, automation, odd utilities" },
      { label: "Default instinct", value: "cut noise, keep signal" },
      { label: "Current bias", value: "small tools with real behavior" }
    ]
  },
  tools: [
    {
      id: "ambient-anchor",
      slug: "ambient-anchor",
      themeId: "interfaces",
      name: "Ambient Anchor",
      hook: "A floating cue that keeps long pages oriented without acting like a sticky banner.",
      description:
        "A tiny interface layer for giving readers a sense of position and direction on dense pages.",
      status: "usable",
      links: [
        { type: "repo", label: "Repo", href: "https://github.com/your-handle/ambient-anchor" },
        { type: "notes", label: "Notes", href: "https://example.com/ambient-anchor-notes" }
      ]
    },
    {
      id: "gentle-batch",
      slug: "gentle-batch",
      themeId: "automation",
      name: "Gentle Batch",
      hook: "Groups repetitive chores without making them feel like a queue of punishment.",
      description:
        "An automation helper that batches routine tasks while preserving a human review step.",
      status: "ongoing",
      links: [
        { type: "repo", label: "Repo", href: "https://github.com/your-handle/gentle-batch" },
        { type: "demo", label: "Demo", href: "https://example.com/gentle-batch" }
      ]
    },
    {
      id: "tab-signal",
      slug: "tab-signal",
      themeId: "interfaces",
      name: "Tab Signal",
      hook: "Makes browser tabs feel less like debris and more like a readable control surface.",
      description:
        "A small browser-side experiment for surfacing state and priority without noisy badges.",
      status: "experiment",
      links: [{ type: "repo", label: "Repo", href: "https://github.com/your-handle/tab-signal" }]
    },
    {
      id: "odd-jobs",
      slug: "odd-jobs",
      themeId: "play",
      name: "Odd Jobs",
      hook: "A drawer of deliberately over-specific utilities that turned out to be useful.",
      description:
        "A cluster of tiny single-purpose tools for formatting, sorting, and rescuing awkward bits of data.",
      status: "usable",
      links: [
        { type: "repo", label: "Repo", href: "https://github.com/your-handle/odd-jobs" },
        { type: "writeup", label: "Write-up", href: "https://example.com/odd-jobs" }
      ]
    },
    {
      id: "whisper-timer",
      slug: "whisper-timer",
      themeId: "play",
      name: "Whisper Timer",
      hook: "A timer that nudges, marks, and fades instead of shouting.",
      description:
        "An experiment in making a deadline feel ambient rather than alarming.",
      status: "archived",
      links: [{ type: "notes", label: "Notes", href: "https://example.com/whisper-timer" }]
    }
  ]
};
