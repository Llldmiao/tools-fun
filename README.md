# Clipboard App

一个基于 Cloudflare 的共享粘贴板应用。

- 前端：React + Vite
- API：Cloudflare Worker
- 历史数据：Cloudflare D1
- 实时同步：Cloudflare Durable Objects + SSE
- 数据保留：最近 7 天，按小时自动清理过期消息

## 项目结构

- `apps/clipboard-web`: 前端页面
- `apps/clipboard-api`: Worker、D1 和 Durable Object 代码
- `packages/shared`: 前后端共用的房间码、内容校验和数据格式化逻辑
- `wrangler.toml`: Cloudflare 部署配置

## 本地开发

先安装依赖：

```bash
pnpm install
```

传统本地开发：

```bash
pnpm dev
```

Cloudflare 本地开发：

```bash
pnpm run cf:dev
```

Cloudflare 本地开发会先构建前端，再通过 `wrangler dev` 启动 Worker、D1 和 Durable Object。

## Cloudflare 资源配置

当前 Worker 使用这些绑定：

- D1 binding: `DB`
- Durable Object binding: `ROOMS`
- Durable Object class: `RoomDurableObject`

当前 D1 数据库：

- `database_name = "clipboard-db"`

相关配置见 [wrangler.toml](/Users/lengmiao/.codex/worktrees/621b/tools-fun/wrangler.toml)。如果后续重建数据库，记得同步更新其中的 `database_id`。

## D1 Migration

创建数据库：

```bash
pnpm run cf:d1:create
```

应用本地 migration：

```bash
pnpm run cf:d1:migrate:local
```

应用远程 migration：

```bash
pnpm run cf:d1:migrate:remote
```

当前 migration 文件位于：

- [0001_init.sql](/Users/lengmiao/.codex/worktrees/621b/tools-fun/apps/clipboard-api/migrations/0001_init.sql)

## 发布

部署到 Cloudflare：

```bash
pnpm run cf:deploy
```

建议发布前做这几项检查：

1. `pnpm run cf:dev` 能正常启动
2. `/health` 返回 `{"ok":true}`
3. `GET /api/rooms/:roomId/items` 正常
4. `POST /api/rooms/:roomId/items` 正常
5. 两个标签页进入同一房间时，新增内容能实时同步

## 线上验收

建议至少验证：

```bash
curl -I https://lengmiaomiao.win/health
curl https://lengmiaomiao.win/api/rooms/ROOM88/items
```

然后再用浏览器检查：

- 首页加载正常
- 生成/进入房间正常
- 发送内容正常
- 双标签页实时同步正常

## 备注

- 旧的服务器部署脚本仍保留在仓库里，但当前主部署路径已经切到 Cloudflare
- 如果后续更换 D1 数据库，需要同步更新 [wrangler.toml](/Users/lengmiao/.codex/worktrees/621b/tools-fun/wrangler.toml)
