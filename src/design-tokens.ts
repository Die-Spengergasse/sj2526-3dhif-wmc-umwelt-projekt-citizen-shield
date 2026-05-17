export const S = {
  bg:        '#f0e9da',
  paper:     '#fbf7ec',
  paperHi:   '#faf3e1',
  paperLo:   '#e8dfc8',
  paperSunk: '#dfd4ba',
  ink:       '#1f1a13',
  inkSoft:   '#3a3127',
  ash:       '#8a7e6d',
  muted:     '#6b5f4f',
  rule:      'rgba(31,26,19,0.10)',
  ruleMd:    'rgba(31,26,19,0.18)',
  ruleSoft:  'rgba(31,26,19,0.05)',
  primary:   '#a44a3a',
  primaryDim:'#c66856',
  secondary: '#3d6b78',
  tertiary:  '#7a8e5a',
  warn:      '#c48a3e',
  surf0:     '#ebe2cd',
  surf1:     '#fbf7ec',
  surf2:     '#f5efde',
  surf3:     '#e8dfc8',
  surf4:     '#dfd4ba',
  text:      '#1f1a13',
  border:    'rgba(31,26,19,0.10)',
  borderMd:  'rgba(31,26,19,0.18)',
} as const;

export const INTENSITY = {
  CRITICAL: { color: S.primary,   label: 'Critical', tone: 'rgba(164,74,58,0.10)'  },
  HIGH:     { color: S.warn,      label: 'High',     tone: 'rgba(196,138,62,0.12)' },
  ALERT:    { color: S.tertiary,  label: 'Alert',    tone: 'rgba(122,142,90,0.12)' },
  STABLE:   { color: S.secondary, label: 'Stable',   tone: 'rgba(61,107,120,0.12)' },
} as const;

export type IntensityKey = keyof typeof INTENSITY;

// Coords fallback per region slug — used by Leaflet map
export const REGION_COORDS: Record<string, { lat: number; lng: number; zoom: number }> = {
  nepal:   { lat: 28.1, lng: 84.1, zoom: 6 },
  myanmar: { lat: 19.0, lng: 96.5, zoom: 6 },
  sudan:   { lat: 15.6, lng: 30.2, zoom: 5 },
  iran:    { lat: 32.4, lng: 53.7, zoom: 5 },
  georgia: { lat: 42.0, lng: 43.5, zoom: 7 },
};
