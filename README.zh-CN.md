<h1 align="center"><picture><source media="(prefers-color-scheme: dark)" srcset=".github/brand/icon-dark.svg"><img src=".github/brand/icon-light.svg" width="56" height="56" alt=""></picture><br>Frankie Goal</h1>

<p align="center"><b>把想做的事拆成行动，再为每天留出可以开始的时间。</b></p>

<p align="center"><a href="https://songhaifan.github.io/frankie-goal/zh/">项目介绍</a> · <a href="https://frankie-goal.vercel.app">打开应用</a> · <a href="docs/guide.md">使用指南</a> · <a href="README.md">English</a></p>

<p align="center"><img src="docs/readme/assets/current-mobile.png" width="320" alt="Frankie Goal — actual application interface"></p>

## 可以做什么

- 拆解目标、阶段和行动，保留来源、依赖与完成标准。
- 按可用时间滚动安排每日行动，先看今天能开始的一件事。
- 用笔记、本地保存和 JSON 备份持续整理计划。

## 本地运行

需要 Node.js 22.18+ 或 Node.js 24+。首次配置时：

```sh
npm ci
cp .env.example .env.local
npm run dev
```

打开 http://localhost:3000。AI 拆解使用服务端 `OPENROUTER_API_KEY`；模型可通过 `OPENROUTER_MODEL` 配置。

## 开始之前

不配置 key 也可以手动管理目标、行动、日程和备份。数据保存在当前浏览器，没有账户或云端同步。旧数据导入和父子任务迁移规则见项目指南。

## 开发说明

```sh
npm run typecheck
npm test
npm run build
```

[项目指南](docs/guide.md) · [Banner 维护](docs/readme/README.md)

---

<!-- series-footer:start -->

<p align="center">
<a href="https://songhaifan.github.io/frankie-brain/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-brain.svg" width="32" height="32" alt="Frankie Brain" title="Frankie Brain"></a> &nbsp; <a href="https://songhaifan.github.io/frankie-cards/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-cards.svg" width="32" height="32" alt="Frankie Cards" title="Frankie Cards"></a> &nbsp; <a href="https://songhaifan.github.io/frankie-dictionary/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-dictionary.svg" width="32" height="32" alt="Blue Dictionary" title="Blue Dictionary"></a> &nbsp; <a href="https://songhaifan.github.io/frankie-generative-art/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-generative-art.svg" width="32" height="32" alt="Frankie Generative Art Gallery" title="Frankie Generative Art Gallery"></a> &nbsp; <a href="https://songhaifan.github.io/frankie-goal/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-goal.svg" width="32" height="32" alt="Frankie Goal" title="Frankie Goal"></a> &nbsp; <a href="https://songhaifan.github.io/frankie-guitar/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-guitar.svg" width="32" height="32" alt="Frankie Guitar" title="Frankie Guitar"></a> &nbsp; <a href="https://songhaifan.github.io/frankie-list/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-list.svg" width="32" height="32" alt="Frank’s Life List" title="Frank’s Life List"></a> &nbsp; <a href="https://songhaifan.github.io/frankie-mbti/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-mbti.svg" width="32" height="32" alt="Frankie MBTI" title="Frankie MBTI"></a> &nbsp; <a href="https://songhaifan.github.io/frankie-onitama/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-onitama.svg" width="32" height="32" alt="Frankie Onitama" title="Frankie Onitama"></a> &nbsp; <a href="https://songhaifan.github.io/frankie-owspace-api/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-owspace-api-badge.svg" width="32" height="32" alt="OWSPACE Archive" title="OWSPACE Archive · API"></a> &nbsp; <a href="https://songhaifan.github.io/frankie-poker/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-poker.svg" width="32" height="32" alt="Frankie Poker" title="Frankie Poker"></a> &nbsp; <a href="https://songhaifan.github.io/frankie-stocks/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-stocks.svg" width="32" height="32" alt="Frankie Stocks" title="Frankie Stocks"></a> &nbsp; <a href="https://songhaifan.github.io/frankie-tarot/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-tarot.svg" width="32" height="32" alt="Frankie Tarot" title="Frankie Tarot"></a> &nbsp; <a href="https://songhaifan.github.io/frankie-tarot-api/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-tarot-api.svg" width="32" height="32" alt="Frankie Tarot API" title="Frankie Tarot · API"></a> &nbsp; <a href="https://songhaifan.github.io/frankie-werewolf/"><img src="https://raw.githubusercontent.com/SonghaiFan/SonghaiFan/main/assets/series/frankie-werewolf.svg" width="32" height="32" alt="Werewolf Local" title="Werewolf Local"></a>
</p>

<p align="center"><sub>Frankie series · Made by <a href="https://github.com/SonghaiFan">Songhai Fan</a></sub></p>

<!-- series-footer:end -->

<p align="right"><picture><source media="(prefers-color-scheme: dark)" srcset=".github/brand/signature-dark.svg"><img src=".github/brand/signature-light.svg" width="90" alt="Frankie"></picture></p>
