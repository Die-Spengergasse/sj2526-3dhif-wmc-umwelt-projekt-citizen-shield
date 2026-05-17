import React, { useState, useRef } from 'react';
import { X, Send, AlertTriangle, Info, Radio, Upload, Loader2, ChevronLeft } from 'lucide-react';
import { PostType } from '../types';
import { apiUpload } from '../api';
import { S } from '../design-tokens';

interface PostFormProps {
  regionSlug: string;
  onClose: () => void;
  onSubmit: (post: { title: string; description: string; type: PostType; imageUrl?: string }) => void;
}

export const PostForm: React.FC<PostFormProps> = ({ regionSlug, onClose, onSubmit }) => {
  const [title,        setTitle]       = useState('');
  const [description,  setDesc]        = useState('');
  const [type,         setType]        = useState<PostType>('info');
  const [imageFile,    setImageFile]   = useState<File | null>(null);
  const [imagePreview, setPreview]     = useState<string | null>(null);
  const [submitting,   setSubmitting]  = useState(false);
  const [error,        setError]       = useState<string | null>(null);
  const [step,         setStep]        = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);

  const typeConfig = {
    critical:  { color: S.primary,   bg: `${S.primary}18`,   Icon: AlertTriangle, label: 'Critical',  desc: 'Urgent safety alerts, immediate dangers or critical changes.' },
    info:      { color: S.secondary, bg: `${S.secondary}18`, Icon: Info,          label: 'Info',      desc: 'General updates, resource locations and situational reports.' },
    broadcast: { color: S.tertiary,  bg: `${S.tertiary}18`,  Icon: Radio,         label: 'Broadcast', desc: 'Community announcements, coordination and morale messages.' },
  } as const;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 10 * 1024 * 1024) { setError('Image must be under 10 MB'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) { setError('Only JPEG, PNG, WebP allowed'); return; }
    setError(null);
    setImageFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) { setError('Title and description are required'); return; }
    if (title.length < 5) { setError('Title must be at least 5 characters'); return; }
    if (description.length < 10) { setError('Description must be at least 10 characters'); return; }
    setSubmitting(true); setError(null);
    try {
      let imageUrl: string | undefined;
      if (imageFile) { imageUrl = await apiUpload(imageFile); }
      await onSubmit({ title: title.trim(), description: description.trim(), type, imageUrl });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)' }} onClick={onClose}>
      <div style={{ width: '100%', maxWidth: 480, borderRadius: 24, overflow: 'hidden', maxHeight: '90vh', overflowY: 'auto',
        background: S.surf1, border: `1px solid ${S.borderMd}`, boxShadow: '0 40px 80px rgba(0,0,0,0.7)' }} onClick={e => e.stopPropagation()}>

        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${S.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: S.surf2, zIndex: 1 }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: 16, color: S.text, letterSpacing: '-0.01em' }}>Submit Community Report</h3>
            <p style={{ fontSize: 11, color: S.muted, marginTop: 2 }}>Region: <span style={{ color: S.primary, fontWeight: 600 }}>{regionSlug?.toUpperCase()}</span></p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${S.border}`, background: 'transparent', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: S.muted }}>
            <X size={16}/>
          </button>
        </div>

        {/* Step indicator */}
        <div style={{ padding: '14px 20px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
          {[1, 2].map(s => (
            <React.Fragment key={s}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, transition: 'all 0.2s',
                background: step >= s ? S.primary : S.surf3, color: step >= s ? '#fff' : S.muted }}>{s}</div>
              {s < 2 && <div style={{ flex: 1, height: 2, borderRadius: 2, background: step > s ? S.primary : S.surf3, transition: 'background 0.2s' }}/>}
            </React.Fragment>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {step === 1 && (
            <>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>Select Report Type</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                  {(Object.entries(typeConfig) as [PostType, typeof typeConfig[PostType]][]).map(([k, cfg]) => (
                    <button key={k} type="button" onClick={() => setType(k)}
                      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 8px', borderRadius: 12,
                        border: `2px solid ${type === k ? cfg.color : S.border}`,
                        background: type === k ? cfg.bg : S.surf2,
                        cursor: 'pointer', color: type === k ? cfg.color : S.muted, fontFamily: 'inherit' }}>
                      <cfg.Icon size={18}/>
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cfg.label}</span>
                    </button>
                  ))}
                </div>
                {type && (
                  <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 10, background: typeConfig[type].bg }}>
                    <p style={{ fontSize: 12, color: typeConfig[type].color, lineHeight: 1.5 }}>{typeConfig[type].desc}</p>
                  </div>
                )}
              </div>
              <button type="button" onClick={() => setStep(2)}
                style={{ width: '100%', padding: 12, borderRadius: 12, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: '#fff', background: S.primary, fontFamily: 'inherit' }}>
                Continue →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button type="button" onClick={() => setStep(1)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: S.muted, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', fontWeight: 600 }}>
                <ChevronLeft size={14}/> Back
              </button>

              {[
                { label: 'Title *', value: title, onChange: setTitle, placeholder: 'Brief summary…', maxLen: 200, single: true },
                { label: 'Description *', value: description, onChange: setDesc, placeholder: 'Provide detailed information…', maxLen: 2000, single: false },
              ].map(f => (
                <div key={f.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{f.label}</label>
                    <span style={{ fontSize: 10, color: S.muted }}>{f.value.length}/{f.maxLen}</span>
                  </div>
                  {f.single ? (
                    <input type="text" value={f.value} onChange={e => f.onChange(e.target.value)}
                      placeholder={f.placeholder} maxLength={f.maxLen}
                      style={{ width: '100%', background: S.surf2, border: `1px solid ${S.border}`, borderRadius: 10, padding: '10px 14px',
                        fontSize: 13, fontWeight: 500, color: S.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = S.primary}
                      onBlur={e => e.target.style.borderColor = S.border}/>
                  ) : (
                    <textarea value={f.value} onChange={e => f.onChange(e.target.value)}
                      placeholder={f.placeholder} maxLength={f.maxLen}
                      style={{ width: '100%', background: S.surf2, border: `1px solid ${S.border}`, borderRadius: 10, padding: '10px 14px',
                        fontSize: 13, color: S.text, outline: 'none', minHeight: 100, resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
                      onFocus={e => e.target.style.borderColor = S.primary}
                      onBlur={e => e.target.style.borderColor = S.border}/>
                  )}
                </div>
              ))}

              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Image (Optional)</label>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} style={{ display: 'none' }}/>
                {imagePreview ? (
                  <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: `1px solid ${S.border}` }}>
                    <img src={imagePreview} alt="Preview" style={{ width: '100%', height: 140, objectFit: 'cover' }}/>
                    <button type="button" onClick={() => { setPreview(null); setImageFile(null); }}
                      style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 7, background: 'rgba(0,0,0,0.6)',
                        border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <X size={13}/>
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    style={{ width: '100%', padding: 16, borderRadius: 12, border: `2px dashed ${S.border}`, background: 'transparent', cursor: 'pointer',
                      color: S.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>
                    <Upload size={16}/> Choose an image
                  </button>
                )}
              </div>

              {error && (
                <div style={{ padding: '10px 14px', background: 'rgba(248,113,113,0.12)', borderRadius: 10, border: '1px solid rgba(248,113,113,0.25)', fontSize: 13, fontWeight: 600, color: '#f87171' }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={submitting}
                style={{ width: '100%', padding: 13, borderRadius: 12, border: 'none', cursor: submitting ? 'not-allowed' : 'pointer',
                  fontWeight: 700, fontSize: 14, color: '#fff', background: S.primary, opacity: submitting ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit' }}>
                {submitting ? <><Loader2 size={16} className="animate-spin"/> Submitting…</> : <><Send size={16}/> Broadcast Report</>}
              </button>
              <p style={{ fontSize: 10, textAlign: 'center', color: S.muted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                All reports are subject to community verification
              </p>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
