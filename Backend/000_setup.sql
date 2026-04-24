-- ============================================================
-- CITIZEN SHIELD – Komplettes DB-Setup (selbst enthalten)
-- Version:  000
-- Datenbank: PostgreSQL 15+
-- ------------------------------------------------------------
-- Erstellt in EINEM Durchlauf als PostgreSQL-Superuser:
--   1. Rolle  citizen_shield_admin        (idempotent)
--   2. Datenbank citizen_shield            (idempotent)
--   3. Alle Rechte für citizen_shield_admin auf DB- und Schema-Ebene
--   4. Default-Rechte für zukünftig erstellte Objekte
--   5. Extensions pgcrypto und earthdistance (benötigen Superuser)
--
-- Voraussetzungen: nur psql + ein Superuser-Zugang (typisch "postgres").
--
-- Ausführung:
--   psql -h localhost -U postgres -v admin_password=DeinSicheresPasswort -f 000_setup.sql
--
-- Wenn  -v admin_password=...  fehlt, wird ein Platzhalter benutzt.
-- UNBEDINGT vor Produktions-Einsatz ein eigenes Passwort übergeben!
--
-- Anschließend Schema + Seed-Daten als neuer Admin-User laden:
--   psql -h localhost -U citizen_shield_admin -d citizen_shield -f 001_citizen_shield_migration.sql
-- ============================================================

\set ON_ERROR_STOP on


-- ------------------------------------------------------------
-- Passwort-Variable (Default falls nicht per -v gesetzt)
-- ------------------------------------------------------------
\if :{?admin_password}
\else
  \set admin_password CHANGE_ME_STRONG_PASSWORD
  \echo ''
  \echo '*** WARNUNG: kein Passwort uebergeben – Platzhalter wird benutzt.         ***'
  \echo '*** Mit  -v admin_password=<pw>  ein eigenes Passwort setzen.             ***'
  \echo ''
\endif


-- ============================================================
-- 1. ROLLE ANLEGEN / AKTUALISIEREN (idempotent)
-- ------------------------------------------------------------
-- psql-Variablen werden innerhalb von $$-Strings NICHT substituiert.
-- Deshalb reichen wir das Passwort per Session-GUC in den DO-Block
-- durch und zitieren es dort sauber mit format(%L).
-- ============================================================
SET citizen_shield.setup_password = :'admin_password';

DO $$
DECLARE
  pw TEXT := current_setting('citizen_shield.setup_password');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'citizen_shield_admin') THEN
    EXECUTE format(
      'CREATE ROLE citizen_shield_admin
         WITH LOGIN CREATEDB CREATEROLE NOSUPERUSER INHERIT NOREPLICATION
              CONNECTION LIMIT -1 PASSWORD %L', pw);
    RAISE NOTICE 'Rolle citizen_shield_admin angelegt.';
  ELSE
    EXECUTE format(
      'ALTER ROLE citizen_shield_admin
         WITH LOGIN CREATEDB CREATEROLE NOSUPERUSER INHERIT NOREPLICATION
              PASSWORD %L', pw);
    RAISE NOTICE 'Rolle citizen_shield_admin aktualisiert.';
  END IF;
END
$$;


-- ============================================================
-- 2. DATENBANK ANLEGEN (idempotent)
-- ------------------------------------------------------------
-- CREATE DATABASE kann nicht in einem Transaktionsblock laufen,
-- deshalb generieren wir das Statement bedingt via \gexec.
-- ============================================================
SELECT 'CREATE DATABASE citizen_shield OWNER citizen_shield_admin'
 WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'citizen_shield')
\gexec

-- Falls die DB schon existierte, Besitzer trotzdem sicherstellen
ALTER DATABASE citizen_shield OWNER TO citizen_shield_admin;


-- ============================================================
-- 3. DATENBANK-RECHTE
-- ============================================================
GRANT ALL PRIVILEGES ON DATABASE citizen_shield TO citizen_shield_admin;


-- ============================================================
-- 4. VERBINDUNG ZUR ZIEL-DATENBANK WECHSELN
-- ============================================================
\connect citizen_shield


-- ============================================================
-- 5. EXTENSIONS (Superuser erforderlich – hier, nicht in 001)
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "earthdistance" CASCADE;


-- ============================================================
-- 6. SCHEMA-RECHTE (public)
-- ============================================================
ALTER SCHEMA public OWNER TO citizen_shield_admin;
GRANT  ALL PRIVILEGES ON SCHEMA public TO citizen_shield_admin;


-- ============================================================
-- 7. RECHTE AUF BEREITS VORHANDENE OBJEKTE
-- ============================================================
GRANT ALL PRIVILEGES ON ALL TABLES    IN SCHEMA public TO citizen_shield_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO citizen_shield_admin;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO citizen_shield_admin;
GRANT ALL PRIVILEGES ON ALL ROUTINES  IN SCHEMA public TO citizen_shield_admin;


-- ============================================================
-- 8. DEFAULT-RECHTE FÜR ZUKÜNFTIG ERSTELLTE OBJEKTE
-- ============================================================
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON TABLES    TO citizen_shield_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON SEQUENCES TO citizen_shield_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON FUNCTIONS TO citizen_shield_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON ROUTINES  TO citizen_shield_admin;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL PRIVILEGES ON TYPES     TO citizen_shield_admin;


-- ============================================================
-- 9. VERIFIKATION
-- ============================================================
\echo ''
\echo '=== Setup abgeschlossen ==='

SELECT rolname, rolcanlogin, rolcreatedb, rolcreaterole, rolsuper
FROM   pg_roles
WHERE  rolname = 'citizen_shield_admin';

SELECT datname AS database,
       pg_catalog.pg_get_userbyid(datdba) AS owner
FROM   pg_database
WHERE  datname = 'citizen_shield';

SELECT extname, extversion
FROM   pg_extension
WHERE  extname IN ('pgcrypto', 'earthdistance', 'cube');

\echo ''
\echo 'Naechster Schritt – Schema + Seed-Daten laden:'
\echo '  psql -h localhost -U citizen_shield_admin -d citizen_shield -f 001_citizen_shield_migration.sql'
\echo ''
