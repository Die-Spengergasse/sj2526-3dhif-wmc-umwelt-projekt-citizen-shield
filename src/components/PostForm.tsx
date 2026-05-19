import React, { useState, useRef, useEffect } from 'react';
import { X, Send, AlertTriangle, Info, Radio, Upload, Loader2, ChevronLeft, Plus, MapPin } from 'lucide-react';
import { PostType } from '../types';
import { apiUpload } from '../api';
import { S } from '../design-tokens';

const MAX_IMAGES = 5;

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

interface PostFormProps {
  regionSlug: string;
  onClose: () => void;
  onSubmit: (post: {
    title: string;
    description: string;
    type: PostType;
    imageUrls?: string[];
    locationText?: string;
    locationLat?: number;
    locationLng?: number;
  }) => void;
}

export const PostForm: React.FC<PostFormProps> = ({ regionSlug, onClose, onSubmit }) => {
  const [title,        setTitle]        = useState('');
  const [description,  setDesc]         = useState('');
  const [type,         setType]         = useState<PostType>('info');
  const [locationText, setLocationText] = useState('');
  const [locationLat,  setLocationLat]  = useState<number | undefined>();
  const [locationLng,  setLocationLng]  = useState<number | undefined>();
  const [suggestions,  setSuggestions]  = useState<NominatimResult[]>([]);
  const [isSearching,  setIsSearching]  = useState(false);
  const [imageFiles,   setImageFiles]   = useState<File[]>([]);
  const [previews,     setPreviews]     = useState<string[]>([]);
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);
  const [step,         setStep]         = useState(1);

  const fileRef     = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  const typeConfig = {
    critical:  { color: S.primary,   bg: `${S.primary}18`,   Icon: AlertTriangle, label: 'Critical',  desc: 'Urgent safety alerts, immediate dangers or critical changes.' },
    info:      { color: S.secondary, bg: `${S.secondary}18`, Icon: Info,          label: 'Info',      desc: 'General updates, resource locations and situational reports.' },
    broadcast: { color: S.tertiary,  bg: `${S.tertiary}18`,  Icon: Radio,         label: 'Broadcast', desc: 'Community announcements, coordination and morale messages.' },
  } as const;

  // Close suggestions on outside click
  useEffect(() => {
    if (!suggestions.length) return;
    const h = (e: MouseEvent) => {
      if (locationRef.current && !locationRef.current.contains(e.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [suggestions.length]);

  const handleLocationInput = (value: string) => {
    setLocationText(value);
    // Clear previously selected coordinates when user types again
    setLocationLat(undefined);
    setLocationLng(undefined);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim() || value.length < 2) { setSuggestions([]); return; }

    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
  };

  const handleSuggestionSelect = (s: NominatimResult) => {
    setLocationText(s.display_name);
    setLocationLat(parseFloat(s.lat));
    setLocationLng(parseFloat(s.lon));
    setSuggestions([]);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []) as File[];
    if (!files.length) return;

    const remaining = MAX_IMAGES - imageFiles.length;
    const toAdd = files.slice(0, remaining);

    for (const f of toAdd) {
      if (f.size > 10 * 1024 * 1024) { setError('Each image must be under 10 MB'); return; }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(f.type)) { setError('Only JPEG, PNG, WebP allowed'); return; }
    }
    setError(null);
    setImageFiles(prev => [...prev, ...toAdd]);
    setPreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
    if (fileRef.current) fileRef.current.value = '';
  };

  const removeImage = (idx: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) { setError('Title and description are required'); return; }
    if (title.length < 5) { setError('Title must be at least 5 characters'); return; }
    if (description.length < 10) { setError('Description must be at least 10 characters'); return; }
    setSubmitting(true); setError(null);
    try {
      const imageUrls: string[] = [];
      for (const file of imageFiles) {
        const url = await apiUpload(file);
        imageUrls.push(url);
      }
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        type,
        imageUrls: imageUrls.length ? imageUrls : undefined,
        locationText: locationText.trim() || undefined,
        locationLat,
        locationLng,
      });
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

              {/* Location autocomplete */}
              <div ref={locationRef} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase',
                    letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <MapPin size={11}/> Location (Optional)
                  </label>
                  {locationLat != null && (
                    <span style={{ fontSize: 10, color: S.secondary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={9}/> GPS set
                    </span>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={locationText}
                    onChange={e => handleLocationInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Escape') setSuggestions([]); }}
                    placeholder="Search a city, district or address…"
                    maxLength={255}
                    style={{
                      width: '100%', background: S.surf2, border: `1px solid ${S.border}`,
                      borderRadius: suggestions.length ? '10px 10px 0 0' : 10,
                      padding: '10px 38px 10px 14px', fontSize: 13, fontWeight: 500,
                      color: S.text, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                    onFocus={e => e.target.style.borderColor = S.primary}
                    onBlur={e => { if (!suggestions.length) e.target.style.borderColor = S.border; }}
                  />
                  {/* Spinner or pin icon */}
                  <div style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: S.muted, pointerEvents: 'none' }}>
                    {isSearching
                      ? <Loader2 size={14} className="animate-spin"/>
                      : <MapPin size={14}/>
                    }
                  </div>
                </div>

                {/* Suggestions dropdown */}
                {suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: S.surf2, border: `1px solid ${S.primary}`,
                    borderTop: 'none', borderRadius: '0 0 10px 10px',
                    boxShadow: '0 12px 32px -8px rgba(31,26,19,0.25)',
                    maxHeight: 200, overflowY: 'auto',
                  }}>
                    {suggestions.map((s, i) => (
                      <button
                        key={s.place_id}
                        type="button"
                        onMouseDown={e => { e.preventDefault(); handleSuggestionSelect(s); }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '10px 14px',
                          background: 'transparent', border: 'none', cursor: 'pointer',
                          fontFamily: 'inherit', fontSize: 12.5, color: S.text,
                          borderBottom: i < suggestions.length - 1 ? `1px solid ${S.border}` : 'none',
                          display: 'flex', alignItems: 'flex-start', gap: 8,
                          transition: 'background 120ms ease',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = S.surf3)}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <MapPin size={12} style={{ color: S.primary, flexShrink: 0, marginTop: 2 }}/>
                        <span style={{ lineHeight: 1.45 }}>{s.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Multi-image upload */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    Images (Optional)
                  </label>
                  <span style={{ fontSize: 10, color: S.muted }}>{imageFiles.length}/{MAX_IMAGES}</span>
                </div>
                <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleFile} style={{ display: 'none' }}/>

                {previews.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8, marginBottom: 8 }}>
                    {previews.map((src, idx) => (
                      <div key={idx} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden',
                        border: `1px solid ${S.border}`, aspectRatio: '4/3' }}>
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/>
                        <button type="button" onClick={() => removeImage(idx)}
                          style={{ position: 'absolute', top: 4, right: 4, width: 22, height: 22, borderRadius: 6,
                            background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                          <X size={11}/>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {imageFiles.length < MAX_IMAGES && (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    style={{ width: '100%', padding: previews.length ? '10px 16px' : 16, borderRadius: 12,
                      border: `2px dashed ${S.border}`, background: 'transparent', cursor: 'pointer',
                      color: S.muted, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 8, fontFamily: 'inherit', fontSize: 13, fontWeight: 500 }}>
                    {previews.length > 0 ? <><Plus size={14}/> Add another</> : <><Upload size={16}/> Choose images</>}
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
