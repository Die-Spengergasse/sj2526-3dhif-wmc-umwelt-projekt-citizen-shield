# Citizen Shield

A community-powered crisis coordination platform that connects people in crisis regions with verified safety information, mutual aid resources, and real-time communication tools.

Built with React + Vite (frontend), Express + PostgreSQL (backend), and Firebase (authentication + real-time chat).

## Tech Stack

| Layer      | Technology                                                   |
|------------|--------------------------------------------------------------|
| Frontend   | React 19, TypeScript, Tailwind CSS v4, Framer Motion         |
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
│   ├── App.tsx                                    # Root component with view routing
│   ├── api.ts                                     # Authenticated fetch helper
│   ├── firebase.ts                                # Firebase client SDK init
│   ├── types.ts                                   # TypeScript interfaces (Post, Region)
│   ├── data.ts                                    # Hardcoded seed data (for frontend)
│   ├── constants.ts                               # Animation variants
│   ├── index.css                                  # Tailwind config + theme
│   ├── context/
│   │   └── AuthContext.tsx                        # Global auth state (Firebase + backend sync)
│   ├── components/
│   │   ├── TopNav.tsx                             # Top navigation with auth UI
│   │   ├── Sidebar.tsx                            # Desktop sidebar navigation
│   │   ├── BottomNav.tsx                          # Mobile bottom navigation
│   │   ├── Chat.tsx                               # Real-time Firestore chat
│   │   ├── PostForm.tsx                           # Submit community report modal
│   │   ├── TimelineItem.tsx                       # Single post in timeline
│   │   └── RegionSelector.tsx                     # Region picker modal
│   └── views/
│       ├── HubView.tsx                            # Global hub overview
│       ├── FeedView.tsx                           # Region-specific post feed
│       └── SafetyView.tsx                         # Safety protocols + resources
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

- **Google authentication** — Global `AuthContext` with Firebase Google OAuth, automatic backend sync on login, sign-in/sign-out UI in TopNav (with dropdown showing user stats) and Sidebar
- **Region carousel** — Browse 5 crisis regions with animated transitions, stats cards (intensity, hubs, connectivity), emergency contacts, safe zones, resources
- **Timeline feed** — Chronological post display per region with type indicators (critical, info, broadcast), images, and tags
- **Post form** — Modal to submit community reports with type selector, title, description, and image URL
- **Real-time chat** — Per-region Firestore chat with Google auth, message bubbles, user avatars
- **Multiple views** — Hub (global overview), Regions (country timelines), Feed (filtered posts), Safety (protocols + guides)
- **Responsive layout** — Desktop sidebar + top nav, mobile bottom nav
- **Animations** — Page transitions, carousel, hover effects via Framer Motion

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

- [x] Fetch regions / region detail / posts from the API (`App.tsx`)
- [x] Submit posts via `POST /api/posts` (`PostForm` → `App.tsx#handleNewPost`)
- [x] Vote buttons on `TimelineItem` wired to `POST /api/posts/:id/vote`
- [x] File-upload image picker in `PostForm` via `POST /api/upload/image`
- [x] "Offer Support" button wired to `POST /api/regions/:slug/join`
- [x] Loading spinners while posts/regions are fetched
- [x] EXIF stripping via `sharp` in the upload route
- [x] Distance-based moderation (`earthdistance` + `moderation_queue` insert) in the posts route
- [x] `regions.center_lat` / `center_lng` columns and seed data for the 5 regions
