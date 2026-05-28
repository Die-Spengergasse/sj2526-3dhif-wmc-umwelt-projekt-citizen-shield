import React from 'react';
import { S } from '../design-tokens';
import { Reveal } from '../motion';
import { ShaderBackground } from '../components/ShaderBackground';
import { LegalShell, Section, FooterStamp } from './ImpressumView';

const RIGHTS = [
  { title: 'Access',         body: 'A copy of the personal data we hold about you.' },
  { title: 'Rectification',  body: 'Correction of inaccurate or incomplete data.' },
  { title: 'Erasure',        body: 'Deletion of your data when there is no overriding lawful basis.' },
  { title: 'Restriction',    body: 'Limit the way we process your data in specific cases.' },
  { title: 'Portability',    body: 'Receive your data in a machine-readable format.' },
  { title: 'Objection',      body: 'Object to processing based on legitimate interest.' },
  { title: 'Withdraw',       body: 'Withdraw any consent you have given, at any time.' },
  { title: 'Complaint',      body: 'Lodge a complaint with the Austrian DPA (dsb.gv.at).' },
] as const;

const DATA_CATEGORIES = [
  {
    label: 'Account',
    color: S.primary,
    items: ['Display name', 'Email address (via Google sign-in)', 'Avatar URL', 'Region memberships'],
  },
  {
    label: 'Content',
    color: S.secondary,
    items: ['Reports & posts you submit', 'Votes and reactions', 'Images you attach'],
  },
  {
    label: 'Location',
    color: S.tertiary,
    items: ['Optional precise location via the "Use my location" button', 'Optional EXIF coordinates from uploaded photos (extracted server-side)'],
  },
  {
    label: 'Technical',
    color: S.warn,
    items: ['IP address (transient, for rate-limiting and abuse prevention)', 'Browser & device user-agent', 'Realtime WebSocket session tokens'],
  },
] as const;

const PROCESSORS = [
  { name: 'Google Firebase',  purpose: 'Authentication & realtime auth tokens',          region: 'EU / US (SCC)' },
  { name: 'Microsoft Azure',  purpose: 'Image storage (Blob Storage)',                   region: 'EU' },
  { name: 'PostgreSQL host',  purpose: 'Primary application database',                   region: 'EU' },
  { name: 'Google Identity',  purpose: 'OAuth sign-in (only if you choose to sign in)',  region: 'EU / US (SCC)' },
] as const;

export const PrivacyView: React.FC = () => {
  return (
    <>
      <ShaderBackground accent={[0.239, 0.420, 0.471]} />
      <LegalShell
        eyebrow="GDPR · DSG · ePrivacy"
        title={<>Privacy &<br /><em style={{ fontStyle: 'italic', color: S.primary }}>data dignity</em></>}
        subtitle="How Citizen Shield collects, uses, and protects your data. Written in plain language, then in legal terms — so you can read whichever version you need."
      >
        <Section title="Who is responsible" index="01" subtitle="Controller per Art 4 (7) GDPR">
          <p style={pStyle}>
            The data controller for this service is the <strong>Citizen Shield Project Group</strong>,
            jointly operated by Louis Duong, Emil Sack, Omar Rosypal, and Martin Stanev as part of
            the 3DHIF Umweltprojekt (school year 2025 / 2026).
          </p>
          <p style={pStyle}>
            For any privacy-related request — access, deletion, objection, or a simple question —
            write to{' '}
            <a style={linkStyle} href="mailto:privacy@citizenshield.network">
              privacy@citizenshield.network
            </a>
            . We aim to respond within 14 days.
          </p>
        </Section>

        <Section title="What we collect" index="02" subtitle="And nothing more than what we need">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 14,
            marginTop: 6,
          }}>
            {DATA_CATEGORIES.map((cat, i) => (
              <Reveal key={cat.label} delay={i * 60}>
                <div className="lift" style={{
                  position: 'relative', overflow: 'hidden',
                  padding: '18px 18px 16px',
                  borderRadius: 16,
                  background: 'rgba(255,253,247,0.85)',
                  border: `1px solid ${S.rule}`,
                }}>
                  <div style={{
                    position: 'absolute', top: -30, right: -30,
                    width: 100, height: 100, borderRadius: '50%',
                    background: `radial-gradient(circle, ${cat.color}22 0%, transparent 70%)`,
                    pointerEvents: 'none',
                  }} />
                  <p style={{
                    fontSize: 10, fontWeight: 700, color: cat.color,
                    textTransform: 'uppercase', letterSpacing: '0.18em',
                    marginBottom: 12,
                  }}>
                    {cat.label}
                  </p>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                    {cat.items.map(it => (
                      <li key={it} style={{
                        position: 'relative', paddingLeft: 14,
                        fontSize: 13, color: S.inkSoft, lineHeight: 1.55,
                        marginBottom: 6,
                      }}>
                        <span style={{
                          position: 'absolute', left: 0, top: 9,
                          width: 5, height: 5, borderRadius: '50%',
                          background: cat.color,
                        }} />
                        {it}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section title="Why we process it" index="03" subtitle="Purpose & legal basis · Art 6 GDPR">
          <BasisRow basis="Art 6 (1) (b) — contract"
                    purpose="Operating your account, your posts, and votes is necessary to provide the service you signed up for." />
          <BasisRow basis="Art 6 (1) (a) — consent"
                    purpose="Sharing precise location or EXIF coordinates from photos. You can revoke at any time by removing the post." />
          <BasisRow basis="Art 6 (1) (f) — legitimate interest"
                    purpose="Rate-limiting, abuse prevention, security logs. We balance these against your rights and minimise retention." />
          <BasisRow basis="Art 6 (1) (c) — legal obligation"
                    purpose="Responding to lawful requests from competent authorities, if and when they apply to us." />
        </Section>

        <Section title="Who we share data with" index="04" subtitle="Processors acting on our instructions">
          <p style={pStyle}>
            We do not sell your data. We do not run advertising. We do, however, rely on a small
            number of infrastructure providers who process data strictly on our behalf:
          </p>
          <div style={{
            marginTop: 14, borderRadius: 14, overflow: 'hidden',
            border: `1px solid ${S.rule}`,
            background: 'rgba(255,253,247,0.7)',
          }}>
            {PROCESSORS.map((p, i) => (
              <div key={p.name} style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 2fr 1fr',
                gap: 12,
                padding: '12px 16px',
                fontSize: 12.5,
                color: S.inkSoft,
                borderBottom: i < PROCESSORS.length - 1 ? `1px solid ${S.ruleSoft}` : 'none',
                alignItems: 'center',
              }}>
                <span style={{ fontWeight: 600, color: S.ink }}>{p.name}</span>
                <span>{p.purpose}</span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 10, color: S.ash, letterSpacing: '0.10em',
                  justifySelf: 'end', textTransform: 'uppercase',
                }}>
                  {p.region}
                </span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="How long we keep it" index="05" subtitle="Retention">
          <p style={pStyle}>
            Account data remains as long as your account exists. Posts and votes remain as long as
            the post is published; deleting a post removes the content and detaches your identity
            from associated votes within 30 days. Technical logs (IP addresses, user-agents) are
            rotated within 14 days. Image files are removed when the parent post is deleted.
          </p>
        </Section>

        <Section title="Your rights" index="06" subtitle="Art 15 – 22 GDPR">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 10,
            marginTop: 4,
          }}>
            {RIGHTS.map((r, i) => (
              <Reveal key={r.title} delay={i * 40}>
                <div style={{
                  padding: '12px 14px', borderRadius: 12,
                  background: 'rgba(255,253,247,0.7)',
                  border: `1px solid ${S.rule}`,
                  height: '100%',
                }}>
                  <p style={{
                    fontSize: 10, fontWeight: 700, color: S.primary,
                    textTransform: 'uppercase', letterSpacing: '0.16em',
                    marginBottom: 6,
                  }}>
                    {r.title}
                  </p>
                  <p style={{ fontSize: 12.5, color: S.inkSoft, lineHeight: 1.5, margin: 0 }}>
                    {r.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section title="Cookies & local storage" index="07">
          <p style={pStyle}>
            We do not set tracking cookies. The site uses a small amount of local storage to keep
            you signed in (a Firebase auth token) and to remember UI preferences. Closing your
            account or clearing site data removes these immediately.
          </p>
        </Section>

        <Section title="Children" index="08">
          <p style={pStyle}>
            The service is not intended for users under 14 (the digital-consent age under § 4 (4)
            DSG in Austria). If you become aware that a child has provided personal data, contact
            us and we will delete it.
          </p>
        </Section>

        <Section title="Changes to this policy" index="09">
          <p style={pStyle}>
            We may update this document to reflect changes to the service, the law, or the
            providers we rely on. Material changes will be announced in-app before they take
            effect. The version number and date below always reflect the current edition.
          </p>
        </Section>

        <FooterStamp />
      </LegalShell>
    </>
  );
};

/* ── Local helpers ───────────────────────────────────── */

const BasisRow: React.FC<{ basis: string; purpose: string }> = ({ basis, purpose }) => (
  <div style={{
    display: 'grid',
    gridTemplateColumns: 'minmax(180px, 240px) 1fr',
    gap: 18,
    padding: '12px 0',
    borderTop: `1px solid ${S.ruleSoft}`,
    alignItems: 'baseline',
  }}>
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 11, fontWeight: 700, color: S.primary,
      letterSpacing: '0.08em',
    }}>
      {basis}
    </span>
    <span style={{ fontSize: 13.5, color: S.inkSoft, lineHeight: 1.6 }}>
      {purpose}
    </span>
  </div>
);

const pStyle: React.CSSProperties = {
  fontSize: 14.5, color: S.inkSoft, lineHeight: 1.7,
  margin: '0 0 12px 0',
};

const linkStyle: React.CSSProperties = {
  color: S.primary, textDecoration: 'none',
  borderBottom: `1px solid ${S.primaryDim}`,
  paddingBottom: 1,
};
