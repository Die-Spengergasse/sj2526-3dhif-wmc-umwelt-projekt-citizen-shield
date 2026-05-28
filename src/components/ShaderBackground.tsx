import React, { useEffect, useRef } from 'react';

/**
 * Animated WebGL fragment shader — domain-warped fbm noise that drifts
 * through the Citizen Shield earth-tone palette. Pure GLSL, no three.js.
 *
 * Renders a fixed full-viewport canvas behind page content.
 */

const VERT = `
attribute vec2 a_pos;
void main() {
  gl_Position = vec4(a_pos, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform vec2  u_res;
uniform float u_time;
uniform vec2  u_mouse;
uniform vec3  u_accent;

// Cheap hash -> 2d gradient
vec2 hash22(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)),
           dot(p, vec2(269.5, 183.3)));
  return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
}

// Gradient noise (perlin-ish)
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(dot(hash22(i + vec2(0.0, 0.0)), f - vec2(0.0, 0.0)),
        dot(hash22(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
    mix(dot(hash22(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
        dot(hash22(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x),
    u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.80, 0.60, -0.60, 0.80);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.03;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res.xy;
  vec2 p  = uv * 2.0 - 1.0;
  p.x *= u_res.x / u_res.y;

  float t = u_time * 0.06;

  // Subtle parallax toward the cursor
  vec2 m = (u_mouse / u_res.xy) * 2.0 - 1.0;
  p += m * 0.12;

  // Domain warping — gives the fluid, marbled look
  vec2 q = vec2(fbm(p + t),
                fbm(p + vec2(5.2, 1.3) + t));

  vec2 r = vec2(fbm(p + 3.4 * q + vec2(1.7, 9.2) + t * 1.3),
                fbm(p + 3.4 * q + vec2(8.3, 2.8) + t * 1.5));

  float f = fbm(p + 3.4 * r);

  // Brand palette — earth tones from design-tokens
  vec3 paper = vec3(0.941, 0.913, 0.854);   // #f0e9da bg
  vec3 sand  = vec3(0.984, 0.969, 0.925);   // #fbf7ec paper
  vec3 clay  = vec3(0.643, 0.290, 0.227);   // #a44a3a primary
  vec3 sea   = vec3(0.239, 0.420, 0.471);   // #3d6b78 secondary
  vec3 moss  = vec3(0.478, 0.557, 0.353);   // #7a8e5a tertiary
  vec3 amber = vec3(0.769, 0.541, 0.243);   // #c48a3e warn

  // Base wash, slightly tilted top-to-bottom
  vec3 col = mix(sand, paper, uv.y);

  // Color bands — driven by the warped field
  col = mix(col, u_accent, smoothstep(-0.05, 0.55, f * 1.3) * 0.55);
  col = mix(col, sea,      smoothstep(0.18, 0.85, length(q))    * 0.32);
  col = mix(col, moss,     smoothstep(0.30, 0.95, length(r))    * 0.18);
  col = mix(col, amber,    smoothstep(0.45, 0.95, q.x * r.y + 0.5) * 0.20);
  col = mix(col, clay,     smoothstep(0.55, 1.10, abs(f) * 1.8) * 0.22);

  // Iridescent highlight band — slow horizontal sweep
  float band = smoothstep(0.0, 0.5, sin(uv.y * 6.0 + t * 2.0 + f * 3.0));
  col += band * 0.04 * vec3(1.0, 0.85, 0.65);

  // Film grain
  float grain = fract(sin(dot(uv * u_res.xy + t * 60.0,
                              vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * 0.035;

  // Vignette
  float d = length(p) * 0.7;
  float vig = smoothstep(1.55, 0.30, d);
  col *= mix(0.74, 1.02, vig);

  gl_FragColor = vec4(col, 1.0);
}
`;

interface ShaderBackgroundProps {
  /** Optional override of the accent color (rgb 0..1). Defaults to #a44a3a. */
  accent?: [number, number, number];
}

export const ShaderBackground: React.FC<ShaderBackgroundProps> = ({
  accent = [0.643, 0.290, 0.227],
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, premultipliedAlpha: false }) as WebGLRenderingContext | null;
    if (!gl) return; // gracefully bail — the page still renders fine on top of a CSS fallback

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.warn('Shader compile error:', gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn('Program link error:', gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // Fullscreen triangle (covers the clip-space quad with no overdraw)
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       3, -1,
      -1,  3,
    ]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(prog, 'a_pos');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes    = gl.getUniformLocation(prog, 'u_res');
    const uTime   = gl.getUniformLocation(prog, 'u_time');
    const uMouse  = gl.getUniformLocation(prog, 'u_mouse');
    const uAccent = gl.getUniformLocation(prog, 'u_accent');
    gl.uniform3f(uAccent, accent[0], accent[1], accent[2]);

    let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width  = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const mouse = { x: 0, y: 0 };
    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX * dpr;
      mouse.y = (window.innerHeight - e.clientY) * dpr;
    };
    window.addEventListener('pointermove', onMove);

    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, t);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(tick);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buf);
    };
  }, [accent]);

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
        // CSS fallback in case WebGL fails — soft gradient in the same palette
        background:
          'radial-gradient(120% 80% at 30% 20%, #fbf7ec 0%, #f0e9da 45%, #e8dfc8 100%)',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
};
