"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

// ── Simplex noise (GPU) ──────────────────────────────────────────────
const NOISE_GLSL = /* glsl */ `
  vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;}
  vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
  vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
  float snoise(vec3 v){
    const vec2 C=vec2(1./6.,1./3.);
    const vec4 D=vec4(0.,.5,1.,2.);
    vec3 i=floor(v+dot(v,C.yyy));
    vec3 x0=v-i+dot(i,C.xxx);
    vec3 g=step(x0.yzx,x0.xyz);
    vec3 l=1.-g;
    vec3 i1=min(g,l.zxy);
    vec3 i2=max(g,l.zxy);
    vec3 x1=x0-i1+C.xxx;
    vec3 x2=x0-i2+C.yyy;
    vec3 x3=x0-D.yyy;
    i=mod289(i);
    vec4 p=permute(permute(permute(
      i.z+vec4(0.,i1.z,i2.z,1.))
      +i.y+vec4(0.,i1.y,i2.y,1.))
      +i.x+vec4(0.,i1.x,i2.x,1.));
    float n_=.142857142857;
    vec3 ns=n_*D.wyz-D.xzx;
    vec4 j=p-49.*floor(p*ns.z*ns.z);
    vec4 x_=floor(j*ns.z);
    vec4 y_=floor(j-7.*x_);
    vec4 x=x_*ns.x+ns.yyyy;
    vec4 y=y_*ns.x+ns.yyyy;
    vec4 h=1.-abs(x)-abs(y);
    vec4 b0=vec4(x.xy,y.xy);
    vec4 b1=vec4(x.zw,y.zw);
    vec4 s0=floor(b0)*2.+1.;
    vec4 s1=floor(b1)*2.+1.;
    vec4 sh=-step(h,vec4(0.));
    vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;
    vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
    vec3 p0=vec3(a0.xy,h.x);
    vec3 p1=vec3(a0.zw,h.y);
    vec3 p2=vec3(a1.xy,h.z);
    vec3 p3=vec3(a1.zw,h.w);
    vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
    p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
    vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);
    m=m*m;
    return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
  }
`;

export default function OceanScene() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // ── Renderer ───────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.6;
    container.appendChild(renderer.domElement);

    // ── Scene ──────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x060e1f, 0.016);
    scene.background = new THREE.Color(0x060e1f);

    // ── Camera ─────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      500
    );
    camera.position.set(0, 4.5, 18);
    camera.lookAt(0, 0, -10);

    // ── Lights ─────────────────────────────────────────────────────────
    const ambientLight = new THREE.AmbientLight(0x0a1830, 0.6);
    scene.add(ambientLight);

    const moonLight = new THREE.DirectionalLight(0x3355aa, 0.6);
    moonLight.position.set(-8, 15, -20);
    scene.add(moonLight);

    // Rim light from below horizon
    const rimLight = new THREE.DirectionalLight(0x112244, 0.3);
    rimLight.position.set(0, -3, -30);
    scene.add(rimLight);

    // Lightning
    const lightningLight = new THREE.PointLight(0xddeeff, 0, 200);
    lightningLight.position.set(0, 25, -30);
    scene.add(lightningLight);

    // ── Cloud layer (storm clouds) ─────────────────────────────────────
    const cloudGeo = new THREE.PlaneGeometry(200, 200, 1, 1);
    const cloudMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
        }
      `,
      fragmentShader: `
        ${NOISE_GLSL}
        uniform float uTime;
        varying vec2 vUv;
        void main(){
          vec2 uv = vUv * 3.0;
          float t = uTime * 0.02;
          float n = snoise(vec3(uv.x + t, uv.y, t * 0.5)) * 0.5 + 0.5;
          n *= snoise(vec3(uv.x * 2.0 + t * 0.3, uv.y * 2.0, t)) * 0.5 + 0.5;
          float edge = 1.0 - smoothstep(0.3, 0.5, length(vUv - 0.5));
          float alpha = n * 0.35 * edge;
          gl_FragColor = vec4(0.02, 0.04, 0.08, alpha);
        }
      `,
    });
    const clouds = new THREE.Mesh(cloudGeo, cloudMat);
    clouds.rotation.x = -Math.PI / 2;
    clouds.position.y = 20;
    scene.add(clouds);

    // ── Ocean ──────────────────────────────────────────────────────────
    const oceanGeo = new THREE.PlaneGeometry(120, 120, 256, 256);
    const oceanMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uLightning: { value: 0.0 },
        uCamPos: { value: camera.position },
        uMoonDir: { value: new THREE.Vector3(-0.3, 0.6, -0.7).normalize() },
      },
      vertexShader: `
        ${NOISE_GLSL}
        uniform float uTime;
        varying vec2 vUv;
        varying float vElevation;
        varying vec3 vWorldPos;
        varying vec3 vNormal;

        void main(){
          vUv = uv;
          vec3 pos = position;
          float t = uTime * 0.35;

          // Layered ocean waves
          float w1 = snoise(vec3(pos.x*0.04, pos.y*0.06, t*0.4)) * 2.2;
          float w2 = snoise(vec3(pos.x*0.1 + 3.0, pos.y*0.08, t*0.6)) * 0.9;
          float w3 = snoise(vec3(pos.x*0.25, pos.y*0.2, t*0.9)) * 0.3;
          float w4 = snoise(vec3(pos.x*0.6, pos.y*0.5, t*1.4)) * 0.08;

          float elevation = w1 + w2 + w3 + w4;
          pos.z = elevation;
          vElevation = elevation;

          // Compute normal from neighbors
          float eps = 0.2;
          float hR = snoise(vec3((pos.x+eps)*0.04, pos.y*0.06, t*0.4))*2.2
                   + snoise(vec3((pos.x+eps)*0.1+3.0, pos.y*0.08, t*0.6))*0.9;
          float hU = snoise(vec3(pos.x*0.04, (pos.y+eps)*0.06, t*0.4))*2.2
                   + snoise(vec3(pos.x*0.1+3.0, (pos.y+eps)*0.08, t*0.6))*0.9;
          vec3 tangent = normalize(vec3(eps, 0.0, hR - elevation));
          vec3 bitangent = normalize(vec3(0.0, eps, hU - elevation));
          vNormal = normalize(cross(tangent, bitangent));

          vec4 worldPos = modelMatrix * vec4(pos, 1.0);
          vWorldPos = worldPos.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPos;
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform float uLightning;
        uniform vec3 uCamPos;
        uniform vec3 uMoonDir;
        varying vec2 vUv;
        varying float vElevation;
        varying vec3 vWorldPos;
        varying vec3 vNormal;

        void main(){
          // Deep ocean colors — navy, not black
          vec3 deep    = vec3(0.02, 0.04, 0.10);
          vec3 mid     = vec3(0.04, 0.08, 0.18);
          vec3 surface = vec3(0.06, 0.12, 0.25);

          float mixF = smoothstep(-2.0, 2.0, vElevation);
          vec3 color = mix(deep, mid, mixF);
          color = mix(color, surface, smoothstep(0.5, 2.0, vElevation));

          // Specular (moonlight reflection on waves)
          vec3 viewDir = normalize(uCamPos - vWorldPos);
          vec3 halfDir = normalize(uMoonDir + viewDir);
          float spec = pow(max(dot(vNormal, halfDir), 0.0), 80.0);
          color += vec3(0.2, 0.25, 0.4) * spec * 3.0;

          // Broader specular lobe for ambient moon glow on water
          float specBroad = pow(max(dot(vNormal, halfDir), 0.0), 12.0);
          color += vec3(0.01, 0.015, 0.03) * specBroad;

          // Broad diffuse moon reflection
          float diffMoon = max(dot(vNormal, uMoonDir), 0.0);
          color += vec3(0.01, 0.02, 0.04) * diffMoon;

          // Foam / whitecaps on crests
          float foam = smoothstep(1.4, 2.2, vElevation);
          color += vec3(0.08, 0.1, 0.14) * foam;

          // Sub-surface scattering on wave crests
          float sss = smoothstep(0.0, 2.0, vElevation) * max(dot(vNormal, vec3(0.0,1.0,0.0)), 0.0);
          color += vec3(0.01, 0.025, 0.05) * sss;

          // Distance fade — to dark navy horizon, not black
          float dist = length(vWorldPos.xz) * 0.015;
          color = mix(color, vec3(0.025, 0.04, 0.09), clamp(dist, 0.0, 0.85));

          // Lightning flash
          color += vec3(0.12, 0.14, 0.2) * uLightning * (0.5 + spec * 3.0);

          gl_FragColor = vec4(color, 1.0);
        }
      `,
      side: THREE.DoubleSide,
    });
    const ocean = new THREE.Mesh(oceanGeo, oceanMat);
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -1;
    scene.add(ocean);

    // ── Rain (heavy particles) ─────────────────────────────────────────
    const RAIN_COUNT = 12000;
    const rainGeo = new THREE.BufferGeometry();
    const rPos = new Float32Array(RAIN_COUNT * 3);
    const rVel = new Float32Array(RAIN_COUNT);
    for (let i = 0; i < RAIN_COUNT; i++) {
      rPos[i * 3] = (Math.random() - 0.5) * 80;
      rPos[i * 3 + 1] = Math.random() * 35;
      rPos[i * 3 + 2] = (Math.random() - 0.5) * 80;
      rVel[i] = 0.35 + Math.random() * 0.45;
    }
    rainGeo.setAttribute("position", new THREE.BufferAttribute(rPos, 3));

    const rainMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uLightning: { value: 0 },
      },
      vertexShader: `
        varying float vAlpha;
        void main(){
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          float dist = -mvPos.z;
          vAlpha = smoothstep(80.0, 5.0, dist) * 0.5;
          gl_PointSize = max(1.0, 2.5 - dist * 0.02);
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uLightning;
        varying float vAlpha;
        void main(){
          vec3 color = mix(vec3(0.4, 0.55, 0.7), vec3(0.7, 0.8, 0.9), uLightning);
          gl_FragColor = vec4(color, vAlpha);
        }
      `,
    });
    const rain = new THREE.Points(rainGeo, rainMat);
    scene.add(rain);

    // ── Rain streaks (line segments for motion blur) ───────────────────
    const STREAK_COUNT = 4000;
    const streakGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(STREAK_COUNT * 6);
    const sVel = new Float32Array(STREAK_COUNT);
    for (let i = 0; i < STREAK_COUNT; i++) {
      const x = (Math.random() - 0.5) * 70;
      const y = Math.random() * 30;
      const z = (Math.random() - 0.5) * 70;
      sPos[i * 6] = x;
      sPos[i * 6 + 1] = y;
      sPos[i * 6 + 2] = z;
      sPos[i * 6 + 3] = x + 0.03;
      sPos[i * 6 + 4] = y - (0.5 + Math.random() * 0.7);
      sPos[i * 6 + 5] = z;
      sVel[i] = 0.4 + Math.random() * 0.5;
    }
    streakGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));

    const streakMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uLightning: { value: 0 } },
      vertexShader: `
        varying float vAlpha;
        void main(){
          vec4 mvPos = modelViewMatrix * vec4(position,1.0);
          float dist = -mvPos.z;
          vAlpha = smoothstep(80.0, 3.0, dist) * 0.25;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        uniform float uLightning;
        varying float vAlpha;
        void main(){
          vec3 col = mix(vec3(0.3,0.45,0.6), vec3(0.6,0.7,0.8), uLightning * 0.5);
          gl_FragColor = vec4(col, vAlpha);
        }
      `,
    });
    const streaks = new THREE.LineSegments(streakGeo, streakMat);
    scene.add(streaks);

    // ── Splash / spray on ocean surface ────────────────────────────────
    const SPLASH_COUNT = 600;
    const splashGeo = new THREE.BufferGeometry();
    const spPos = new Float32Array(SPLASH_COUNT * 3);
    const spLife = new Float32Array(SPLASH_COUNT);
    for (let i = 0; i < SPLASH_COUNT; i++) {
      spPos[i * 3] = (Math.random() - 0.5) * 60;
      spPos[i * 3 + 1] = -0.5 + Math.random() * 0.6;
      spPos[i * 3 + 2] = (Math.random() - 0.5) * 60;
      spLife[i] = Math.random();
    }
    splashGeo.setAttribute("position", new THREE.BufferAttribute(spPos, 3));
    const splashMat = new THREE.PointsMaterial({
      color: 0x99bbdd,
      size: 0.15,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const splashes = new THREE.Points(splashGeo, splashMat);
    scene.add(splashes);

    // ── Wolffish silhouettes ───────────────────────────────────────────
    function makeWolffishBody(): THREE.Shape {
      const s = new THREE.Shape();
      // Menacing elongated body with strong jaw
      s.moveTo(0, 0);
      // Upper jaw (wolffish have powerful jaws)
      s.bezierCurveTo(0.15, 0.08, 0.3, 0.15, 0.5, 0.18);
      // Head bump
      s.bezierCurveTo(0.7, 0.28, 0.9, 0.38, 1.2, 0.42);
      // Dorsal line (wolffish have continuous dorsal fin)
      s.bezierCurveTo(1.8, 0.5, 2.8, 0.52, 3.6, 0.45);
      // Taper to tail
      s.bezierCurveTo(4.2, 0.35, 4.6, 0.2, 5.0, 0.08);
      // Tail fork
      s.lineTo(5.4, 0.25);
      s.lineTo(5.6, 0.0);
      s.lineTo(5.4, -0.25);
      s.lineTo(5.0, -0.08);
      // Lower body
      s.bezierCurveTo(4.6, -0.18, 4.2, -0.28, 3.6, -0.32);
      s.bezierCurveTo(2.8, -0.35, 1.8, -0.32, 1.2, -0.28);
      // Belly
      s.bezierCurveTo(0.9, -0.25, 0.7, -0.2, 0.5, -0.15);
      // Lower jaw
      s.bezierCurveTo(0.3, -0.1, 0.15, -0.05, 0, 0);
      return s;
    }

    function makeDorsalFin(): THREE.Shape {
      const s = new THREE.Shape();
      s.moveTo(0.9, 0.4);
      s.bezierCurveTo(1.3, 0.72, 2.0, 0.78, 2.8, 0.74);
      s.bezierCurveTo(3.4, 0.68, 4.0, 0.58, 4.5, 0.46);
      s.lineTo(4.5, 0.42);
      s.bezierCurveTo(4.0, 0.5, 3.4, 0.55, 2.8, 0.55);
      s.bezierCurveTo(2.0, 0.55, 1.3, 0.5, 0.9, 0.4);
      return s;
    }

    function makePectoralFin(): THREE.Shape {
      const s = new THREE.Shape();
      s.moveTo(1.0, -0.2);
      s.bezierCurveTo(1.1, -0.45, 1.3, -0.55, 1.5, -0.5);
      s.bezierCurveTo(1.4, -0.35, 1.2, -0.25, 1.0, -0.2);
      return s;
    }

    interface FishState {
      group: THREE.Group;
      baseSpeed: number;
      speed: number;
      amp: number;
      phase: number;
      yBase: number;
      zBase: number;
      direction: number;
      wobbleFreq: number;
      wobbleAmp: number;
      driftFreq: number;
      driftAmp: number;
      surgePhase: number;
      surgeFreq: number;
      glideTimer: number;
      gliding: boolean;
    }
    const fishes: FishState[] = [];

    const fishConfigs = [
      { scale: 0.9, y: -1.2, z: 2, opacity: 0.6 },
      { scale: 0.75, y: -1.5, z: -2, opacity: 0.55 },
      { scale: 1.1, y: -1.8, z: -8, opacity: 0.45 },
      { scale: 0.5, y: -2.0, z: -5, opacity: 0.4 },
      { scale: 0.7, y: -1.4, z: -12, opacity: 0.35 },
      { scale: 0.4, y: -2.5, z: -18, opacity: 0.25 },
      { scale: 0.8, y: -3.0, z: -25, opacity: 0.18 },
    ];

    for (let i = 0; i < fishConfigs.length; i++) {
      const cfg = fishConfigs[i];
      const group = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({
        color: 0x0a1525,
        transparent: true,
        opacity: cfg.opacity,
        side: THREE.DoubleSide,
        depthTest: false,
      });

      const body = new THREE.Mesh(new THREE.ShapeGeometry(makeWolffishBody()), mat);
      const dorsal = new THREE.Mesh(new THREE.ShapeGeometry(makeDorsalFin()), mat.clone());
      const pectoral = new THREE.Mesh(new THREE.ShapeGeometry(makePectoralFin()), mat.clone());
      body.renderOrder = 2;
      dorsal.renderOrder = 2;
      pectoral.renderOrder = 2;
      group.add(body, dorsal, pectoral);

      // Red glowing eye — always on
      const eyeGeo = new THREE.CircleGeometry(0.04, 16);
      const eyeMat = new THREE.MeshBasicMaterial({
        color: 0xff3333,
        transparent: true,
        opacity: cfg.opacity,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      const eye = new THREE.Mesh(eyeGeo, eyeMat);
      eye.position.set(0.35, 0.05, 0.01);
      eye.renderOrder = 3;
      group.add(eye);

      const glowGeo = new THREE.CircleGeometry(0.12, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xaa1111,
        transparent: true,
        opacity: cfg.opacity * 0.35,
        depthTest: false,
        blending: THREE.AdditiveBlending,
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.position.set(0.35, 0.05, 0.005);
      glow.renderOrder = 3;
      group.add(glow);

      const direction = i % 2 === 0 ? 1 : -1;
      group.scale.set(cfg.scale * direction, cfg.scale, cfg.scale);

      group.position.set(
        (Math.random() - 0.5) * 30,
        cfg.y,
        cfg.z
      );

      scene.add(group);
      fishes.push({
        group,
        baseSpeed: 0.3 + Math.random() * 0.5,
        speed: 0.3 + Math.random() * 0.5,
        amp: 0.12 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2,
        yBase: cfg.y,
        zBase: cfg.z,
        direction,
        wobbleFreq: 1.0 + Math.random() * 1.5,
        wobbleAmp: 0.02 + Math.random() * 0.04,
        driftFreq: 0.15 + Math.random() * 0.2,
        driftAmp: 0.3 + Math.random() * 0.5,
        surgePhase: Math.random() * Math.PI * 2,
        surgeFreq: 0.08 + Math.random() * 0.12,
        glideTimer: 5 + Math.random() * 15,
        gliding: false,
      });
    }

    // ── Crab silhouette ──
    function buildCrabGroup(opacity: number): THREE.Group {
      const group = new THREE.Group();
      const mat = new THREE.MeshBasicMaterial({
        color: 0x0c1a2e, transparent: true, opacity,
        side: THREE.DoubleSide, depthTest: false,
      });
      const lineMat = new THREE.LineBasicMaterial({
        color: 0x0c1a2e, transparent: true, opacity: opacity * 0.9,
        depthTest: false,
      });

      // ─ Body: rounded oval carapace ─
      const body = new THREE.Shape();
      body.moveTo(0, 0.1);
      body.bezierCurveTo(-0.15, 0.14, -0.32, 0.12, -0.38, 0.04);
      body.bezierCurveTo(-0.42, -0.02, -0.38, -0.1, -0.28, -0.14);
      body.bezierCurveTo(-0.15, -0.17, 0, -0.16, 0, -0.16);
      body.bezierCurveTo(0, -0.16, 0.15, -0.17, 0.28, -0.14);
      body.bezierCurveTo(0.38, -0.1, 0.42, -0.02, 0.38, 0.04);
      body.bezierCurveTo(0.32, 0.12, 0.15, 0.14, 0, 0.1);
      const bodyMesh = new THREE.Mesh(new THREE.ShapeGeometry(body), mat);
      bodyMesh.renderOrder = 2;
      group.add(bodyMesh);

      // ─ 4 walking legs per side ─
      const legData = [
        [0.3, 0.06,  0.48, 0.16,  0.56, 0.06],
        [0.34, 0.0,  0.52, 0.06,  0.62, -0.02],
        [0.34, -0.06, 0.50, -0.12, 0.58, -0.22],
        [0.28, -0.1,  0.42, -0.2,  0.48, -0.32],
      ];
      for (const side of [-1, 1]) {
        for (const [ax, ay, kx, ky, tx, ty] of legData) {
          const pts = new Float32Array([
            ax, ay * side, 0, kx, ky * side, 0,
            kx, ky * side, 0, tx, ty * side, 0,
          ]);
          const geo = new THREE.BufferGeometry();
          geo.setAttribute("position", new THREE.BufferAttribute(pts, 3));
          const leg = new THREE.LineSegments(geo, lineMat.clone());
          leg.renderOrder = 2;
          group.add(leg);
        }
      }

      // ─ Claws ─
      for (const side of [-1, 1]) {
        const s = side;
        const arm = new THREE.Shape();
        arm.moveTo(-0.18, s * 0.08);
        arm.lineTo(-0.3, s * 0.12);
        arm.lineTo(-0.38, s * 0.14);
        // Upper pincer
        arm.lineTo(-0.48, s * 0.2);
        arm.lineTo(-0.52, s * 0.16);
        arm.lineTo(-0.46, s * 0.12);
        // Gap
        arm.lineTo(-0.42, s * 0.11);
        // Lower pincer
        arm.lineTo(-0.48, s * 0.06);
        arm.lineTo(-0.46, s * 0.03);
        arm.lineTo(-0.4, s * 0.08);
        // Back
        arm.lineTo(-0.32, s * 0.06);
        arm.lineTo(-0.18, s * 0.08);
        const armMesh = new THREE.Mesh(new THREE.ShapeGeometry(arm), mat.clone());
        armMesh.renderOrder = 2;
        group.add(armMesh);
      }

      // ─ Eye stalks + glowing eyes ─
      for (const side of [-1, 1]) {
        const stalkPts = new Float32Array([
          -0.06, side * 0.08, 0,
          -0.14, side * 0.14, 0,
        ]);
        const stalkGeo = new THREE.BufferGeometry();
        stalkGeo.setAttribute("position", new THREE.BufferAttribute(stalkPts, 3));
        const stalk = new THREE.LineSegments(stalkGeo, lineMat.clone());
        stalk.renderOrder = 2;
        group.add(stalk);

        const eyeMesh = new THREE.Mesh(
          new THREE.CircleGeometry(0.025, 8),
          new THREE.MeshBasicMaterial({
            color: 0x44ff88, transparent: true, opacity: opacity * 1.2,
            depthTest: false, blending: THREE.AdditiveBlending,
          })
        );
        eyeMesh.position.set(-0.14, side * 0.14, 0.01);
        eyeMesh.renderOrder = 3;
        group.add(eyeMesh);

        const glowMesh = new THREE.Mesh(
          new THREE.CircleGeometry(0.06, 8),
          new THREE.MeshBasicMaterial({
            color: 0x22aa44, transparent: true, opacity: opacity * 0.25,
            depthTest: false, blending: THREE.AdditiveBlending,
          })
        );
        glowMesh.position.set(-0.14, side * 0.14, 0.005);
        glowMesh.renderOrder = 3;
        group.add(glowMesh);
      }

      return group;
    }

    interface CrabState {
      group: THREE.Group;
      baseSpeed: number;
      speed: number;
      phase: number;
      xBase: number;
      direction: number;
      state: "idle" | "scurry" | "freeze" | "wander";
      stateTimer: number;
      bobFreq: number;
      bobAmp: number;
      tiltAmp: number;
      legAnimSpeed: number;
    }
    const crabs: CrabState[] = [];

    const CRAB_COUNT = 12;
    for (let i = 0; i < CRAB_COUNT; i++) {
      const opacity = 0.3 + Math.random() * 0.2;
      const group = buildCrabGroup(opacity);

      const scale = 0.35 + Math.random() * 0.3;
      const direction = i % 2 === 0 ? 1 : -1;
      group.scale.set(scale * direction, scale, scale);

      const xBase = (Math.random() - 0.5) * 50;
      group.position.set(xBase, -1.0, 1 + Math.random() * 10);

      scene.add(group);
      crabs.push({
        group,
        baseSpeed: 2.0 + Math.random() * 2.5,
        speed: 2.0 + Math.random() * 2.5,
        phase: Math.random() * Math.PI * 2,
        xBase,
        direction,
        state: "scurry",
        stateTimer: 0.5 + Math.random() * 1.5,
        bobFreq: 12 + Math.random() * 8,
        bobAmp: 0.03 + Math.random() * 0.03,
        tiltAmp: 0.08 + Math.random() * 0.08,
        legAnimSpeed: 14 + Math.random() * 10,
      });
    }

    // ── Mist layer above ocean ─────────────────────────────────────────
    const mistGeo = new THREE.PlaneGeometry(100, 100, 1, 1);
    const mistMat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec2 vUv;
        void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }
      `,
      fragmentShader: `
        ${NOISE_GLSL}
        uniform float uTime;
        varying vec2 vUv;
        void main(){
          float n = snoise(vec3(vUv * 4.0 + uTime*0.03, uTime*0.01));
          float edge = 1.0 - smoothstep(0.25, 0.5, length(vUv - 0.5));
          float alpha = max(0.0, n) * 0.12 * edge;
          gl_FragColor = vec4(0.03, 0.05, 0.1, alpha);
        }
      `,
    });
    const mist = new THREE.Mesh(mistGeo, mistMat);
    mist.rotation.x = -Math.PI / 2;
    mist.position.y = 0.5;
    scene.add(mist);

    // ── Animation loop ─────────────────────────────────────────────────
    let time = 0;
    let lightningTimer = 0;
    let lightningIntensity = 0;
    let lightningBurstCount = 0;
    let animId: number;

    function animate() {
      animId = requestAnimationFrame(animate);
      const dt = 0.016;
      time += dt;

      // Ocean
      oceanMat.uniforms.uTime.value = time;
      oceanMat.uniforms.uCamPos.value.copy(camera.position);

      // Clouds
      cloudMat.uniforms.uTime.value = time;

      // Mist
      mistMat.uniforms.uTime.value = time;

      // ── Lightning ────────────────────────────────────────────────────
      lightningTimer -= dt;
      if (lightningTimer <= 0) {
        if (lightningBurstCount > 0) {
          // Multi-flash burst
          lightningIntensity = 0.5 + Math.random() * 0.8;
          lightningTimer = 0.04 + Math.random() * 0.08;
          lightningBurstCount--;
        } else if (Math.random() < 0.002) {
          // Start a new burst (2–4 flashes)
          lightningBurstCount = 1 + Math.floor(Math.random() * 3);
          lightningIntensity = 1.0;
          lightningTimer = 0.05;
          lightningLight.position.set(
            (Math.random() - 0.5) * 40,
            18 + Math.random() * 12,
            -15 - Math.random() * 25
          );
        } else {
          lightningIntensity *= 0.88;
        }
      }
      lightningLight.intensity = lightningIntensity * 80;
      oceanMat.uniforms.uLightning.value = lightningIntensity;
      (rainMat.uniforms as Record<string, THREE.IUniform>).uLightning.value = lightningIntensity;
      (streakMat.uniforms as Record<string, THREE.IUniform>).uLightning.value = lightningIntensity;

      // Flash the sky during lightning
      const skyBase = 0x060e1f;
      const r = ((skyBase >> 16) & 0xff) / 255;
      const g = ((skyBase >> 8) & 0xff) / 255;
      const b = (skyBase & 0xff) / 255;
      scene.background = new THREE.Color(
        r + lightningIntensity * 0.06,
        g + lightningIntensity * 0.08,
        b + lightningIntensity * 0.12
      );

      // ── Rain particles ───────────────────────────────────────────────
      const rp = rainGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < RAIN_COUNT; i++) {
        rp[i * 3 + 1] -= rVel[i];
        // Slight wind
        rp[i * 3] += 0.02;
        if (rp[i * 3 + 1] < -2) {
          rp[i * 3] = (Math.random() - 0.5) * 80;
          rp[i * 3 + 1] = 30 + Math.random() * 5;
          rp[i * 3 + 2] = (Math.random() - 0.5) * 80;
        }
      }
      rainGeo.attributes.position.needsUpdate = true;

      // ── Rain streaks ─────────────────────────────────────────────────
      const sp = streakGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < STREAK_COUNT; i++) {
        const fall = sVel[i];
        sp[i * 6 + 1] -= fall;
        sp[i * 6 + 4] -= fall;
        sp[i * 6] += 0.02;
        sp[i * 6 + 3] += 0.02;
        if (sp[i * 6 + 1] < -2) {
          const x = (Math.random() - 0.5) * 70;
          const y = 25 + Math.random() * 8;
          const z = (Math.random() - 0.5) * 70;
          const len = 0.5 + Math.random() * 0.7;
          sp[i * 6] = x;
          sp[i * 6 + 1] = y;
          sp[i * 6 + 2] = z;
          sp[i * 6 + 3] = x + 0.03;
          sp[i * 6 + 4] = y - len;
          sp[i * 6 + 5] = z;
        }
      }
      streakGeo.attributes.position.needsUpdate = true;

      // ── Splashes ─────────────────────────────────────────────────────
      const spp = splashGeo.attributes.position.array as Float32Array;
      for (let i = 0; i < SPLASH_COUNT; i++) {
        spLife[i] -= 0.025;
        if (spLife[i] <= 0) {
          spp[i * 3] = (Math.random() - 0.5) * 60;
          spp[i * 3 + 1] = -0.5 + Math.random() * 0.5;
          spp[i * 3 + 2] = (Math.random() - 0.5) * 60;
          spLife[i] = 0.3 + Math.random() * 0.7;
        }
      }
      splashGeo.attributes.position.needsUpdate = true;

      // ── Fish (varied swimming) ──────────────────────────────────────
      for (let fi = 0; fi < fishes.length; fi++) {
        const f = fishes[fi];

        // Glide timer — fish occasionally coast
        f.glideTimer -= dt;
        if (f.glideTimer <= 0) {
          f.gliding = !f.gliding;
          f.glideTimer = f.gliding
            ? 2 + Math.random() * 4
            : 4 + Math.random() * 10;
        }

        // Speed surges — smooth acceleration/deceleration
        const surge = 0.7 + 0.3 * Math.sin(time * f.surgeFreq + f.surgePhase);
        f.speed = f.gliding
          ? f.baseSpeed * 0.3 * surge
          : f.baseSpeed * surge;

        // Horizontal movement
        f.group.position.x += f.direction * f.speed * dt;

        // Vertical — layered sine waves for organic swimming
        const yWave1 = Math.sin(time * 0.3 + f.phase) * f.amp;
        const yWave2 = Math.sin(time * 0.7 + f.phase * 1.3) * f.amp * 0.3;
        const yWave3 = Math.sin(time * f.driftFreq + f.phase * 2.1) * f.driftAmp;
        f.group.position.y = f.yBase + yWave1 + yWave2 + yWave3;

        // Depth drift
        f.group.position.z = f.zBase + Math.sin(time * 0.1 + f.phase * 0.7) * 1.5;

        // Body wobble — tail-wagging effect
        const wobbleSpeed = f.gliding ? f.wobbleFreq * 0.4 : f.wobbleFreq;
        f.group.rotation.z = Math.sin(time * wobbleSpeed + f.phase) * f.wobbleAmp;

        // Slight pitch when ascending/descending
        const yVel = (yWave1 + yWave2) * 0.3;
        f.group.rotation.x = yVel * 0.05 * f.direction;

        // Eye glow — subtle flowing pulse
        const eyeMesh = f.group.children[3] as THREE.Mesh;
        const glowMesh = f.group.children[4] as THREE.Mesh;
        if (eyeMesh?.material) {
          const slow = Math.sin(time * (0.4 + fi * 0.07) + f.phase) * 0.12;
          const med = Math.sin(time * (1.1 + fi * 0.13) + f.phase * 2.3) * 0.06;
          const flow = 0.75 + slow + med;
          (eyeMesh.material as THREE.MeshBasicMaterial).opacity =
            fishConfigs[fi].opacity * flow;
          (glowMesh.material as THREE.MeshBasicMaterial).opacity =
            fishConfigs[fi].opacity * 0.4 * flow;
        }

        // Wrap
        if (f.direction > 0 && f.group.position.x > 35) f.group.position.x = -35;
        if (f.direction < 0 && f.group.position.x < -35) f.group.position.x = 35;
      }

      // ── Crabs (state machine — nervous, flighty) ────────────────────
      for (const c of crabs) {
        c.stateTimer -= dt;

        if (c.stateTimer <= 0) {
          const roll = Math.random();
          if (c.state === "idle") {
            if (roll < 0.55) {
              c.state = "scurry";
              c.stateTimer = 0.8 + Math.random() * 2.0;
              c.direction = Math.random() > 0.5 ? 1 : -1;
              c.speed = c.baseSpeed * (1.8 + Math.random() * 1.2);
              c.group.scale.x = Math.abs(c.group.scale.x) * c.direction;
            } else if (roll < 0.8) {
              c.state = "wander";
              c.stateTimer = 1.0 + Math.random() * 2.0;
              c.speed = c.baseSpeed * (0.5 + Math.random() * 0.4);
            } else {
              c.state = "freeze";
              c.stateTimer = 0.3 + Math.random() * 1.0;
            }
          } else if (c.state === "scurry") {
            if (roll < 0.4) {
              c.state = "scurry";
              c.direction *= -1;
              c.group.scale.x = Math.abs(c.group.scale.x) * c.direction;
              c.speed = c.baseSpeed * (2.0 + Math.random() * 1.5);
              c.stateTimer = 0.5 + Math.random() * 1.5;
            } else if (roll < 0.7) {
              c.state = "freeze";
              c.stateTimer = 0.2 + Math.random() * 0.8;
            } else {
              c.state = "idle";
              c.stateTimer = 0.5 + Math.random() * 2.0;
            }
          } else {
            if (roll < 0.6) {
              c.state = "scurry";
              c.stateTimer = 0.6 + Math.random() * 2.0;
              c.direction = Math.random() > 0.5 ? 1 : -1;
              c.speed = c.baseSpeed * (1.5 + Math.random() * 1.5);
              c.group.scale.x = Math.abs(c.group.scale.x) * c.direction;
            } else {
              c.state = "idle";
              c.stateTimer = 0.3 + Math.random() * 1.5;
            }
          }
        }

        if (c.state === "scurry") {
          c.group.position.x += c.direction * c.speed * dt;
          c.group.position.y = -1.0 + Math.sin(time * c.bobFreq + c.phase) * c.bobAmp * 2.0;
          c.group.rotation.z = Math.sin(time * c.legAnimSpeed + c.phase) * c.tiltAmp;
        } else if (c.state === "wander") {
          c.group.position.x += c.direction * c.speed * dt;
          c.group.position.y = -1.0 + Math.sin(time * c.bobFreq * 0.5 + c.phase) * c.bobAmp * 0.8;
          c.group.rotation.z = Math.sin(time * 2.0 + c.phase) * 0.04;
          if (Math.random() < 0.008) {
            c.direction *= -1;
            c.group.scale.x = Math.abs(c.group.scale.x) * c.direction;
          }
        } else if (c.state === "freeze") {
          c.group.rotation.z = Math.sin(time * 25 + c.phase) * 0.008;
        } else {
          c.group.rotation.z = Math.sin(time * 1.0 + c.phase) * 0.02;
          c.group.position.y = -1.0 + Math.sin(time * 1.2 + c.phase) * 0.008;
        }

        if (c.group.position.x > 35) c.group.position.x = -35;
        if (c.group.position.x < -35) c.group.position.x = 35;
      }

      // ── Camera sway ─────────────────────────────────────────────────
      camera.position.x = Math.sin(time * 0.08) * 0.6;
      camera.position.y = 4.5 + Math.sin(time * 0.12) * 0.25;
      camera.lookAt(0, -0.5, -8);

      renderer.render(scene, camera);
    }

    animate();

    // ── Resize ─────────────────────────────────────────────────────────
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animId);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}
