import React from 'react';
import { Link } from 'wouter';
import { Mail, Github, MapPin, Scale, ChevronLeft } from 'lucide-react';
import { S } from '../design-tokens';
import { Reveal } from '../motion';
import { ShaderBackground } from '../components/ShaderBackground';

const TEAM = [
  { name: 'Louis Duong',   role: 'Project Lead · Editorial Responsibility' },
  { name: 'Emil Sack',     role: 'Engineering · Editorial Responsibility' },
  { name: 'Omar Rosypal',  role: 'Design · Editorial Responsibility' },
  { name: 'Martin Stanev', role: 'Infrastructure · Editorial Responsibility' },
] as const;

export const ImpressumView: React.FC = () => {
  return (
    <>
      <ShaderBackground />
      <LegalShell
        eyebrow="Legal · § 24 MedienG · § 5 ECG"
        title={<>Impressum &<br /><em style={{ fontStyle: 'italic', color: S.primary }}>disclosure</em></>}
        subtitle="Information about the operators of citizenshield.network, the people responsible for its content, and the legal framework under which this site is published."
      >
        <Section title="Site operator" index="01">
          <p style={pStyle}>
            <strong>Citizen Shield Project</strong> — a student-led, non-commercial initiative built
            as part of the <em>3DHIF Umweltprojekt</em> (school year 2025 / 2026).
          </p>
          <div style={metaRow}>
            <MetaItem icon={<MapPin size={14} />} label="Address">
              c/o HTL — 3DHIF Project Group<br />
              Austria
            </MetaItem>
            <MetaItem icon={<Mail size={14} />} label="Contact">
              <a style={linkStyle} href="mailto:sta230286@spengergasse.at">
                 sta230286@spengergasse.at
              </a>
            </MetaItem>
            <MetaItem icon={<Github size={14} />} label="Source">
              <a style={linkStyle} href="https://github.com" target="_blank" rel="noreferrer">
                github.com / citizen-shield
              </a>
            </MetaItem>
          </div>
        </Section>

        <Section title="Responsible for content" index="02" subtitle="Per § 25 Mediengesetz · joint editorial responsibility">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}>
            {TEAM.map((p, i) => (
              <Reveal key={p.name} delay={i * 60}>
                <div className="lift" style={cardStyle}>
                  <div style={initialsStyle}>
                    {p.name.split(' ').map(w => w[0]).join('')}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{
                      fontFamily: "'Instrument Serif', Georgia, serif",
                      fontSize: 22, color: S.ink, letterSpacing: '-0.01em',
                      lineHeight: 1.1, margin: 0,
                    }}>
                      {p.name}
                    </p>
                    <p style={{
                      fontSize: 10, fontWeight: 700, color: S.ash,
                      textTransform: 'uppercase', letterSpacing: '0.16em',
                      marginTop: 8, lineHeight: 1.4,
                    }}>
                      {p.role}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>

        <Section title="Purpose of the site" index="03">
          <p style={pStyle}>
            Citizen Shield is a non-commercial community signal network. The platform coordinates
            verified safety reports, mutual-aid resources, and crisis-region communication. It is
            published for educational and humanitarian purposes only; it does not sell goods or
            services, and it does not carry advertising.
          </p>
        </Section>

        <Section title="Liability for content" index="04">
          <p style={pStyle}>
            We prepare the content of this site with care, but we cannot guarantee that the
            information is accurate, complete, or current. User-submitted reports reflect the
            views of their authors, not of the operators.
          </p>
          <p style={pStyle}>
            Where required, we will remove unlawful content immediately upon obtaining knowledge
            of it (§ 17 ECG). Until such notice, we are not obliged to monitor user content or to
            investigate circumstances suggesting illegal activity.
          </p>
        </Section>

        <Section title="Liability for links" index="05">
          <p style={pStyle}>
            Our pages may link to external websites whose content we do not control. We are not
            responsible for that content. At the time of linking, the linked pages were reviewed
            for unlawful content and none was apparent.
          </p>
        </Section>

        <Section title="Copyright" index="06">
          <p style={pStyle}>
            All content created by the operators — code, copy, illustrations, the shader visuals
            on this very page — is licensed for non-commercial reuse with attribution. User
            submissions remain the property of their authors and are published under a permissive
            license granted to the platform.
          </p>
        </Section>

        <Section title="Online dispute resolution" index="07">
          <p style={pStyle}>
            The European Commission provides an online dispute-resolution platform at{' '}
            <a style={linkStyle} href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noreferrer">
              ec.europa.eu/consumers/odr
            </a>
            . As a non-commercial educational project, we are not legally obliged to participate
            in dispute-resolution proceedings before a consumer arbitration board.
          </p>
        </Section>

        <FooterStamp />
      </LegalShell>
    </>
  );
};

/* ────────────────────────────────────────────────────────────
 * Shared shell — used by both Impressum and Privacy views
 * ──────────────────────────────────────────────────────────── */

interface LegalShellProps {
  eyebrow: string;
  title: React.ReactNode;
  subtitle: string;
  children: React.ReactNode;
}

export const LegalShell: React.FC<LegalShellProps> = ({ eyebrow, title, subtitle, children }) => (
  <div style={{ maxWidth: 880, margin: '0 auto', position: 'relative' }}>
    <Reveal>
      <Link href="/" style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        textDecoration: 'none', color: S.muted, fontSize: 12, fontWeight: 600,
        marginBottom: 32, padding: '6px 10px 6px 6px', borderRadius: 30,
        border: `1px solid ${S.rule}`, background: 'rgba(251,247,236,0.6)',
        backdropFilter: 'blur(6px)',
      }}>
        <ChevronLeft size={14} /> Back to network
      </Link>
    </Reveal>

    {/* HERO */}
    <section style={{ position: 'relative', marginBottom: 56 }}>
      <Reveal>
        <p style={{
          fontSize: 10, fontWeight: 700, color: S.primary,
          textTransform: 'uppercase', letterSpacing: '0.18em',
          marginBottom: 14, display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          <Scale size={12} />
          <span style={{ display: 'inline-block', width: 18, height: 1, background: 'currentColor', opacity: 0.5 }} />
          {eyebrow}
        </p>
      </Reveal>
      <Reveal delay={80}>
        <h1 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 'clamp(2.4rem, 6vw, 4.6rem)', fontWeight: 400,
          color: S.ink, letterSpacing: '-0.03em', lineHeight: 0.96, margin: 0,
        }}>
          {title}
        </h1>
      </Reveal>
      <Reveal delay={160}>
        <p style={{
          fontSize: 16, color: S.muted, maxWidth: 620, lineHeight: 1.6, marginTop: 20,
        }}>
          {subtitle}
        </p>
      </Reveal>
    </section>

    {/* CONTENT — glassy card stack */}
    <div style={{
      position: 'relative',
      borderRadius: 28,
      padding: 'clamp(20px, 4vw, 40px)',
      background: 'rgba(251,247,236,0.72)',
      border: `1px solid ${S.rule}`,
      backdropFilter: 'blur(18px) saturate(1.1)',
      WebkitBackdropFilter: 'blur(18px) saturate(1.1)',
      boxShadow: '0 30px 80px -40px rgba(89,46,28,0.30), 0 1px 0 rgba(255,255,255,0.6) inset',
    }}>
      {children}
    </div>
  </div>
);

/* ── Section ──────────────────────────────────────────── */

interface SectionProps {
  index: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const Section: React.FC<SectionProps> = ({ index, title, subtitle, children }) => (
  <section style={{
    paddingBlock: 'clamp(20px, 3vw, 32px)',
    borderTop: `1px solid ${S.ruleSoft}`,
  }}>
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      gap: 'clamp(14px, 3vw, 28px)',
      alignItems: 'baseline',
    }}>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11, fontWeight: 700, color: S.primary,
        letterSpacing: '0.16em',
      }}>
        {index}
      </span>
      <div style={{ minWidth: 0 }}>
        <h2 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 'clamp(1.5rem, 3vw, 2.0rem)', fontWeight: 400,
          color: S.ink, letterSpacing: '-0.02em', lineHeight: 1.1,
          margin: 0,
        }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{
            fontSize: 11, fontWeight: 700, color: S.ash,
            textTransform: 'uppercase', letterSpacing: '0.14em',
            marginTop: 8,
          }}>
            {subtitle}
          </p>
        )}
        <div style={{ marginTop: 18 }}>{children}</div>
      </div>
    </div>
  </section>
);

/* ── Footer stamp ─────────────────────────────────────── */

export const FooterStamp: React.FC = () => (
  <div style={{
    marginTop: 32, paddingTop: 20,
    borderTop: `1px solid ${S.ruleSoft}`,
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    flexWrap: 'wrap', gap: 12,
  }}>
    <p style={{
      fontSize: 10, fontWeight: 700, color: S.ash,
      textTransform: 'uppercase', letterSpacing: '0.18em',
    }}>
      Last updated · May 2026
    </p>
    <p style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 10, color: S.ash, letterSpacing: '0.10em',
    }}>
      v1.0 · citizenshield.network
    </p>
  </div>
);

/* ── Shared styles ───────────────────────────────────── */

const pStyle: React.CSSProperties = {
  fontSize: 14.5, color: S.inkSoft, lineHeight: 1.7,
  margin: '0 0 12px 0',
};

const linkStyle: React.CSSProperties = {
  color: S.primary, textDecoration: 'none',
  borderBottom: `1px solid ${S.primaryDim}`,
  paddingBottom: 1,
};

const metaRow: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 14,
  marginTop: 18,
};

const cardStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 14,
  padding: '16px 18px',
  borderRadius: 16,
  background: 'rgba(255,253,247,0.85)',
  border: `1px solid ${S.rule}`,
};

const initialsStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 44, height: 44, borderRadius: '50%',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: `linear-gradient(135deg, ${S.primary} 0%, ${S.primaryDim} 100%)`,
  color: '#fbf7ec',
  fontFamily: "'Instrument Serif', Georgia, serif",
  fontSize: 16, letterSpacing: '0.04em',
  boxShadow: '0 6px 16px -8px rgba(164,74,58,0.55)',
};

interface MetaItemProps {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}

const MetaItem: React.FC<MetaItemProps> = ({ icon, label, children }) => (
  <div style={{
    padding: '14px 16px', borderRadius: 14,
    background: 'rgba(255,253,247,0.7)',
    border: `1px solid ${S.rule}`,
  }}>
    <p style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontSize: 10, fontWeight: 700, color: S.ash,
      textTransform: 'uppercase', letterSpacing: '0.16em', marginBottom: 8,
    }}>
      {icon} {label}
    </p>
    <div style={{ fontSize: 13.5, color: S.inkSoft, lineHeight: 1.55 }}>
      {children}
    </div>
  </div>
);
