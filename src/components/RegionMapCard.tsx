import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { S, REGION_COORDS } from '../design-tokens';
import { Region } from '../types';

interface RegionMapCardProps {
  region: Region;
}

const RegionMap: React.FC<RegionMapCardProps> = ({ region }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

    const { lat, lng, zoom } = REGION_COORDS[region.slug] || { lat: 20, lng: 40, zoom: 4 };

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      keyboard: false,
    }).setView([lat, lng], zoom);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    const pulsingIcon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:28px;height:28px;">
        <div style="position:absolute;inset:0;border-radius:50%;background:rgba(164,74,58,0.25);animation:warm-pulse 1.8s ease-in-out infinite;"></div>
        <div style="position:absolute;inset:6px;border-radius:50%;background:#a44a3a;border:3px solid #fbf7ec;box-shadow:0 4px 12px rgba(164,74,58,0.4);"></div>
      </div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker([lat, lng], { icon: pulsingIcon }).addTo(map);

    const safeIcon = L.divIcon({
      className: '',
      html: `<div style="width:10px;height:10px;border-radius:50%;background:#3d6b78;border:2px solid #fbf7ec;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [10, 10],
      iconAnchor: [5, 5],
    });
    ([[0.4, -0.5], [-0.6, 0.8], [0.9, 1.2]] as [number, number][]).forEach(([dlat, dlng]) => {
      L.marker([lat + dlat, lng + dlng], { icon: safeIcon }).addTo(map);
    });

    L.circle([lat, lng], {
      radius: 80000, color: '#a44a3a', fillColor: '#a44a3a',
      fillOpacity: 0.06, weight: 1.5, dashArray: '4 6',
    }).addTo(map);

    mapRef.current = map;
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [region.slug]);

  return (
    <div ref={containerRef} style={{
      width: '100%', height: '100%',
      filter: 'sepia(0.12) saturate(0.85) contrast(0.95) hue-rotate(-6deg)',
    }} />
  );
};

export const RegionMapCard: React.FC<RegionMapCardProps> = ({ region }) => (
  <div style={{ background: S.paper, border: `1px solid ${S.rule}`, borderRadius: 16, overflow: 'hidden' }}>
    <div style={{ padding: '14px 18px', borderBottom: `1px solid ${S.ruleSoft}`,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: S.ash, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
        Community map
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: S.tertiary, display: 'inline-block' }}
          className="warm-pulse" />
        <span style={{ fontSize: 9, fontWeight: 700, color: S.tertiary, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
          Live
        </span>
      </div>
    </div>
    <div style={{ position: 'relative', height: 260 }}>
      <RegionMap key={region.slug} region={region} />
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 999,
        background: 'rgba(251,247,236,0.92)', backdropFilter: 'blur(8px)',
        padding: '5px 11px', borderRadius: 30, border: `1px solid ${S.rule}`,
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: S.primary, textTransform: 'uppercase', letterSpacing: '0.16em' }}>
          {region.name}
        </span>
      </div>
      <div style={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 999,
        background: 'rgba(251,247,236,0.92)', backdropFilter: 'blur(8px)',
        padding: '8px 12px', borderRadius: 10, border: `1px solid ${S.rule}`,
        display: 'flex', flexDirection: 'column', gap: 5,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: S.primary,
            border: `2px solid ${S.paper}`, display: 'inline-block' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            Crisis Hub
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: S.secondary,
            border: `1.5px solid ${S.paper}`, display: 'inline-block' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.14em' }}>
            Safe Zone
          </span>
        </div>
      </div>
    </div>
  </div>
);
