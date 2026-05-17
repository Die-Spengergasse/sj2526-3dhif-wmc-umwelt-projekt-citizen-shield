# Citizen Shield

A community-powered crisis coordination platform that connects people in crisis regions with verified safety information, mutual aid resources, and real-time communication tools.

Built with React + Vite (frontend), Express + PostgreSQL (backend), and Firebase (authentication + real-time chat).

## Tech Stack

| Layer      | Technology                                                   |
|------------|--------------------------------------------------------------|
| Frontend   | React 19, TypeScript, Vite, inline CSS (warm editorial design) |
| Backend    | Express.js, PostgreSQL, Firebase Admin SDK                   |
| Auth       | Firebase Authentication (Google OAuth)                       |
| Chat       | Cloud Firestore (real-time)                                  |
| Storage    | Azure Blob Storage (image uploads)                           |
| Dev Tools  | Vite, tsx                                                    |

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- A Firebase project with Authentication (Google provider) and Firestore enabled
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
- creates the `citizen_shield` database and the `citizen_shield_admin` role
- grants full DDL + DML rights on current and future objects
- installs the required extensions (`pgcrypto`, `earthdistance`) — which require superuser
- creates all tables, enums, indexes, triggers, and seeds initial region data

Run it as the `postgres` superuser and pass the admin password via `-v`:

```bash
psql -h localhost -U postgres -v admin_password=DeinSicheresPasswort -f Backend/000_citizen_shield_complete.sql
```

Then put the same password into your `.env` file:

```
DATABASE_URL=postgres://citizen_shield_admin:<your_password>@localhost:5432/citizen_shield
```

> Re-running the script is safe: if the role or database already exists, the password is updated and ownership is re-applied.

> If you forget to pass `-v admin_password=...`, the script falls back to `CHANGE_ME_STRONG_PASSWORD` and prints a warning. Re-run with the real password to rotate it.

### 4. Configure Firebase (frontend)

Update `firebase-applet-config.json` with your Firebase project's web app config (from Firebase Console > Project Settings > General > Your apps > Web app).

### 5. Set up Firestore security rules

Deploy the included `firestore.rules` to your Firebase project:

```bash
firebase deploy --only firestore:rules
```

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

The Vite dev server automatically proxies `/api/*` requests to the backend on port 3001.

Open [http://localhost:3000](http://localhost:3000) in your browser.

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
│   ├── 000_citizen_shield_complete.sql            # One-shot: creates DB, role, permissions, extensions, schema, seed data
│   ├── db.ts                                      # PostgreSQL connection pool
│   ├── server.ts                                  # Express app entrypoint
│   ├── middleware/
│   │   └── auth.ts                                # Firebase token verification middleware
│   └── routes/
│       ├── auth.ts                                # POST /api/auth/sync, GET /api/auth/me
│       ├── regions.ts                             # GET /api/regions, GET /api/regions/:slug, POST /api/regions/:slug/join
│       ├── posts.ts                               # CRUD for community posts
│       ├── votes.ts                               # POST/GET /api/posts/:id/vote
│       ├── moderation.ts                          # GET /api/moderation, POST /api/moderation/:id/review
│       └── upload.ts                              # POST /api/upload/image (Azure Blob)
├── src/
│   ├── main.tsx                                   # App entrypoint with AuthProvider
│   ├── App.tsx                                    # Root component — real auth + view routing
│   ├── api.ts                                     # Authenticated fetch helper + API wrappers
│   ├── firebase.ts                                # Firebase client SDK init
│   ├── types.ts                                   # TypeScript interfaces (Post, Region, AppUser …)
│   ├── design-tokens.ts                           # S palette, INTENSITY, REGION_COORDS
│   ├── motion.tsx                                 # Reveal, CountUp, Skeleton, Toaster, LiveDot …
│   ├── index.css                                  # Global CSS + keyframe animations
│   ├── context/
│   │   └── AuthContext.tsx                        # Global auth state (Firebase + backend sync)
│   ├── components/
│   │   ├── Wordmark.tsx                           # Shield logo + logotype
│   │   ├── TopNav.tsx                             # Top navigation with notifications + auth UI
│   │   ├── Sidebar.tsx                            # No-op (navigation is in TopNav)
│   │   ├── BottomNav.tsx                          # Mobile bottom navigation (5 views)
│   │   ├── LiveTicker.tsx                         # Fixed newsroom tape (region signals)
│   │   ├── SignInModal.tsx                        # Google sign-in overlay
│   │   ├── Chat.tsx                               # Local-state per-region chat panel
│   │   ├── PostForm.tsx                           # 2-step submit community report modal
│   │   ├── TimelineItem.tsx                       # Post card with vote + pin + VoterPopover
│   │   ├── RegionSelector.tsx                     # Region picker overlay
│   │   ├── RegionMapCard.tsx                      # Leaflet map inset (CartoDB tiles)
│   │   └── ActionButton.tsx                       # Bordered action button with hover slide
│   └── views/
│       ├── HubView.tsx                            # Global hub — stats, region grid, resources
│       ├── FeedView.tsx                           # Region feed with filter tabs + sidebar
│       ├── SafetyView.tsx                         # Safety protocols + emergency contact
│       ├── RegionsView.tsx                        # Region carousel + timeline + map sidebar
│       ├── CommunityView.tsx                      # Pinned posts + DiscussionDrawer
│       └── GlobeView.tsx                          # Three.js interactive globe (topojson land)
├── firebase-applet-config.json                    # Firebase web app config
├── firebase-blueprint.json                        # Firebase project blueprint
├── firestore.rules                                # Firestore security rules
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
- **Moderation** — Queue for flagged posts, moderator-only access, approve/reject workflow that updates post status
- **Distance-based moderation** — Posts whose user-supplied GPS is more than 5 km from the region center are auto-flagged as `pending_review` and inserted into `moderation_queue` (uses the `earthdistance` extension and the seeded `regions.center_lat` / `center_lng`)
- **Image upload** — Multipart upload to Azure Blob Storage with file type validation (JPEG, PNG, WebP) and 10 MB limit; images are run through `sharp` to apply EXIF orientation and strip all metadata (incl. GPS) before upload
- **Database** — Full PostgreSQL schema with enums, foreign keys, indexes, triggers for `updated_at` and vote count sync, audit trail for verification badges

### Frontend (React)

- **Google authentication** — Global `AuthContext` with Firebase Google OAuth, automatic backend sync on login, sign-in/sign-out UI in TopNav (dropdown with user stats + verification badge)
- **Warm editorial design** — Full design migration from prototype: paper palette (`#f0e9da`/`#fbf7ec`), Instrument Serif headlines, Plus Jakarta Sans body, JetBrains Mono mono, warm-sepia CSS filters
- **Design tokens** — `src/design-tokens.ts` exports `S` (colour palette), `INTENSITY` (per-level colours + tones), `REGION_COORDS` (Leaflet fallback positions)
- **Motion library** — `src/motion.tsx` exports `Reveal`, `CountUp`, `Skeleton`, `AmbientGlow`, `IntensityRing`, `LiveDot`, `Toaster` + `showToast`, `useNow`, `parseRelative`, `formatRelative`
- **Six views** — Hub (network stats + region grid), Globe (Three.js interactive Earth), Regions (carousel + community tools + Leaflet map), Feed (filtered timeline), Safety (protocols + resources), Community (pinned posts + DiscussionDrawer)
- **Interactive globe** — Three.js sphere with topojson-derived continent point-cloud, orbit controls with auto-rotate, crisis-pin raycasting, click-to-navigate to Regions view
- **Community features** — Pin posts to regional discussion boards, DiscussionDrawer with threaded comments (local state), optimistic voting with background API call
- **Live ticker** — Fixed newsroom tape below TopNav showing region signals in real time
- **Responsive layout** — Desktop top nav, mobile 5-item bottom nav
- **Notifications** — Bell dropdown with live relative timestamps (via `useNow`), mark-read per item or all
- **Inline CSS** — All components use `style={{}}` props; only utility CSS classes (`.lift`, `.warm-pulse`, `.cs-drawer-in`, `.cs-ticker-scroll`, `.reveal-fade`, etc.) come from `index.css`

## What Needs to Be Implemented

### Next up (highest priority)

- [ ] **Geolocation capture in `PostForm`** — call `navigator.geolocation.getCurrentPosition` and pass `locationLat` / `locationLng` to `POST /api/posts`. **This is the missing piece that makes the existing distance-based moderation actually fire** — without GPS from the client, every post still goes live.
- [ ] **Seed data for safe zones and resources** — `region_safe_zones` and `region_resources` are empty, so the region detail panels render blank lists.
- [ ] **Moderation dashboard UI** — backend endpoints (`GET /api/moderation`, `POST /api/moderation/:id/review`) are done; a moderator-only view in the frontend is the next step so flagged posts can actually be reviewed.

### Frontend — New Features

- [ ] **URL routing** — Add `react-router-dom` for real navigation (bookmarkable URLs, browser back/forward); `App.tsx` currently switches views via a `currentView` string.
- [ ] **User profile page** — Display user info, verification badge, post history (backend already has `GET /api/auth/me`).
- [ ] **Error handling** — Toast notifications for failed API calls, error boundaries; today failures only `console.error`.
- [ ] **Search and filtering** — Post filtering by type / tag in the feed view.
- [ ] **Wire dead action buttons** — "Request Emergency Aid" and "Volunteer for Local Hub" in `App.tsx` have no `onClick` yet.
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

- [x] **Full design migration** — All 12 prototype files in `src/design-import/` integrated and deleted
- [x] **Design tokens** — `src/design-tokens.ts` (S palette, INTENSITY, REGION_COORDS)
- [x] **Motion library** — `src/motion.tsx` (Reveal, CountUp, Skeleton, IntensityRing, Toaster…)
- [x] **All components rewritten** — Wordmark, TopNav, BottomNav, LiveTicker, SignInModal, Chat, PostForm, TimelineItem, RegionSelector, RegionMapCard, ActionButton
- [x] **All views rewritten** — HubView, FeedView, SafetyView, RegionsView, CommunityView, GlobeView
- [x] **App.tsx rewrite** — Real Firebase auth, real API calls, optimistic votes, all 6 views, notifications
- [x] Fetch regions / region detail / posts from the API
- [x] Submit posts via `POST /api/posts` with optimistic fallback
- [x] Vote buttons wired to `POST /api/posts/:id/vote` (optimistic local + background call)
- [x] File-upload image picker in `PostForm` via `POST /api/upload/image`
- [x] "Offer Support" button wired to `POST /api/regions/:slug/join`
- [x] EXIF stripping via `sharp` in the upload route
- [x] Distance-based moderation (`earthdistance` + `moderation_queue` insert) in the posts route
- [x] `regions.center_lat` / `center_lng` columns and seed data for the 5 regions
- [x] Deleted `src/data.ts`, `src/constants.ts`, `src/design-import/`
