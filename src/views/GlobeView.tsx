import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import * as topojson from 'topojson-client';
import { Loader2, Globe } from 'lucide-react';
import { S, INTENSITY } from '../design-tokens';
import { Reveal, AmbientGlow } from '../motion';
import { Region } from '../types';

interface GlobeViewProps {
  regions: Region[];
  onRegionSelect?: (index: number) => void;
  onViewChange?: (view: string) => void;
}

const GLOBE_REGIONS = [
  { slug: 'nepal',   lat: 27.7, lng: 85.3,  label: 'NEPAL',   intensity: 'CRITICAL' as const },
  { slug: 'myanmar', lat: 16.9, lng: 96.2,  label: 'MYANMAR', intensity: 'HIGH'     as const },
  { slug: 'sudan',   lat: 15.5, lng: 32.6,  label: 'SUDAN',   intensity: 'CRITICAL' as const },
  { slug: 'iran',    lat: 35.7, lng: 51.4,  label: 'IRAN',    intensity: 'HIGH'     as const },
  { slug: 'georgia', lat: 41.7, lng: 44.8,  label: 'GEORGIA', intensity: 'ALERT'   as const },
];

const MARKER_COLORS: Record<string, number> = {
  CRITICAL: 0xa44a3a, HIGH: 0xc77b3a, ALERT: 0x7a8e5a, STABLE: 0x3d6b78,
};
const MARKER_HEX: Record<string, string> = {
  CRITICAL: '#a44a3a', HIGH: '#c77b3a', ALERT: '#7a8e5a', STABLE: '#3d6b78',
};
const INTENSITY_SPEED: Record<string, number> = {
  CRITICAL: 0.55, HIGH: 0.4, ALERT: 0.3, STABLE: 0.22,
};
const INTENSITY_RANGE: Record<string, number> = {
  CRITICAL: 1.6, HIGH: 1.3, ALERT: 1.1, STABLE: 0.9,
};

function createOrbitControls(camera: THREE.Camera, domElement: HTMLElement) {
  const state = { theta: 0.4, phi: 1.3, radius: 5.2, targetTheta: 0.4, targetPhi: 1.3, targetRadius: 5.2 };
  let isDragging = false, lastX = 0, lastY = 0, lastInteract = Date.now();
  const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

  const updateCam = () => {
    camera.position.x = state.radius * Math.sin(state.phi) * Math.cos(state.theta);
    camera.position.y = state.radius * Math.cos(state.phi);
    camera.position.z = state.radius * Math.sin(state.phi) * Math.sin(state.theta);
    camera.lookAt(0, 0, 0);
  };

  const onDown = (e: MouseEvent) => { isDragging = true; lastX = e.clientX; lastY = e.clientY; lastInteract = Date.now(); domElement.style.cursor = 'grabbing'; };
  const onMove = (e: MouseEvent) => {
    if (!isDragging) return;
    state.targetTheta -= (e.clientX - lastX) * 0.004;
    state.targetPhi = clamp(state.targetPhi + (e.clientY - lastY) * 0.004, 0.2, Math.PI - 0.2);
    lastX = e.clientX; lastY = e.clientY;
  };
  const onUp = () => { isDragging = false; lastInteract = Date.now(); domElement.style.cursor = 'grab'; };
  const onWheel = (e: WheelEvent) => { e.preventDefault(); state.targetRadius = clamp(state.targetRadius + e.deltaY * 0.008, 3, 9); lastInteract = Date.now(); };

  const onTouchStart = (e: TouchEvent) => { if (e.touches.length === 1) { isDragging = true; lastX = e.touches[0].clientX; lastY = e.touches[0].clientY; lastInteract = Date.now(); } };
  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && isDragging) {
      state.targetTheta -= (e.touches[0].clientX - lastX) * 0.004;
      state.targetPhi = clamp(state.targetPhi + (e.touches[0].clientY - lastY) * 0.004, 0.2, Math.PI - 0.2);
      lastX = e.touches[0].clientX; lastY = e.touches[0].clientY;
    }
  };
  const onTouchEnd = () => { isDragging = false; lastInteract = Date.now(); };

  domElement.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  domElement.addEventListener('wheel', onWheel, { passive: false });
  domElement.addEventListener('touchstart', onTouchStart, { passive: true });
  domElement.addEventListener('touchmove', onTouchMove, { passive: false });
  domElement.addEventListener('touchend', onTouchEnd);

  return {
    update() {
      state.theta  += (state.targetTheta  - state.theta)  * 0.1;
      state.phi    += (state.targetPhi    - state.phi)    * 0.1;
      state.radius += (state.targetRadius - state.radius) * 0.1;
      if (!isDragging && Date.now() - lastInteract > 4000) state.targetTheta -= 0.0015;
      updateCam();
    },
    dispose() {
      domElement.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      domElement.removeEventListener('wheel', onWheel);
      domElement.removeEventListener('touchstart', onTouchStart);
      domElement.removeEventListener('touchmove', onTouchMove);
      domElement.removeEventListener('touchend', onTouchEnd);
    },
  };
}

function latLngToVec3(lat: number, lng: number, r = 2) {
  const phi   = (90 - lat)  * Math.PI / 180;
  const theta = (lng + 180) * Math.PI / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
     r * Math.cos(phi),
     r * Math.sin(phi) * Math.sin(theta),
  );
}

function buildEarthTexture(topojsonData: object): HTMLCanvasElement {
  const W = 2048, H = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const oceanGrad = ctx.createLinearGradient(0, 0, 0, H);
  oceanGrad.addColorStop(0,   '#6a8a98');
  oceanGrad.addColorStop(0.4, '#4a6878');
  oceanGrad.addColorStop(0.6, '#4a6878');
  oceanGrad.addColorStop(1,   '#6a8a98');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, W, H);

  for (let y = 0; y < H; y++) {
    const lat = 90 - (y / H) * 180;
    const polar = Math.abs(lat) > 65 ? 1 - (Math.abs(lat) - 65) / 25 * 0.3 : 1;
    if (polar < 1) {
      ctx.fillStyle = `rgba(245,240,232,${(1 - polar) * 0.6})`;
      ctx.fillRect(0, y, W, 1);
    }
  }

  const project = (lng: number, lat: number): [number, number] => [
    ((lng + 180) / 360) * W,
    ((90 - lat) / 180) * H,
  ];

  const world = topojsonData as Parameters<typeof topojson.feature>[0];
  const land = topojson.feature(world, (world as any).objects.countries) as unknown as GeoJSON.FeatureCollection;

  const drawPath = (rings: number[][][], fill: string | null, stroke: string | null) => {
    rings.forEach(ring => {
      if (ring.length < 2) return;
      ctx.beginPath();
      ring.forEach(([lng, lat], i) => {
        const [x, y] = project(lng, lat);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      });
      ctx.closePath();
      if (fill)   { ctx.fillStyle = fill;     ctx.fill(); }
      if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 0.7; ctx.stroke(); }
    });
  };

  land.features.forEach(f => {
    const geom = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    polys.forEach(rings => drawPath(rings as number[][][], 'rgba(80,60,40,0.18)', null));
  });

  ctx.save();
  ctx.translate(-1, -1);
  land.features.forEach(f => {
    const geom = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    polys.forEach(rings => drawPath(rings as number[][][], '#b8a575', '#8a7a55'));
  });
  ctx.restore();

  ctx.globalAlpha = 0.4;
  land.features.forEach(f => {
    const geom = f.geometry as GeoJSON.Polygon | GeoJSON.MultiPolygon;
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    polys.forEach(rings => drawPath(rings as number[][][], null, '#5a4a30'));
  });
  ctx.globalAlpha = 1;

  return canvas;
}

export const GlobeView: React.FC<GlobeViewProps> = ({ regions, onRegionSelect, onViewChange }) => {
  const mountRef     = useRef<HTMLDivElement>(null);
  const frameRef     = useRef<number>(0);
  const [hovered, setHovered] = useState<string | null>(null);
  const [loaded,  setLoaded]  = useState(false);
  const [error,   setError]   = useState(false);
  const onSelectRef = useRef(onRegionSelect);
  const onViewRef   = useRef(onViewChange);
  useEffect(() => { onSelectRef.current = onRegionSelect; }, [onRegionSelect]);
  useEffect(() => { onViewRef.current   = onViewChange;   }, [onViewChange]);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) { setError(true); return; }

    const w = el.clientWidth, h = el.clientHeight;

    const scene    = new THREE.Scene();
    const camera   = new THREE.PerspectiveCamera(42, w / h, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.borderRadius = '20px';

    scene.add(new THREE.AmbientLight(0xfff0d8, 0.40));
    const sun = new THREE.DirectionalLight(0xfff3da, 0.95);
    sun.position.set(5, 3, 5);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0x9ab5c8, 0.25);
    fill.position.set(-5, -2, -5);
    scene.add(fill);

    const globeGeo = new THREE.SphereGeometry(2, 96, 96);
    const globeMat = new THREE.MeshPhongMaterial({ color: 0x7a9aa8, emissive: 0x000000, specular: 0x334455, shininess: 6 });
    const globe = new THREE.Mesh(globeGeo, globeMat);
    scene.add(globe);

    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(2.10, 64, 64),
      new THREE.MeshBasicMaterial({ color: 0xb8a575, transparent: true, opacity: 0.08, side: THREE.BackSide }),
    ));
    scene.add(new THREE.Mesh(
      new THREE.SphereGeometry(2.22, 32, 32),
      new THREE.MeshBasicMaterial({ color: 0xc9d5d5, transparent: true, opacity: 0.04, side: THREE.BackSide }),
    ));

    fetch('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(r => r.json())
      .then(world => {
        const canvas = buildEarthTexture(world);
        const W = canvas.width, H = canvas.height;
        const data = canvas.getContext('2d')!.getImageData(0, 0, W, H).data;

        const positions: number[] = [];
        const colors: number[]    = [];
        const STEP = 5;
        const RR   = 2.05;
        for (let py = 0; py < H; py += STEP) {
          const lat = 90 - (py / H) * 180;
          const cosLat = Math.max(0.05, Math.cos(lat * Math.PI / 180));
          const step = Math.max(STEP, Math.round(STEP / cosLat));
          for (let px = 0; px < W; px += step) {
            const i = (py * W + px) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            if (r > 130 && g > 100 && r > b + 18) {
              const lng = (px / W) * 360 - 180;
              const v = latLngToVec3(lat, lng, RR);
              positions.push(v.x, v.y, v.z);
              const lum = r / 255;
              colors.push(0.74 * lum, 0.66 * lum, 0.47 * lum);
            }
          }
        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geom.setAttribute('color',    new THREE.Float32BufferAttribute(colors, 3));
        const landPoints = new THREE.Points(geom, new THREE.PointsMaterial({
          size: 4, vertexColors: true, sizeAttenuation: false,
          transparent: false, depthTest: true, depthWrite: true,
        }));
        landPoints.renderOrder = 1;
        scene.add(landPoints);

        const oceanMat = new THREE.MeshPhongMaterial({ color: 0x456a78, specular: 0x334455, shininess: 8 });
        const oldMat = globe.material as THREE.Material;
        globe.material = oceanMat;
        if (oldMat && oldMat.dispose) oldMat.dispose();
      })
      .catch(err => console.error('[globe] fetch failed:', err));

    type MarkerData = {
      hitMesh: THREE.Mesh; spike: THREE.Mesh; dot: THREE.Mesh;
      halo: THREE.Mesh; base: THREE.Mesh;
      rc: typeof GLOBE_REGIONS[number]; speed: number; range: number;
    };

    const meshes: MarkerData[] = [];
    GLOBE_REGIONS.forEach((rc, i) => {
      const pos  = latLngToVec3(rc.lat, rc.lng, 2.02);
      const norm = pos.clone().normalize();
      const color = MARKER_COLORS[rc.intensity] || 0xa44a3a;

      const spikeMat = new THREE.MeshBasicMaterial({ color, transparent: true });
      const spike = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.003, 0.24, 6), spikeMat);
      spike.position.copy(norm.clone().multiplyScalar(2.02 + 0.12));
      spike.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), norm);
      spike.renderOrder = 3;
      scene.add(spike);

      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 16), new THREE.MeshBasicMaterial({ color }));
      dot.position.copy(norm.clone().multiplyScalar(2.02 + 0.24));
      dot.renderOrder = 3;
      scene.add(dot);

      const haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28, depthWrite: false });
      const halo = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.11, 32), haloMat);
      halo.position.copy(norm.clone().multiplyScalar(2.02 + 0.24));
      halo.lookAt(norm.clone().multiplyScalar(10));
      halo.renderOrder = 3;
      scene.add(halo);

      const baseMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false });
      const base = new THREE.Mesh(new THREE.RingGeometry(0.065, 0.082, 32), baseMat);
      base.position.copy(norm.clone().multiplyScalar(2.02 + 0.24));
      base.lookAt(norm.clone().multiplyScalar(10));
      base.renderOrder = 3;
      scene.add(base);

      const hitMesh = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        new THREE.MeshBasicMaterial({ visible: false }),
      );
      hitMesh.position.copy(norm.clone().multiplyScalar(2.18));
      hitMesh.userData = { regionIndex: i, slug: rc.slug };
      scene.add(hitMesh);
      meshes.push({ hitMesh, spike, dot, halo, base, rc, speed: INTENSITY_SPEED[rc.intensity] || 0.3, range: INTENSITY_RANGE[rc.intensity] || 1.1 });
    });

    const controls = createOrbitControls(camera, renderer.domElement);

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredIdx = -1;

    const onMouseMove = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(meshes.map(m => m.hitMesh));
      if (hits.length) {
        const idx = hits[0].object.userData.regionIndex as number;
        if (idx !== hoveredIdx) { hoveredIdx = idx; setHovered(GLOBE_REGIONS[idx].slug); renderer.domElement.style.cursor = 'pointer'; }
      } else if (hoveredIdx !== -1) {
        hoveredIdx = -1; setHovered(null); renderer.domElement.style.cursor = 'grab';
      }
    };

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left)  / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)   / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(meshes.map(m => m.hitMesh));
      if (hits.length) {
        const idx = hits[0].object.userData.regionIndex as number;
        onSelectRef.current?.(idx);
        onViewRef.current?.('regions');
      }
    };

    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('click', onClick);
    renderer.domElement.style.cursor = 'grab';

    const onResize = () => {
      if (!mountRef.current) return;
      const nw = mountRef.current.clientWidth, nh = mountRef.current.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    let t = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.016;
      controls.update();

      meshes.forEach(({ dot, halo, base, spike, speed, range }, i) => {
        const p = 0.95 + 0.06 * Math.sin(t * 1.2 * speed + i * 1.2);
        dot.scale.setScalar(p);
        const haloP = ((t * 0.35 * speed) + i * 0.4) % 1;
        halo.scale.setScalar(1 + haloP * range);
        (halo.material as THREE.MeshBasicMaterial).opacity = 0.4 * (1 - haloP);
        (base.material as THREE.MeshBasicMaterial).opacity = 0.55;
        (spike.material as THREE.MeshBasicMaterial).opacity = 0.85;
      });

      renderer.render(scene, camera);
    };
    animate();
    setLoaded(true);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('click', onClick);
      controls.dispose();
      renderer.dispose();
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
      <header style={{ position: 'relative', paddingTop: 8 }}>
        <AmbientGlow size={520} color="rgba(196,138,62,0.28)" style={{ top: -160, left: '40%', transform: 'translateX(-50%)', zIndex: -1 }} />
        <Reveal>
          <p style={{ fontSize: 10, fontWeight: 700, color: S.primary, textTransform: 'uppercase',
            letterSpacing: '0.18em', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 24, height: 1, background: 'currentColor',
              verticalAlign: 'middle', opacity: 0.5 }} />
            Interactive Globe
          </p>
        </Reveal>
        <Reveal delay={80}>
          <h1 style={{ fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 'clamp(2.6rem, 7vw, 5.4rem)', fontWeight: 400, color: S.ink,
            letterSpacing: '-0.03em', lineHeight: 0.94, margin: 0 }}>
            Five regions on <em style={{ fontStyle: 'italic', color: S.primary }}>one Earth.</em>
          </h1>
        </Reveal>
        <Reveal delay={180}>
          <p style={{ fontSize: 16, color: S.muted, maxWidth: 560, lineHeight: 1.6, marginTop: 18 }}>
            All {GLOBE_REGIONS.length} active crisis regions mapped on a live, rotating Earth. Drag to spin, scroll to zoom, tap any marker to open its dashboard.
          </p>
        </Reveal>
      </header>

      <div ref={mountRef} style={{
        position: 'relative', borderRadius: 20, overflow: 'hidden',
        height: 'min(58vh, 560px)', minHeight: 340,
        background: 'radial-gradient(ellipse at 35% 40%, #ebe2cd 0%, #d8cdb3 60%, #c6b89a 100%)',
        border: `1px solid ${S.borderMd}`,
        boxShadow: '0 24px 60px -16px rgba(89,46,28,0.25), inset 0 2px 24px rgba(80,60,40,0.10)',
      }}>
        {!loaded && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Loader2 size={40} style={{ color: S.muted }} />
            <p style={{ fontSize: 12, fontWeight: 600, color: S.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Initialising Earth…
            </p>
          </div>
        )}
        {error && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8, padding: 32, textAlign: 'center' }}>
            <Globe size={60} style={{ color: S.muted, opacity: 0.2 }} />
            <p style={{ fontSize: 13, color: S.muted }}>3D not available — check your connection and reload.</p>
          </div>
        )}

        {hovered && (() => {
          const rc     = GLOBE_REGIONS.find(r => r.slug === hovered);
          const region = regions?.find(r => r.slug === hovered);
          if (!rc || !region) return null;
          return (
            <div style={{
              position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
              background: S.paper, border: `1px solid ${S.borderMd}`, borderRadius: 14, padding: '10px 20px',
              boxShadow: '0 12px 32px rgba(80,60,40,0.18)', pointerEvents: 'none', whiteSpace: 'nowrap', zIndex: 10,
            }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: S.ink, marginBottom: 3 }}>{rc.label}</p>
              <p style={{ fontSize: 11, color: S.muted }}>{region.activeHubs} hubs · {region.connectivity}% signal · {rc.intensity}</p>
              <p style={{ fontSize: 10, color: S.primary, marginTop: 2, fontWeight: 600 }}>Tap to open →</p>
            </div>
          );
        })()}

        <div style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(251,247,236,0.85)', backdropFilter: 'blur(8px)',
          borderRadius: 10, padding: '5px 11px', border: `1px solid ${S.borderMd}`,
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: S.ink, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            {GLOBE_REGIONS.length} Active Zones
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10 }}>
        {GLOBE_REGIONS.map((rc, i) => {
          const region = regions?.find(r => r.slug === rc.slug);
          const color  = MARKER_HEX[rc.intensity] || S.primary;
          const active = hovered === rc.slug;
          return (
            <button key={rc.slug} onClick={() => { onRegionSelect?.(i); onViewChange?.('regions'); }}
              style={{
                padding: '12px 14px', borderRadius: 14,
                border: `1px solid ${active ? S.primary : S.border}`,
                background: active ? `${S.primary}10` : S.paper,
                cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                fontFamily: 'inherit', minHeight: 64,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = S.paperHi; (e.currentTarget as HTMLButtonElement).style.borderColor = S.borderMd; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = active ? `${S.primary}10` : S.paper; (e.currentTarget as HTMLButtonElement).style.borderColor = active ? S.primary : S.border; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}80` }} />
                <span style={{ fontWeight: 700, fontSize: 12, color: S.ink, letterSpacing: '-0.01em' }}>{rc.label}</span>
              </div>
              {region && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>{rc.intensity}</p>
                  <p style={{ fontSize: 10, color: S.muted }}>{region.activeHubs} hubs · {region.connectivity}%</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
