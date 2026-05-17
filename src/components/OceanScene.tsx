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
