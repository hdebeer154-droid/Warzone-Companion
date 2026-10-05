# Roadmap & Status

The project was built in eight phases. Each phase was verified (tests, migrations, auth, API errors,
TypeScript) before moving on, and the app stayed runnable at every stage.

| Phase | Scope | Status |
|-------|-------|--------|
| **1** | Database schema, backend skeleton, auth, mobile navigation | ✅ Complete |
| **2** | Weapon & camo tracking | ✅ Complete |
| **3** | Dashboard + activity feed + objectives engine | ✅ Complete |
| **4** | Screenshot / OCR pipeline | ✅ Complete |
| **5** | Calling cards + events | ✅ Complete |
| **6** | External COD provider abstraction | ✅ Complete |
| **7** | Automatic synchronization | ✅ Complete |
| **8** | Recommendations / objective optimization | ✅ Complete |

## Phase 1 — Foundation

- Normalized Prisma schema (identity, catalog, progress, matches, activity, objectives, OCR).
- Migration applied; NestJS modules for config, Prisma, Redis, storage, queue.
- Email/password auth with JWT access + rotating refresh tokens, password reset, profile.
- Row-level authorization guards; global response envelope; validation; rate limiting.
- Mobile: theme, API client, offline cache, auth context, 5-tab navigation + root stack.

## Phase 2 — Weapons & camos

- Weapons module: categories, levels, per-user level/XP progress, favourites, filters.
- Camos module: sets, camos, challenges, per-weapon progress, overview.
- Mobile: Weapons screen (search/filter/sort/favourites) + Weapon detail (camo challenges, levels).

## Phase 3 — Dashboard & activity

- Dashboard aggregation endpoint.
- Semantic activity feed ("Kilo 141 headshots increased from 72 to 84.").
- Objectives engine with unfinished + overlap detection.
- Mobile: Home dashboard, Challenges screen (unified camo/calling-card/event).

## Phase 4 — Screenshot / OCR

- Storage abstraction (S3-compatible / local fallback).
- OCR pipeline: preprocessing (sharp) → Tesseract → parsing → matching → confidence scoring.
- Auto-apply ≥95%, otherwise `AWAITING_CONFIRMATION` with confirm/edit; never regresses values.
- Mobile: Scanner screen (camera/gallery → detected changes → UPDATE PROGRESS / discard).

## Phase 5 — Calling cards & events

- Calling-cards module (cards, challenges, progress).
- Events module (challenges, rewards, progress, time-remaining, ending-soon).
- Mobile: Challenges integration, CallingCard detail, Event detail.

## Phase 6 — Provider abstraction

- `GameDataProvider` interface + `ProviderRegistry` + health monitoring.
- `MockProvider` (anchored to DB state), `ManualProvider`, `OcrProvider`, disabled `ActivisionProvider` stub.

## Phase 7 — Automatic synchronization

- BullMQ queues + workers (sync / ocr / notifications).
- 12-step incremental sync, diffing, exponential retry, rate limiting, caching.
- Non-destructive failure handling ("Last synchronized … ago."), never erases data.

## Phase 8 — Recommendations / optimization

- Overlap/optimization engine (one action advancing multiple objectives).
- Notification preferences (per-category toggles) + push-token registration.

## First build (fully functional on mock/seed data)

Delivered: project structure, PostgreSQL DB, migrations, auth, backend API, Expo mobile app,
navigation, dashboard, camo screen, weapon screen, challenges screen, profile screen, initial seed
data, mock COD provider, sync engine, activity feed — plus the screenshot scanner and detail screens.

## Known limitations & next steps

- **No live Activision integration.** The Activision provider is a deliberately disabled stub; the
  mock provider stands in so the product is fully functional today. A legitimate data source can be
  added behind the same interface without app changes.
- **Push notifications** require an EAS project id; in Expo Go the app degrades gracefully (no token,
  everything else works).
- **OCR accuracy** depends on screenshot quality; the confidence gate + confirm flow protects data.
- **Possible future work:** richer recommendations, more catalog content, analytics dashboards,
  localization, and a web admin UI on top of the existing admin API.
