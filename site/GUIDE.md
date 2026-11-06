# Goal introduction maintenance / 介绍页维护

The introduction is a separate static site. English is `/`; Chinese is `/zh/`. The product currently labels itself **franklin-goal**, while the repository remains `frankie-goal`. Do not rename the app as part of an introduction update.

介绍页是独立静态站点，英文为根路径，中文为 `/zh/`。当前产品界面名为 **franklin-goal**，仓库名仍为 `frankie-goal`；不要因为更新介绍页而更改应用品牌。

## Build and preview / 构建预览

```sh
python3 site/build.py --out _site
python3 -m http.server 8300 --bind 127.0.0.1 --directory _site
```

Check `/` and `/zh/` at desktop and phone widths. Confirm no horizontal overflow, readable hero crop, all images loading, keyboard focus and working `#use` / `#start` links. No Node app build, API key or environment file is needed for this static build. The existing `.github/workflows/pages.yml` publishes `_site`.

同时检查中英文的桌面与手机布局、图片、键盘焦点，以及 `#use` / `#start` 链接。静态构建不需要应用构建、API key 或环境文件。

## Which assets to refresh / 哪些素材需要替换

All current screenshots are actual browser captures at 1468×1247, taken on 2026-11-06. They show a clearly labelled manual sample, never an invented AI response. Save originals without painting over the app. The hero uses a CSS crop of `planning-current.png`; full captures remain linked in the gallery.

| File under `site/assets/` | Capture flow | Replace after changes to |
| --- | --- | --- |
| `home-current.png` | Open a fresh Goal app origin with no records | `src/app/page.tsx`, `AppNavigation.tsx`, entry form/branding |
| `planning-current.png` | Create “Sample: publish a small portfolio” manually, add “Sample: choose three portfolio projects”, estimate30minutes | `DailyPlanBuilder.tsx`, plan settings, phase display |
| `next-current.png` | Expand manual scheduling, choose today, add the step, open `/plan` | `NextAction.tsx`, `src/app/plan/page.tsx` |
| `focus-current.png` | Click “先做5分钟” on that sample | start/pause/completion interaction |
| `calendar-current.png` | Expand “查看时间日历” | `TimeBlockView.tsx`, `TimeBlock.tsx`, time-block editing |
| copied `docs/readme/banner.png` | Existing approved banner; no redraw in this build | banner assets/version |
| copied `docs/readme/assets/frankie.svg` | Existing family signature | signature changes |

使用新浏览器来源或没有个人记录的测试环境。只创建清楚标注的示例目标；不要截图真实私人目标，不要为了补图调用付费 AI。截图后删除自己新建的示例，保留原先的数据。若刷新需要 AI 结果，请先取得允许并使用明确标注的非私人示例；不要把手动样例伪装成 AI 结果。

## Content source map / 内容核对来源

Edit both languages in `site/content.json`, not README-derived text. Match the current app palette/type/radii in `site/style.css`; layout and metadata are in `site/build.py`.

- Brand/tokens: `src/components/AppNavigation.tsx`, `tailwind.config.ts`, `src/app/globals.css`.
- Goal/manual step flow: `src/app/page.tsx`, `src/features/goals/components/PlanDisplay.tsx`.
- Goal hierarchy and provenance: `src/lib/decomposition.ts`.
- Rolling/strict planning, budget, action granularity and editable preview: `src/components/DailyPlanBuilder.tsx`, `src/lib/daily-plan.ts`, `src/app/api/daily-plan/route.ts`.
- Start eligibility and resumed work: `src/lib/next-action.ts`, `src/components/NextAction.tsx`.
- Time-block notes/status/tags and scheduled actions: `TimeBlockView.tsx`, `TimeBlockDialog.tsx`, `ScheduledTasks.tsx`.
- Local storage, import variants and replace behavior: `src/lib/store.ts`, `src/lib/goal-data.ts`, `src/components/DataControls.tsx`.
- Online context and provider requirements: `src/features/goals/client.ts`, `src/features/goals/server/openrouter.ts`, API routes. Never copy `.env` values into the intro.

Changing completion criteria, storage, AI provider, import semantics or scheduling logic requires copy review even if screenshots look unchanged. Do not claim a five-minute timer, automatic completion, guaranteed results, cloud sync, external-calendar integration or free hosted AI unless those features have actually been implemented and verified.

即使截图没变化，只要完成标准、存储、AI 服务、导入规则或排程逻辑变化，也要同步核对文案。修改后重新构建两种语言，再走一次手动创建、安排日期、开始与暂停流程。

## Publishing / 发布

Commit only reviewed `site/` changes and relevant Pages workflow updates. Do not include unrelated application edits. Push to `main`, wait for the Pages workflow to succeed, then inspect the live English and Chinese URLs. This work does not require a Vercel app redeploy.
