export const siteContent = {
  site: {
    title: "Lengmiao's Lab",
    description:
      "一个记录实用又好玩的工具的个人站点。",
    owner: "Lengmiao",
    email: "peilinhana@gmail.com",
    nav: [
      { href: "/", label: "首页" },
      { href: "/tools/", label: "工具" },
      { href: "/about/", label: "关于" }
    ],
    socialLinks: [
      { label: "GitHub", href: "https://github.com/Llldmiao" },
      { label: "仓库", href: "https://github.com/Llldmiao/tools-fun" },
      { label: "邮箱", href: "mailto:peilinhana@gmail.com" }
    ]
  },
  statuses: [
    {
      id: "experiment",
      label: "Experiment",
      tone: "warm",
      description: "还在成形中的现场实验。"
    },
    {
      id: "usable",
      label: "Usable",
      tone: "stable",
      description: "已经能稳定派上用场。"
    },
    {
      id: "ongoing",
      label: "Ongoing",
      tone: "signal",
      description: "仍在公开迭代中。"
    },
    {
      id: "archived",
      label: "Archived",
      tone: "muted",
      description: "阶段完成，但我仍想把它留在台面上。"
    },
    {
      id: "incubating",
      label: "Incubating",
      tone: "ink",
      description: "还没真正发布的主题或想法。"
    }
  ],
  themes: [
    {
      id: "interfaces",
      slug: "interfaces",
      name: "Interfaces",
      summary: "关注微小交互手感的工具，让页面反应更有分寸。",
      order: 1
    },
    {
      id: "automation",
      slug: "automation",
      name: "Automation",
      summary: "不只节省时间，也尽量节省注意力的小系统。",
      order: 2
    },
    {
      id: "play",
      slug: "play",
      name: "Play",
      summary: "起初像玩笑，最后却真的变得有用的点子。",
      order: 3
    },
    {
      id: "incubating-systems",
      slug: "incubating-systems",
      name: "Incubating Systems",
      summary: "一直在心里转，但还没真正动手的方向。",
      order: 4,
      incubating: true,
      incubatingNote: "注意力管理、个人搜索、让沉掉的旧笔记重新浮出来——这几个方向我反复转，但还没想清楚怎么做。"
    }
  ],
  home: {
    eyebrow: "当前工作台",
    title: "I turn odd angles on everyday problems into tools that can run.",
    intro:
      "这不是一面作品集展示墙，更像一张正在使用中的工作桌：上面放着我还在追问的问题、最近的记录，以及从这些记录里长出来的小工具。",
    currentlyExploring: [
      {
        id: "exploration-quiet-ui",
        title: "Can interface feedback feel more like annotation than notification?",
        detail:
          "怎么让工具有存在感，又不需要靠吵闹来证明自己——这是我最近一直在测的问题。"
      },
      {
        id: "exploration-humane-automation",
        title: "What makes automation feel helpful instead of alienating?",
        detail:
          "大多数自动化削掉的是不该削的摩擦。减少重复和保留判断，我更在乎后者。"
      }
    ],
    currentQuestions: [
      "如果个人网站更像实验笔记，而不是标准落地页，它会长什么样？",
      "哪些很小的工具点子，最能暴露我的思考方式？",
      "界面还能再少到什么程度，页面才会失去“活着”的感觉？"
    ],
    recentNotes: [
      {
        id: "note-annotation",
        label: "最近笔记",
        date: "2026-03-20",
        title: "Annotation beats announcement",
        excerpt:
          "状态标记和小标签，比夸张的主视觉文案更能建立信任。我想让这个站点安静地“活着”。"
      },
      {
        id: "note-curation",
        label: "最近笔记",
        date: "2026-03-18",
        title: "Sparse is okay if it is obviously curated",
        excerpt:
          "三个扎实的小工具，往往比十二个普通条目更有说服力。页面应该像精选书架，而不是残缺库存。"
      },
      {
        id: "note-evidence",
        label: "最近笔记",
        date: "2026-03-14",
        title: "The tools page is an evidence wall",
        excerpt:
          "重点不是证明我有想法，而是证明这些想法和实现正面碰撞之后，依然站得住。"
      }
    ]
  },
  about: {
    title: "Builder field note",
    lens:
      "我喜欢那种对创业项目来说太小、对正式规划来说又太怪，但偏偏烦人到值得专门做个工具的问题。",
    paragraphs: [
      "我做的大多数东西，都是从一个绕不开的细节开始的——太吵的交互，缺了一步的快捷路径，或者差一口气就有人味、但偏偏在最后卡住的软件。",
      "我会天然偏向那些能压缩摩擦、但不抹平判断的工具。比起做一个庞大但泛化的系统，我更愿意做一个小而尖锐、有明确观点的东西。",
      "这个站点故意收得很窄。它不是“我做过的一切”，而更像“最能解释我怎么思考的那几组实验”。"
    ],
    facts: [
      { label: "擅长方向", value: "界面、自动化、奇怪但有用的小工具" },
      { label: "默认倾向", value: "减少噪音，保留信号" },
      { label: "当前偏好", value: "有真实行为的小工具" }
    ]
  },
  tools: [
    {
      id: "ambient-anchor",
      slug: "ambient-anchor",
      themeId: "interfaces",
      name: "Ambient Anchor",
      hook: "轻量位置提示，让长页面也有方向感，不会像固定顶栏那样挡着视线。",
      description:
        "在密集的页面上加一层很薄的提示，不挡内容，但始终告诉你现在在哪、下一步往哪走。",
      status: "usable",
      links: []
    },
    {
      id: "gentle-batch",
      slug: "gentle-batch",
      themeId: "automation",
      name: "Gentle Batch",
      hook: "重复的杂事打包处理，但不做成让人有压力的任务队列。",
      description:
        "把日常重复的事情打包处理，但不跳过人工确认这一步。",
      status: "ongoing",
      links: []
    },
    {
      id: "tab-signal",
      slug: "tab-signal",
      themeId: "interfaces",
      name: "Tab Signal",
      hook: "让浏览器标签页不再像一堆碎片，而更像一个可读的操作界面。",
      description:
        "一个浏览器侧的小实验，用更安静的方式展示状态和优先级，而不是继续堆叠吵闹的标记。",
      status: "experiment",
      links: []
    },
    {
      id: "odd-jobs",
      slug: "odd-jobs",
      themeId: "play",
      name: "Odd Jobs",
      hook: "一抽屉故意做得很具体的小工具，结果意外地都挺有用。",
      description:
        "一组单一用途的小工具，处理格式整理、结果排序，以及收拾那些格式很别扭的数据片段。",
      status: "usable",
      links: []
    },
    {
      id: "whisper-timer",
      slug: "whisper-timer",
      themeId: "play",
      name: "Whisper Timer",
      hook: "不靠喊叫来提醒的计时器——轻碰你一下，做个记号，然后退开。",
      description:
        "一次关于计时体验的实验，想让截止时间更像背景里的轻提示，而不是警报连发。",
      status: "archived",
      links: []
    }
  ]
};
