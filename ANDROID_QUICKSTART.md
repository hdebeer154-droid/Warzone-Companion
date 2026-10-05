# Run Warzone Companion on your Android phone

The backend is **already running in the cloud**, and the app is being served from a dev server
here too — so you only need your phone. No computer, no database, no coding.

The app now runs on **Expo SDK 57** (React Native 0.86, React 19, New Architecture).

---

## What you need

- An Android phone with internet (Wi‑Fi or mobile data).
- The free **Expo Go** app, updated to the latest version (it must support **SDK 57**).

---

## Step 1 — Install Expo Go

1. Open the **Google Play Store**.
2. Search for **Expo Go**.
3. Install it (publisher: *Expo Project*).

> Direct link: search "Expo Go" in the Play Store. If you already have it, open the Play Store
> page and tap **Update** so it supports SDK 57.

---

## Step 2 — Open the app in Expo Go

You have two ways to do this.

### Option A — Scan the QR code (easiest)

1. Put the QR code image (`expo-qr.png`, attached) on a **computer screen**, or open this chat
   on a computer.
2. Open **Expo Go** on your phone.
3. Tap **Scan QR code** (on the Home tab).
4. Point your phone at the QR code.

### Option B — Type the address manually (if you're reading this on the phone)

1. Open **Expo Go**.
2. Tap **Enter URL manually**.
3. Type exactly:

   ```
   exp://education-your-monitors-appreciated.trycloudflare.com
   ```

4. Tap **Connect**.

---

## Step 3 — Wait for the first load

The first time it loads, Expo Go downloads the app bundle (about 6 MB). This can take
**1–2 minutes** on a slower connection. You'll see a progress bar, then the **Warzone Companion**
login screen.

---

## Step 4 — Sign in

Use the demo account:

| Field    | Value                 |
|----------|-----------------------|
| Email    | `fenrir@warzone.gg`   |
| Password | `Fenrir#2025`         |

Or just tap the **"Use demo account (FENRIR)"** button on the login screen — it fills these in for you.

You'll land on the dashboard showing **FENRIR · Level 47 · Prestige 3 · 78%**, the Kilo 141 at
Level 38, camo progress, the active event, and your activity feed.

---

## What to try

- **HOME** — dashboard: next objectives, weapon level, calling card, event, activity feed.
- **CAMOS** — overall + per-category completion and camo sets.
- **WEAPONS** — search, filter, sort, and favourite weapons.
- **CHALLENGES** — all camo / calling-card / event challenges with filters.
- **PROFILE** — stats, connected accounts, sync status, notification settings.
- **SCAN PROGRESS** (button on the dashboard) — pick a screenshot; the app runs OCR and shows
  detected changes to confirm.

---

## Important notes

- **The backend is in the cloud, not on your phone.** The app talks to it over the internet, so you
  don't need to install anything else.
- **These tunnels are temporary.** They stay up while this session's server is running. If the app
  stops connecting later, just ask me to **restart the servers** and I'll give you a fresh QR code.
- **Troubleshooting:**
  - *"There was a problem loading the project"* → make sure you typed the `exp://` URL exactly, and
    that your phone has internet.
  - *"Project is incompatible with this version of Expo Go"* → update **Expo Go** from the Play Store
    (the app needs the SDK 57 build).
  - *Stuck on a white/blank screen* → force-close Expo Go and reopen the project.
  - *"Network request failed" after login* → the backend tunnel may have restarted; ask me to restart.
  - Make sure your phone and this session are both online (Expo Go needs to reach the dev server).

---

## Prefer to run everything yourself (optional, advanced)

If you want a permanent, self-hosted setup on your own computer:

1. Install **Node.js 20+**, **PostgreSQL 15+**, and **Redis**.
2. Get the `backend/` and `mobile/` folders from this project.
3. Backend:
   ```bash
   cd backend
   npm install
   npx prisma migrate deploy
   npm run db:seed
   npm run build && node dist/src/main.js     # API on http://<your-pc-ip>:4100
   ```
4. Mobile (in `mobile/.env`, set `EXPO_PUBLIC_API_BASE_URL=http://<your-pc-ip>:4100/api/v1`):
   ```bash
   cd mobile
   npm install
   npx expo start
   ```
5. Scan the QR that appears — your phone and PC must be on the **same Wi‑Fi**.

See `docs/SETUP.md` for the full version.
