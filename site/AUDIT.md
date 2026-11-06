# Goal introduction audit

Reviewed2026-11-06. Scope is `site/` only. No app code, repository visibility, key or environment configuration changed.

## Design read

Reading this as a practical product introduction for someone trying to turn a goal into feasible daily work, preserving the actual app’s warm-paper workspace. Variance5, motion1, density4. Native CSS inherits `#f4f2ee` paper, `#1a1a1a` ink, Arial/PingFang typography, white rounded panels and restrained borders. The current app’s visible brand is `franklin-goal`; repository identity is explained rather than silently renamed.

## Actual app opened

Opened https://frankie-goal.vercel.app in Ego. Initial archive contained zero goals. Captured entry. Created a clearly labelled manual sample goal and one30-minute step, inspected rolling/strict configuration and per-day/step-size controls, manually scheduled it for today and opened `/plan`. Clicked “先做5分钟”, inspected the separate completion/pause controls and expanded the actual calendar. Five new real screenshots are under `site/assets/*-current.png`. No AI generation, paid request, private user data, account or credential was used. Images are real sample UI, not a fabricated AI output.

## Source evidence

- `src/app/page.tsx`: manual goal/step creation, AI entry, child breakdown links and manual scheduling.
- `tailwind.config.ts`, `src/app/globals.css`, `AppNavigation.tsx`: actual palette, type, corners and current brand.
- `src/features/goals/types.ts`, `PlanDisplay.tsx`: phases, step kinds, estimated effort and plan presentation.
- `src/lib/decomposition.ts`: necessary-outcome decomposition instruction, reuse of linked children, provenance paths and prerequisites. Explainer is based on implementation, not a scientific productivity claim.
- `DailyPlanBuilder.tsx`, `src/lib/daily-plan.ts`, `src/app/api/daily-plan/route.ts`: rolling versus strict planning, finite weekdays/capacity, granularity, editable preview, completed-item preservation, deferred work and expected outcomes.
- `src/lib/next-action.ts`, `NextAction.tsx`: eligible date/dependency filtering, resumed-work priority, start record, distinct completion. The five-minute label is not a timer.
- `src/app/plan/page.tsx`, `TimeBlockView.tsx`, `ScheduledTasks.tsx`, `TimeBlockDialog.tsx`: quarter/month/week/day notes, status/tags and visible scheduled actions.
- `src/lib/store.ts`, `goal-data.ts`, `DataControls.tsx`: local `frankie-goal-v1` storage, full/planner/goal import distinctions, JSON export and10MB import cap.
- `features/goals/server/openrouter.ts`, API route handlers: server-side OpenRouter configuration. Manual flow remains available without it. No hosted AI availability or model-quality promise is made.

Concepts are explanations of this app’s implemented plan model. No external research or efficacy claim is needed for them. Original owning source is linked through repository/source and maintenance links.

## Validation

- `python3 site/build.py --out /tmp/goal-intro-preview` produced English root and Chinese `/zh/` with no app dependency or env reads.
- Local asset/link checker: two pages, zero issues.
- `git diff --check` passed.
- Browser checks recorded after final rendering below.

- Source app revision: `99b4204255acb86d572dfd604a3b96862056d83b`.
- Browser EN desktop and EN/zh target emulation390×844: no horizontal overflow; all8 referenced images loaded including lazy gallery. Desktop and mobile screenshots visually reviewed. Dark color emulation produced light ink on dark paper; per-page emulation restored.
- Only the audit sample goal was deleted through the app UI after screenshots; no pre-existing goal existed or was removed.
