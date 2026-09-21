"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * The particle field behind /deck. One cloud of points morphs between four
 * arrangements as the story advances, so the visual carries the argument:
 *
 *   0  a calm shell           the cover, before anything is said
 *   1  scattered far and wide the problem: data leaking out of the building
 *   2  a dense knot           the answer: one platform, assembled
 *   3  a lattice in a cube    ownership: contained inside your perimeter
 *
 * DeckView writes `state.current` on scroll; this component only reads it.
 */
export interface DeckSceneState {
  /** Target arrangement, 0..3, fractions blend between neighbours. */
  morph: number;
  /** Page scroll progress 0..1, drives the slow yaw. */
  scroll: number;
  /** Pointer tilt -1..1, desktop only. */
  px: number;
  py: number;
}

const VERTEX = /* glsl */ `
  attribute vec3 aP1;
  attribute vec3 aP2;
  attribute vec3 aP3;
  attribute float aSeed;
  uniform float uTime;
  uniform float uMorph;
  uniform float uPixel;
  uniform float uSize;
  uniform float uMotion;
  uniform vec3 uC0;
  uniform vec3 uC1;
  uniform vec3 uC2;
  uniform vec3 uC3;
  varying vec3 vColor;
  varying float vAlpha;

  vec3 posAt(int s) {
    if (s == 0) return position;
    if (s == 1) return aP1;
    if (s == 2) return aP2;
    return aP3;
  }
  vec3 colAt(int s) {
    if (s == 0) return uC0;
    if (s == 1) return uC1;
    if (s == 2) return uC2;
    return uC3;
  }

  void main() {
    float m = clamp(uMorph, 0.0, 3.0);
    int a = int(floor(min(m, 2.999)));
    int b = a + 1;
    float f = m - float(a);
    // Points travel in waves keyed to their seed, not all at once.
    float t = smoothstep(0.0, 1.0, clamp((f - aSeed * 0.35) / 0.65, 0.0, 1.0));
    vec3 p = mix(posAt(a), posAt(b), t);
    // A slight outward bulge mid-flight so a morph reads as motion, not a slide.
    p += normalize(p + vec3(0.0001)) * sin(t * 3.14159) * 0.5;
    // Idle breathing.
    float w = uTime * 0.7 + aSeed * 6.2831;
    p += vec3(sin(w * 1.3), cos(w * 0.9), sin(w * 1.1)) * (0.02 + 0.06 * uMotion);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = (1.5 + aSeed * 2.1) * uSize * uPixel * (9.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
    vColor = mix(colAt(a), colAt(b), t);
    vAlpha = 0.3 + 0.42 * aSeed;
  }
`;

const FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.08, d);
    gl_FragColor = vec4(vColor, a * vAlpha);
  }
`;

/** The four arrangements, generated once from a fixed seed. */
function buildField(count: number) {
  const p0 = new Float32Array(count * 3);
  const p1 = new Float32Array(count * 3);
  const p2 = new Float32Array(count * 3);
  const p3 = new Float32Array(count * 3);
  const seed = new Float32Array(count);

  let s = 20260921;
  const rnd = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };

  // Lattice: k^3 slots, visited through a coprime stride so a point count
  // below k^3 still fills the cube evenly instead of leaving a corner empty.
  const k = Math.ceil(Math.cbrt(count));
  const slots = k * k * k;
  const side = 3.4;
  const step = side / (k - 1);

  for (let i = 0; i < count; i++) {
    const o = i * 3;
    seed[i] = rnd();

    // 0: a soft shell.
    const u = rnd() * 2 - 1;
    const th = rnd() * Math.PI * 2;
    const r0 = 2.35 + (rnd() - 0.5) * 0.4;
    const sq = Math.sqrt(1 - u * u);
    p0[o] = r0 * sq * Math.cos(th);
    p0[o + 1] = r0 * u;
    p0[o + 2] = r0 * sq * Math.sin(th);

    // 1: scattered well beyond the frame.
    p1[o] = (rnd() - 0.5) * 18;
    p1[o + 1] = (rnd() - 0.5) * 12;
    p1[o + 2] = (rnd() - 0.5) * 9;

    // 2: a fuzzy torus knot (p = 2, q = 3), seen face on.
    const t = rnd() * Math.PI * 2;
    const ring = 1.85 + Math.cos(3 * t);
    const kx = ring * Math.cos(2 * t);
    const ky = ring * Math.sin(2 * t);
    const kz = Math.sin(3 * t);
    const tube = 0.55 * Math.cbrt(rnd());
    const uu = rnd() * 2 - 1;
    const ph = rnd() * Math.PI * 2;
    const sq2 = Math.sqrt(1 - uu * uu);
    p2[o] = (kx + tube * sq2 * Math.cos(ph)) * 0.82;
    p2[o + 1] = (ky + tube * sq2 * Math.sin(ph)) * 0.82;
    p2[o + 2] = (kz + tube * uu) * 0.82;

    // 3: the lattice.
    const g = (i * 7919) % slots;
    const gx = g % k;
    const gy = Math.floor(g / k) % k;
    const gz = Math.floor(g / (k * k));
    p3[o] = -side / 2 + gx * step + (rnd() - 0.5) * 0.04;
    p3[o + 1] = -side / 2 + gy * step + (rnd() - 0.5) * 0.04;
    p3[o + 2] = -side / 2 + gz * step + (rnd() - 0.5) * 0.04;
  }

  return { p0, p1, p2, p3, seed };
}

export default function DeckScene({
  state,
}: {
  state: { current: DeckSceneState };
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const mobile = window.innerWidth < 768;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      // No WebGL: the CSS gradient on the host is the whole background.
      return;
    }
    const pixelRatio = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
    renderer.setPixelRatio(pixelRatio);
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    const group = new THREE.Group();
    scene.add(group);

    // ── The field ────────────────────────────────────────────────────
    const count = mobile ? 4500 : 9000;
    const field = buildField(count);
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(field.p0, 3));
    geometry.setAttribute("aP1", new THREE.BufferAttribute(field.p1, 3));
    geometry.setAttribute("aP2", new THREE.BufferAttribute(field.p2, 3));
    geometry.setAttribute("aP3", new THREE.BufferAttribute(field.p3, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(field.seed, 1));

    const uniforms = {
      uTime: { value: 0 },
      uMorph: { value: state.current.morph },
      uPixel: { value: pixelRatio },
      uSize: { value: mobile ? 1.7 : 1 },
      uMotion: { value: reduced ? 0 : 1 },
      uC0: { value: new THREE.Color(0.55, 0.78, 1.0) }, // calm, arctic
      uC1: { value: new THREE.Color(0.99, 0.58, 0.4) }, // leaking, ember
      uC2: { value: new THREE.Color(0.24, 0.86, 0.62) }, // assembled, emerald
      uC3: { value: new THREE.Color(0.68, 0.96, 0.84) }, // contained, mint
    };
    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const points = new THREE.Points(geometry, material);
    points.frustumCulled = false;
    group.add(points);

    // ── The perimeter: a cube that only appears around the lattice ───
    const cubeGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(3.7, 3.7, 3.7));
    const cubeMat = new THREE.LineBasicMaterial({
      color: 0x6ee7b7,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const cube = new THREE.LineSegments(cubeGeo, cubeMat);
    cube.visible = false;
    group.add(cube);

    // ── Fit: keep the field inside the frame on any aspect ratio ─────
    const fit = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      const halfTan = Math.tan(THREE.MathUtils.degToRad(22.5));
      camera.position.z = 3.4 / (halfTan * Math.min(camera.aspect, 1));
      camera.updateProjectionMatrix();
    };
    fit();
    window.addEventListener("resize", fit);

    // ── Loop ─────────────────────────────────────────────────────────
    const timer = new THREE.Timer();
    let time = 0;
    let smooth = state.current.morph;
    let raf = 0;
    let running = false;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      timer.update();
      const dt = Math.min(timer.getDelta(), 0.05);
      time += dt;
      const s = state.current;
      // The field lags the scroll a little, which reads as mass.
      smooth += (s.morph - smooth) * Math.min(1, dt * 3.5);
      uniforms.uTime.value = time;
      uniforms.uMorph.value = smooth;
      group.rotation.y =
        (reduced ? 0 : time * 0.06) + s.scroll * 2.4 + s.px * 0.2;
      group.rotation.x =
        0.2 + (reduced ? 0 : Math.sin(time * 0.15) * 0.04) - s.py * 0.12;
      const inCube = Math.max(0, 1 - Math.abs(smooth - 3));
      cube.visible = inCube > 0.01;
      cubeMat.opacity = inCube * 0.4;
      renderer.render(scene, camera);
    };
    const start = () => {
      if (running) return;
      running = true;
      timer.update();
      frame();
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("resize", fit);
      geometry.dispose();
      material.dispose();
      cubeGeo.dispose();
      cubeMat.dispose();
      renderer.dispose();
      if (host.contains(renderer.domElement)) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [state]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className="fixed inset-0 z-0 pointer-events-none"
      style={{
        background:
          "radial-gradient(60% 50% at 50% 35%, rgba(16, 60, 100, 0.35), transparent 70%), radial-gradient(40% 40% at 85% 90%, rgba(16, 185, 129, 0.10), transparent 70%), #040a18",
      }}
    />
  );
}
