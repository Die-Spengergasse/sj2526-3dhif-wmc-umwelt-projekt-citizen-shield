# Citizen Shield

A community-powered crisis coordination platform that connects people in crisis regions with verified safety information, mutual aid resources, and real-time communication tools.

Built with React + Vite (frontend), Express + PostgreSQL (backend), and Firebase (authentication).

## Tech Stack

| Layer      | Technology                                                   |
|------------|--------------------------------------------------------------|
| Frontend   | React 19, TypeScript, Vite, wouter (routing), inline CSS (warm editorial design), `exifr` (client-side GPS extraction) |
| Backend    | Express.js, PostgreSQL, Firebase Admin SDK, `ws` (WebSocket server for realtime updates) |
| Auth       | Firebase Authentication (Google OAuth)                       |
| Storage    | Azure Blob Storage (image uploads)                           |
| Dev Tools  | Vite, tsx                                                    |

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- A Firebase project with Authentication (Google provider) enabled
- An Azure Storage account with a blob container (for image uploads)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

- `DATABASE_URL` — PostgreSQL connection string
- `PORT` — Backend API port (default: `3001`)
- `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` — Firebase Admin SDK credentials (from Firebase Console > Project Settings > Service Accounts > Generate new private key)
- `AZURE_STORAGE_CONNECTION_STRING`, `AZURE_STORAGE_CONTAINER` — Azure Blob Storage credentials

### 3. Set up the database

You only need `psql` and access to the PostgreSQL superuser (typically `postgres`).

`Backend/000_citizen_shield_complete.sql` is fully self-contained and idempotent. In a single pass it:
- creates the `citizen_shield` database and the `citizen_shield_user` role
- grants full DDL + DML rights on current and future objects
- installs the required extensions (`pgcrypto`, `earthdistance`) — which require superuser
- creates all tables, enums, indexes, triggers, and seeds initial region data
- creates the `notifications` table and its indexes (no separate script needed)

Run it as the `postgres` superuser:

```bash
psql -h localhost -U postgres -f Backend/000_citizen_shield_complete.sql
```

By default this creates the role `citizen_shield_user` with the password `citizen_shield`. That matches the connection string used everywhere else in this guide, so for local development no extra flags are required.

If you want a different password (recommended for anything beyond local dev), pass it via `-v`:

```bash
psql -h localhost -U postgres -v admin_password=YourStrongPassword -f Backend/000_citizen_shield_complete.sql
```

Then put the matching credentials into your `.env`:

```
DATABASE_URL=postgres://citizen_shield_user:citizen_shield@localhost:5432/citizen_shield
```

Re-running the script is safe: if the role or database already exists, the password is updated and ownership is re-applied. The script also sets `is_admin = TRUE` for the 4 team email addresses (idempotent `UPDATE` — safe to re-run after new team members log in).

### 4. Configure Firebase (frontend)

Update `firebase-applet-config.json` with your Firebase project's web app config (from Firebase Console > Project Settings > General > Your apps > Web app).

## Team Collaboration

After every `git pull`, run the setup script once to apply any new schema changes:

```bash
psql -h localhost -U postgres \
  -v admin_password=YourPassword \
  -f Backend/000_citizen_shield_complete.sql
```

The script is fully idempotent — all tables, enums, indexes, triggers, constraints, and seed data use `IF NOT EXISTS` / `ON CONFLICT DO NOTHING`. Admin emails are set automatically. No separate migration files, no manual `ALTER TABLE` needed.

## Running the Project

You need two terminals — one for the frontend dev server and one for the backend API.

**Terminal 1 — Frontend (Vite dev server on port 3000):**

```bash
npm run dev
```

**Terminal 2 — Backend (Express API on port 3001):**

```bash
npm run server:dev
```

The Vite dev server automatically proxies both `/api/*` (HTTP) and `/ws` (WebSocket, used by the realtime sync layer) to the backend on port 3001.

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Exposing the Dev Server with ngrok

You can share your local dev server over the internet (e.g. to test on a phone or show it to a teammate) using [ngrok](https://ngrok.com/). The free plan is enough.

**Only port 3000 needs to be forwarded** — the Vite dev server proxies `/api/*` to the backend on `3001` internally, so a single tunnel covers both. `vite.config.ts` already allows `*.ngrok-free.app`, `*.ngrok-free.dev`, `*.ngrok.io`, and `*.ngrok.app` hosts.

### 1. Configure ngrok

Edit `~/.config/ngrok/ngrok.yml`:

```yaml
version: "3"
agent:
    authtoken: YOUR_NGROK_TOKEN
tunnels:
  frontend:
    proto: http
    addr: 3000
```

Indentation must be exactly as shown (no leading spaces on `tunnels:`).

### 2. Start everything

```bash
npm run dev          # Terminal 1 — frontend on 3000
npm run server:dev   # Terminal 2 — backend on 3001
ngrok start frontend # Terminal 3 — public tunnel
```

ngrok will print a `https://<random>.ngrok-free.dev` URL — that's your public address.

### 3. Authorise the ngrok domain in Firebase

Google OAuth will reject sign-in until the ngrok host is allowlisted:

1. [Firebase Console](https://console.firebase.google.com/) → your project → **Authentication** → **Settings** → **Authorized domains**
2. **Add domain** → paste the ngrok host (e.g. `merlene-unvertebrate-gelidly.ngrok-free.dev`) → Save

**Note:** the free ngrok plan gives you a new random subdomain on every restart, so you'll need to re-add it each session. To avoid this, claim a [static domain](https://dashboard.ngrok.com/domains) (free tier includes one) and start with `ngrok http --url=your-static-name.ngrok-free.app 3000` — then you only authorise it in Firebase once.

## Permanent Free Hosting (no laptop required)

ngrok only works while your machine is on. For a truly always-on permanent URL, deploy each piece to a free host. All three providers below have WebSocket support, which is required for the realtime layer (`/ws`).

| Piece               | Provider          | Free tier                                    | Permanent URL                    |
|---------------------|-------------------|----------------------------------------------|----------------------------------|
| Frontend (static)   | Vercel / Netlify  | Unlimited static deploys                     | `yourapp.vercel.app`             |
| Backend (Express)   | Render / Fly.io   | 750 hrs/mo (Render Web Service, free)        | `yourapp-api.onrender.com`       |
| PostgreSQL          | Neon              | 0.5 GB storage, always-on                    | `ep-foo.neon.tech`               |

### 1. Move Postgres to Neon

1. Sign up at [neon.tech](https://neon.tech) → create a project → copy the connection string.
2. Apply the schema once: `psql "postgresql://...neon.tech/citizen_shield?sslmode=require" -f Backend/000_citizen_shield_complete.sql`.
3. Update your local `.env` (and later the Render env vars) with the new `DATABASE_URL`.

### 2. Deploy the backend to Render

1. Push this repo to GitHub.
2. [Render dashboard](https://dashboard.render.com/) → **New +** → **Web Service** → connect the repo.
3. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `npx tsx Backend/server.ts`
   - **Environment:** add every variable from your `.env` (`DATABASE_URL`, `FIREBASE_*`, `AZURE_*`, `APP_URL`).
   - Set `APP_URL` to your future frontend URL (e.g. `https://yourapp.vercel.app`) — this is the CORS allow-origin.
4. Render will give you `https://yourapp-api.onrender.com`. WebSocket frames work on the same host at `/ws` automatically (Render upgrades HTTP to WS on Web Services).

### 3. Deploy the frontend to Vercel

Vercel doesn't run the Vite dev-server proxy, so the frontend has to hit the backend by absolute URL. Add an env-var-driven base URL:

1. In `src/api.ts`, replace the hard-coded `/api/...` paths with `${import.meta.env.VITE_API_BASE ?? ''}/api/...`. Do the same for the WebSocket URL in `src/realtime.ts` — when `VITE_API_BASE` is set, build the WS URL from it (`https://...` → `wss://...`).
2. Push, then on [vercel.com](https://vercel.com): **Add New Project** → import the repo.
3. Framework preset: **Vite**. Build command and output dir are auto-detected.
4. Set the env var `VITE_API_BASE = https://yourapp-api.onrender.com` in **Project Settings → Environment Variables**.
5. Deploy. You get `https://yourapp.vercel.app`.

### 4. Wire it together

1. Update Render's `APP_URL` to the final Vercel URL (CORS).
2. [Firebase Console](https://console.firebase.google.com/) → **Authentication → Settings → Authorized domains** → add `yourapp.vercel.app`.
3. Open `https://yourapp.vercel.app`. Sign-in, posts, votes, comments, moderation, and the WebSocket-driven live updates should all work without your laptop running.

**Note on Render's free tier:** the service sleeps after ~15 min of inactivity and takes ~30 s to wake on the first request. For a class demo or a 24/7 deployment, upgrade to a paid plan or switch to Fly.io's "always-on" small VM (also free for tiny workloads).

## Available Scripts

| Command              | Description                                     |
|----------------------|-------------------------------------------------|
| `npm run dev`        | Start Vite dev server (port 3000)               |
| `npm run server:dev` | Start Express API with hot reload (port 3001)   |
| `npm run server`     | Start Express API without hot reload            |
| `npm run build`      | Build frontend for production                   |
| `npm run preview`    | Preview production build locally                |
| `npm run lint`       | Type-check with TypeScript (`tsc --noEmit`)     |
| `npm run clean`      | Remove `dist/` folder                           |

## Project Structure

```
├── Backend/
│   ├── 000_citizen_shield_complete.sql            # One-shot: creates DB, role, permissions, extensions, schema (incl. notifications), seed data
│   ├── db.ts                                      # PostgreSQL connection pool
│   ├── server.ts                                  # Express app entrypoint — also creates the HTTP server that the WebSocket server attaches to
│   ├── ws.ts                                      # WebSocket server (/ws) — Firebase-auth on connect, topic subscriptions, heartbeat
│   ├── events.ts                                  # Typed emitters routes call after writes (post:created, vote:changed, comment:created, notification:created, …)
│   ├── middleware/
│   │   └── auth.ts                                # Firebase token verification + requireAdmin middleware
│   └── routes/
│       ├── auth.ts                                # POST /api/auth/sync, GET /api/auth/me
│       ├── regions.ts                             # GET /api/regions, GET /api/regions/:slug, POST /api/regions/:slug/join (emits region:membership_changed)
│       ├── posts.ts                               # CRUD for community posts (emits moderation:changed on submit, post:deleted on delete)
│       ├── votes.ts                               # POST/GET /api/posts/:id/vote (emits vote:changed)
│       ├── comments.ts                            # GET/POST /api/posts/:id/comments (emits comment:created)
│       ├── moderation.ts                          # GET /api/moderation, POST /api/moderation/:id/review (emits moderation:changed, post:created on approve, notification:created)
│       ├── notifications.ts                       # GET /api/notifications, POST /api/notifications/:id/read, POST /api/notifications/read-all
│       └── upload.ts                              # POST /api/upload/image (Azure Blob)
├── src/
│   ├── main.tsx                                   # App entrypoint with AuthProvider + RealtimeProvider
│   ├── App.tsx                                    # Root component — wouter Router, real auth, view routing, subscribes to posts:<slug> + user:<id> realtime topics
│   ├── api.ts                                     # Authenticated fetch helper + API wrappers
│   ├── firebase.ts                                # Firebase client SDK init (Auth only)
│   ├── realtime.ts                                # WebSocket client — module-level singleton, auto-reconnect with backoff, topic re-subscribe on reconnect, reauth() for sign-in/out
│   ├── types.ts                                   # TypeScript interfaces (Post, Region, AppUser …)
│   ├── design-tokens.ts                           # S palette, INTENSITY, REGION_COORDS
│   ├── motion.tsx                                 # Reveal, CountUp, Skeleton, Toaster, LiveDot …
│   ├── index.css                                  # Global CSS + keyframe animations (incl. hidden-scrollbar overflow for the squircle nav pills)
│   ├── context/
│   │   ├── AuthContext.tsx                        # Global auth state (Firebase + backend sync)
│   │   └── RealtimeContext.tsx                    # WebSocket provider + useRealtimeTopic(topic, handler) hook
│   ├── components/
│   │   ├── Wordmark.tsx                           # Shield logo + logotype
│   │   ├── TopNav.tsx                             # Top navigation with notifications + auth UI (wouter)
│   │   ├── Sidebar.tsx                            # No-op (navigation is in TopNav)
│   │   ├── BottomNav.tsx                          # Mobile bottom navigation — 4 routes + Review (admin-only) (wouter)
│   │   ├── SignInModal.tsx                        # Google sign-in overlay
│   │   ├── PostForm.tsx                           # 2-step submit community report modal
│   │   ├── TimelineItem.tsx                       # Post card with vote + VoterPopover; title/desc navigate to /post/:id
│   │   ├── RegionSelector.tsx                     # Region picker overlay
│   │   └── ActionButton.tsx                       # Bordered action button with hover slide
│   └── views/
│       ├── HubView.tsx                            # / — Global hub: stats, region grid, resources
│       ├── FeedView.tsx                           # /feed — Region feed with filter tabs + sidebar
│       ├── SafetyView.tsx                         # /safety — Safety protocols + emergency contact
│       ├── RegionsView.tsx                        # /regions — Region carousel + timeline + map sidebar
│       ├── ModerationView.tsx                     # /moderation — Admin-only review queue with inline reason/note fields
│       └── PostDetailView.tsx                     # /post/:id — Twitter-style post overlay with comments
├── firebase-applet-config.json                    # Firebase web app config
├── vite.config.ts                                 # Vite config with API proxy
├── tsconfig.json                                  # TypeScript config
└── package.json
```

## What Is Implemented

### Backend (Express API)

- **Authentication** — Firebase token verification middleware (`verifyToken`, `optionalToken`), user sync endpoint that upserts users in PostgreSQL on login, profile endpoint with verification stats
- **Regions** — List all regions (sorted by intensity), get region details with safe zones and resources, join a region, get member counts
- **Posts** — Create posts with location blurring (~1 km precision), list posts with filtering (by region, status, tag), get single post, delete posts (author or moderator)
- **Voting** — Upvote/downvote with upsert logic, vote removal, DB triggers that auto-sync denormalized counts
- **Moderation** — Queue for flagged posts, admin-only access (`requireAdmin` middleware), approve/reject workflow that updates post status and sends a notification to the post author (with optional reason/note)
- **Admin roles** — 4 hardcoded team email addresses are auto-promoted to admin on login via `auth/sync`; `is_admin` flag is exposed on `/api/auth/me` and enforced server-side by `requireAdmin`
- **Notifications** — Per-user notification feed for post approval/rejection; endpoints to fetch, mark single read, mark all read
- **Distance-based moderation** — Posts whose user-supplied GPS is more than 5 km from the region center are auto-flagged as `pending_review` and inserted into `moderation_queue` (uses the `earthdistance` extension and the seeded `regions.center_lat` / `center_lng`)
- **Image upload** — Multipart upload to Azure Blob Storage with file type validation (JPEG, PNG, WebP) and 10 MB limit; images are run through `sharp` to apply EXIF orientation and strip all metadata (incl. GPS) before upload
- **Realtime WebSocket layer** — `ws` server mounted at `/ws` on the same HTTP server as Express; Firebase ID-token auth on connect; topic-based subscriptions: `posts:<regionSlug>`, `post:<postId>`, `user:<dbUserId>`, `moderation`; per-topic permission check (admins for `moderation`, self-only for `user:*`, public for post/region topics); 30-second heartbeat drops dead clients; routes emit events through `Backend/events.ts` after every write so subscribed clients refetch the affected slice
- **Database** — Full PostgreSQL schema with enums, foreign keys, indexes, triggers for `updated_at` and vote count sync, audit trail for verification badges, `notifications` table

### Frontend (React)

- **URL routing** — `wouter` provides real browser history routing; Back/Forward work correctly; `/post/:id` opens as an overlay while preserving the background view
- **Google authentication** — Global `AuthContext` with Firebase Google OAuth, automatic backend sync on login, sign-in/sign-out UI in TopNav (dropdown with user stats + verification badge)
- **Warm editorial design** — Full design migration from prototype: paper palette (`#f0e9da`/`#fbf7ec`), Instrument Serif headlines, Plus Jakarta Sans body, JetBrains Mono mono, warm-sepia CSS filters
- **Design tokens** — `src/design-tokens.ts` exports `S` (colour palette), `INTENSITY` (per-level colours + tones), `REGION_COORDS` (Leaflet fallback positions)
- **Motion library** — `src/motion.tsx` exports `Reveal`, `CountUp`, `Skeleton`, `AmbientGlow`, `IntensityRing`, `LiveDot`, `Toaster` + `showToast`, `useNow`, `parseRelative`, `formatRelative`
- **Five views** — Hub (`/`), Regions (`/regions?region=<slug>`), Feed (`/feed`), Safety (`/safety`), Moderation (`/moderation`)
- **Post detail overlay** — `/post/:id` renders as a portal over the current view (Twitter/X style): full post, comment input (Enter to send), comment list oldest-first; closes on Escape, X, or backdrop click; title/description in feed cards navigate here
- **Moderation UI** — Inline reason textarea for reject (required), optional note for approve; decision sent to API which notifies the post author
- **Admin-only Moderation Tab** — `/moderation` route and the Review nav item are only visible to the 4 team email addresses (`user.isAdmin` guard in `TopNav`, `BottomNav`, and `ModerationView`)
- **Real notifications** — Bell dropdown fetches from `/api/notifications`; mark-read per item or all; unread count badge; relative timestamps via `useNow`
- **Realtime sync over WebSocket** — `src/realtime.ts` is a module-level singleton so it's alive before any React effect runs (fixing the timing bug where early subscriptions silently no-op'd). `RealtimeContext` exposes `useRealtimeTopic(topic, handler)`. App.tsx subscribes to `posts:<activeRegion.slug>` (refetches the feed on any event) and `user:<dbUserId>` (refetches notifications + region membership). PostDetailView subscribes to `post:<id>` (live comments + vote-count updates). ModerationView subscribes to `moderation` (admins only). Auto-reconnect with exponential backoff, re-authenticates and re-subscribes after reconnect, outbox queues frames during reconnect, `client.reauth()` is called on sign-in/out without tearing down the socket.
- **Image location capture** — `PostForm` reads GPS from uploaded photos client-side using `exifr` before they're sent to the backend (the server strips EXIF on upload, so this has to happen in the browser). If no image has GPS, the form auto-prompts `navigator.geolocation.getCurrentPosition()` once per session (silent on denial) and shows a `Use my current location` button as a manual retry. Falls back to the manual Nominatim autocomplete. A source badge shows "From photo" / "Device location" / "GPS set". Coords are blurred to ~1 km by the backend before publishing (`Backend/routes/posts.ts:184-185`).
- **Squircle nav overflow** — both the desktop top-nav pill and the mobile bottom nav scroll horizontally inside their rounded container instead of poking out; the scrollbar is hidden cross-browser (`scrollbar-width: none` + `::-webkit-scrollbar { display: none }`).
- **Community/Chat removed** — `CommunityView`, `Chat`, and Firebase Firestore are no longer part of the app
- **Responsive layout** — Desktop top nav, mobile bottom nav (extra Review tab when the signed-in user is an admin)
- **Inline CSS** — All components use `style={{}}` props; only utility CSS classes come from `index.css`

## What Needs to Be Implemented

### Next up (highest priority)

- [ ] **Tests for the realtime layer** — none of the WebSocket flow is covered yet; add an integration test that asserts vote/comment/moderation events propagate to a second client.

### Frontend — New Features

- [ ] **User profile page** — Display user info, verification badge, post history (backend already has `GET /api/auth/me`).
- [ ] **Error handling** — Toast notifications for failed API calls, error boundaries; today failures only `console.error`.
- [ ] **Search and filtering** — Post filtering by type / tag in the feed view.
- [ ] **Footer links** — currently all `href="#"`.

### Backend — Missing Logic

- [ ] **Verification stats recalculation** — Implement periodic or event-driven recalculation of `user_verification_stats` (qualifying posts, badge eligibility).
- [ ] **Input validation** — Validate title length (5–200 chars) and description length (10–2000 chars) in the posts route before hitting DB constraints.
- [ ] **Rate limiting** — Add rate limiting middleware to prevent abuse.

### Infrastructure

- [ ] **Tests** — No test files exist yet; add unit and integration tests.
- [ ] **CI/CD** — Set up a pipeline for linting, testing, and deployment.
- [ ] **Production build for backend** — Currently runs via `tsx`; add a proper `tsc` build step for production.

### Recently completed

- [x] **Realtime WebSocket sync** — `Backend/ws.ts` + `Backend/events.ts` server-side, `src/realtime.ts` + `src/context/RealtimeContext.tsx` client-side; feed, votes, comments, moderation queue, and notifications all propagate live without polling. Singleton client + `reauth()` so subscriptions made during initial render actually register.
- [x] **Image location capture** — `exifr`-based EXIF GPS extraction in `PostForm` with a one-time geolocation auto-prompt + manual button as fallback; replaces the previous "no GPS ever sent from client" gap that made distance-based moderation a no-op.
- [x] **Squircle nav overflow** — `cs-topnav-items` and `cs-nav-mobile` now scroll horizontally with a hidden scrollbar instead of letting items poke out of the rounded container.
- [x] **Admin role system** — 4 hardcoded team emails, auto-set on login via `auth/sync`, enforced by `requireAdmin` middleware
- [x] **Notifications system** — `post_approved` / `post_rejected` notifications with bell UI
- [x] **PostDetailView overlay** — Twitter/X-style detail view with comments
- [x] **URL routing with wouter** — Real browser history, Back/Forward, bookmarkable URLs; `/post/:id` overlay pattern
- [x] **Community/Chat/Firestore removed** — `CommunityView`, `Chat`, and Firebase Firestore deleted
- [x] **DB fully restructured and idempotent** — Single `000_citizen_shield_complete.sql` (11 sections), safe to re-run after every `git pull`
- [x] **Seed data for safe zones and resources** — All 5 regions have safe zones and resources seeded idempotently
- [x] **Moderation UI** — Inline reason/note fields; reject requires a reason; author is notified via API
- [x] **Full design migration** — All 12 prototype files in `src/design-import/` integrated and deleted
- [x] **Design tokens** — `src/design-tokens.ts` (S palette, INTENSITY, REGION_COORDS)
- [x] **Motion library** — `src/motion.tsx` (Reveal, CountUp, Skeleton, IntensityRing, Toaster…)
- [x] **All components rewritten** — Wordmark, TopNav, BottomNav, SignInModal, PostForm, TimelineItem, RegionSelector, ActionButton
- [x] **All views rewritten** — HubView, FeedView, SafetyView, RegionsView, ModerationView, PostDetailView, GlobeView
- [x] **App.tsx rewrite** — Real Firebase auth, real API calls, optimistic votes, wouter routing
- [x] Fetch regions / region detail / posts from the API
- [x] Submit posts via `POST /api/posts` with optimistic fallback
- [x] Vote buttons wired to `POST /api/posts/:id/vote` (optimistic local + background call)
- [x] File-upload image picker in `PostForm` via `POST /api/upload/image`
- [x] "Offer Support" button wired to `POST /api/regions/:slug/join`
- [x] EXIF stripping via `sharp` in the upload route
- [x] Distance-based moderation (`earthdistance` + `moderation_queue` insert) in the posts route
- [x] `regions.center_lat` / `center_lng` columns and seed data for the 5 regions
- [x] Deleted `src/data.ts`, `src/constants.ts`, `src/design-import/`
