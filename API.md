# API Reference

Base URL: `http://<host>:4100/api/v1`

All responses use a uniform envelope:

```jsonc
// success
{ "success": true, "data": { /* payload */ } }

// error
{ "success": false, "error": { "message": "…", "statusCode": 400 } }
```

Authenticated endpoints require `Authorization: Bearer <accessToken>`. User-specific endpoints are
scoped to the caller — you can only read/write your own data. Interactive docs are served at
`/docs` (Swagger UI).

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | public | Liveness + DB/Redis status + queue depths. |

## Auth — `/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | public | Create account. Body: `email, username, password, displayName?`. |
| POST | `/auth/login` | public | Returns `{ accessToken, refreshToken, user }`. |
| POST | `/auth/refresh` | public | Exchange refresh token for a new pair (rotating). |
| POST | `/auth/logout` | user | Revoke current refresh token. |
| POST | `/auth/logout-all` | user | Revoke all sessions. |
| POST | `/auth/forgot-password` | public | Begin password reset. |
| POST | `/auth/reset-password` | public | Complete reset with token. |
| POST | `/auth/change-password` | user | Change password (requires current). |
| GET | `/auth/me` | user | Current user. |
| PATCH | `/auth/me` | user | Update profile (displayName, etc.). |

## Profile & accounts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/profile` | user | Player profile + progression (level, prestige, XP). |
| GET | `/accounts` | user | Linked COD accounts. |
| GET | `/accounts/sync-status` | user | Per-account sync status + `lastSyncedAt`. |
| GET | `/accounts/providers` | user | Available data providers. |
| POST | `/accounts` | user | Link an account (no third-party password). |
| DELETE | `/accounts/:id` | user | Unlink an account. |

## Dashboard — `/dashboard`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/dashboard` | user | Aggregated payload: player summary, next objectives, weapon-level focus, calling-card + event status, recent activity, sync footer. |

## Weapons — `/weapons`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/weapons` | user | List with query filters (`category`, `search`, `sort`, `favourite`, pagination). |
| GET | `/weapons/categories` | user | Category summaries with weapon counts. |
| GET | `/weapons/:id` | user | Detail incl. levels, camo challenges, performance. |
| POST | `/weapons/:id/favourite` | user | Toggle favourite. |
| PATCH | `/weapons/:id/progress` | user | Manual progress update (`level?, xp?, kills?, headshots?`). |

## Camos — `/camos`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/camos/overview` | user | Overall + per-category completion. |
| GET | `/camos/sets` | user | Camo sets with camos and progress. |
| GET | `/camos/weapons/:weaponId` | user | Per-weapon camo challenges + progress. |
| PATCH | `/camos/progress/:challengeId` | user | Manual camo progress update. |

## Calling cards — `/calling-cards`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/calling-cards` | user | All calling cards with completion. |
| GET | `/calling-cards/:id` | user | Detail + challenges. |
| PATCH | `/calling-cards/challenges/:challengeId` | user | Manual progress update. |

## Events — `/events`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/events` | user | Active/all events with `timeRemaining` + completion. |
| GET | `/events/:id` | user | Detail + challenges + rewards. |
| PATCH | `/events/challenges/:challengeId` | user | Manual progress update. |

## Matches — `/matches`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/matches` | user | Paginated match history. |
| GET | `/matches/stats` | user | Aggregate stats (matches, wins, K/D, etc.). |
| GET | `/matches/recent-performance` | user | Recent form trend. |
| GET | `/matches/:id` | user | Match detail + weapon breakdown. |
| POST | `/matches` | user | Manually log a match. |

## Activity — `/activity`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/activity` | user | Semantic activity feed (paginated). |
| GET | `/activity/unread-count` | user | Unread count. |
| POST | `/activity/:id/read` | user | Mark one read. |
| POST | `/activity/read-all` | user | Mark all read. |

## Objectives — `/objectives`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/objectives` | user | Objectives (`?limit=`). |
| GET | `/objectives/overlaps` | user | Objectives that can advance together. |
| POST | `/objectives/recompute` | user | Recompute from current progress. |
| POST | `/objectives` | user | Create a personal objective. |
| PATCH | `/objectives/:id` | user | Update (status, target, etc.). |

## OCR — `/ocr`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/ocr/scan` | user | `multipart/form-data`: `image` file (≤12 MB) and/or `text`. Returns an `OcrScanView` with `detections`, `appliedCount`, `threshold`, `status`. |
| GET | `/ocr/scans` | user | Paginated scan history. |
| GET | `/ocr/scans/:id` | user | One scan. |
| POST | `/ocr/scans/:id/confirm` | user | Apply detections (optionally `{ detections }` to edit). |
| POST | `/ocr/scans/:id/reject` | user | Discard a scan. |

`OcrStatus`: `PENDING | PROCESSING | AWAITING_CONFIRMATION | REVIEW | APPLIED | REJECTED | FAILED`.

A detection looks like:

```jsonc
{
  "kind": "CAMO_PROGRESS",        // WEAPON_LEVEL | CAMO_PROGRESS | EVENT_PROGRESS | CALLING_CARD_PROGRESS | PLAYER_LEVEL
  "rawText": "Headshots 84/100",
  "weaponId": "…", "weaponName": "Kilo 141",
  "camoId": "…", "camoName": "Gold",
  "requirementType": "HEADSHOTS",
  "currentValue": 84, "targetValue": 100,
  "confidence": 0.98,
  "matched": true
}
```

## Sync — `/sync`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/sync` | user | Enqueue a sync run. |
| GET | `/sync/runs` | user | Recent sync runs + status. |
| GET | `/sync/providers/health` | user | Provider health. |
| GET | `/sync/queues` | user | Queue depths. |

## Notifications — `/notifications`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications/preferences` | user | Per-category preferences. |
| PATCH | `/notifications/preferences` | user | Body: `{ category, enabled }`. |
| POST | `/notifications/push-token` | user | Body: `{ token, platform? }`. |
| DELETE | `/notifications/push-token` | user | Body: `{ token }`. |

## Catalog — public

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/games` | public | Games. |
| GET | `/games/:slug` | public | Game detail. |
| GET | `/seasons` | public | Seasons. |

## Admin — `/admin` (role: ADMIN)

Protected CRUD so new content ships **without an app update**. Resources: `games`, `seasons`,
`weapons`, `weapon-levels`, `camo-sets`, `camos`, `camo-challenges`, `calling-cards`,
`calling-card-challenges`, `events`, `event-challenges`, `event-rewards`. Each supports
`POST` (create), `PATCH /:id` (update), `DELETE /:id` (delete). Plus:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/overview` | Catalog counts + health. |
| POST | `/admin/import` | Bulk import from structured JSON (seed format). |
