-- ============================================================
-- CITIZEN SHIELD – Migration 001
-- Safe Zones, Resources, Pins, Comments, Multi-Image
-- Idempotent: uses IF NOT EXISTS / exception handlers
-- Run as: psql -U postgres -d citizen_shield -f 001_...sql
-- ============================================================

-- ============================================================
-- 1. ADD images[] COLUMN TO posts (Task 4)
-- ============================================================
ALTER TABLE posts ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Migrate existing single image_url into images array
UPDATE posts
SET images = ARRAY[image_url]
WHERE image_url IS NOT NULL
  AND (images IS NULL OR images = '{}');


-- ============================================================
-- 2. TABLE: pinned_posts (Task 8)
-- ============================================================
CREATE TABLE IF NOT EXISTS pinned_posts (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id     UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  region_slug TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_pinned_posts_user ON pinned_posts (user_id);


-- ============================================================
-- 3. TABLE: post_comments (Task 9)
-- ============================================================
CREATE TABLE IF NOT EXISTS post_comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text       TEXT        NOT NULL CHECK (char_length(text) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments (post_id, created_at);


-- ============================================================
-- 4. UNIQUE CONSTRAINTS (idempotent via exception handler)
-- ============================================================
DO $$ BEGIN
  ALTER TABLE region_safe_zones ADD CONSTRAINT uq_safe_zone_region_name UNIQUE (region_id, name);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE region_resources ADD CONSTRAINT uq_resource_region_title UNIQUE (region_id, title);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- 5. SEED: Safe Zones & Resources for all 5 regions (Task 11)
-- ============================================================

-- NEPAL ─────────────────────────────────────────────────────

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Patan Durbar Square Community Hub',
       'Main verified gathering point for Kathmandu Valley residents. Staffed 24/7 by local coordinators.'
FROM regions r WHERE r.slug = 'nepal'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Bhaktapur Municipal Emergency Centre',
       'Official emergency coordination centre in Bhaktapur. Shelter and medical triage available.'
FROM regions r WHERE r.slug = 'nepal'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Lalitpur District Medical Station',
       'Verified medical station operated by local volunteers. Walk-in treatment and first aid.'
FROM regions r WHERE r.slug = 'nepal'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'Kathmandu Free Medical Clinic', 'Medical', 'Thamel, Kathmandu'
FROM regions r WHERE r.slug = 'nepal'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'Nepal Red Cross – Disaster Response', 'Aid', 'Red Cross Road, Kalimati'
FROM regions r WHERE r.slug = 'nepal'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'Community Legal Aid Centre', 'Legal', 'Putalisadak, Kathmandu'
FROM regions r WHERE r.slug = 'nepal'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;


-- MYANMAR ────────────────────────────────────────────────────

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Mandalay Community Shelter Network',
       'Civil society-run shelter in Mandalay. Coordinated via encrypted Signal channels.'
FROM regions r WHERE r.slug = 'myanmar'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Yangon Civil Society Assembly Point',
       'Verified safe meeting zone near Shwedagon. CDM network coordinators present.'
FROM regions r WHERE r.slug = 'myanmar'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Shan State Resistance Hub',
       'Mountain-area hub operated by local resistance committees. Radio contact maintained.'
FROM regions r WHERE r.slug = 'myanmar'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'Myanmar Civil Disobedience Medical Team', 'Medical', 'Signal: @MyanmarMedTeam'
FROM regions r WHERE r.slug = 'myanmar'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'Signal Network Legal Aid Service', 'Legal', 'Signal: @MyanmarLegal_Aid'
FROM regions r WHERE r.slug = 'myanmar'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'Emergency Food Distribution Point', 'Aid', 'Coordinate via @MyanmarAid_Bot'
FROM regions r WHERE r.slug = 'myanmar'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;


-- SUDAN ──────────────────────────────────────────────────────

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Khartoum Resistance Committee Safehouse',
       'Neighbourhood-level safehouse coordinated by Khartoum Resistance Committees. Entry by referral only.'
FROM regions r WHERE r.slug = 'sudan'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Omdurman Medical Station',
       'Emergency medical station west of Khartoum. Sudan Doctors Network volunteers on duty.'
FROM regions r WHERE r.slug = 'sudan'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Bahri District Community Hub',
       'Northern Khartoum hub for aid distribution and secure communications.'
FROM regions r WHERE r.slug = 'sudan'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'Sudan Doctors Network', 'Medical', 'WhatsApp: +249 912 000 111'
FROM regions r WHERE r.slug = 'sudan'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'Community Aid Distribution Centre', 'Aid', 'Resistance Committee network – verify locally'
FROM regions r WHERE r.slug = 'sudan'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'Resistance Committee Legal Network', 'Legal', 'Telegram: @SudanRCLegal'
FROM regions r WHERE r.slug = 'sudan'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;


-- IRAN ───────────────────────────────────────────────────────

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Tehran Emergency Shelter Network',
       'Decentralised shelter points across Tehran. Access via verified Telegram channel only.'
FROM regions r WHERE r.slug = 'iran'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Isfahan Community Meeting Point',
       'University-area gathering point. Legal observers and medics present during demonstrations.'
FROM regions r WHERE r.slug = 'iran'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Mashhad Civil Assembly Hub',
       'Verified assembly hub in Mashhad operated by local civil society groups.'
FROM regions r WHERE r.slug = 'iran'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'Iran Human Rights Legal Aid', 'Legal', 'Telegram: @IranHR_Legal'
FROM regions r WHERE r.slug = 'iran'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'Underground Medical Network', 'Medical', 'Signal: @IranMedUnderground'
FROM regions r WHERE r.slug = 'iran'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'VPN & Comms Distribution Centre', 'Comms', 'Telegram: @IranFreedom_Support'
FROM regions r WHERE r.slug = 'iran'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;


-- GEORGIA ────────────────────────────────────────────────────

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Tbilisi Freedom Square Assembly Point',
       'Primary peaceful assembly zone in central Tbilisi. Legal observer presence confirmed.'
FROM regions r WHERE r.slug = 'georgia'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Rustavi Peaceful Assembly Hub',
       'Regional coordination centre south of Tbilisi. Civil society network active.'
FROM regions r WHERE r.slug = 'georgia'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_safe_zones (region_id, name, description)
SELECT r.id, 'Batumi Community Network Centre',
       'Black Sea coastal hub. International press and observer presence.'
FROM regions r WHERE r.slug = 'georgia'
ON CONFLICT ON CONSTRAINT uq_safe_zone_region_name DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'Georgian Democracy Legal Aid', 'Legal', '+995 32 2 123 456'
FROM regions r WHERE r.slug = 'georgia'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'Community Medical Volunteer Network', 'Medical', 'Tbilisi Civil Hospital – Volunteer Wing'
FROM regions r WHERE r.slug = 'georgia'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;

INSERT INTO region_resources (region_id, title, category, location)
SELECT r.id, 'Press Freedom Resource Centre', 'Comms', 'Rustaveli Ave, Tbilisi'
FROM regions r WHERE r.slug = 'georgia'
ON CONFLICT ON CONSTRAINT uq_resource_region_title DO NOTHING;


-- ============================================================
\echo ''
\echo '=== Migration 001 complete ==='
\echo '    - images[] column added to posts'
\echo '    - pinned_posts table created'
\echo '    - post_comments table created'
\echo '    - Safe zones & resources seeded for all 5 regions'
\echo ''
