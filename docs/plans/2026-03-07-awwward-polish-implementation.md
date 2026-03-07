# Awwward Polish — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Elevate mikechen.xyz public site from wireframe to Awwward-level polish in one shot — OGL shaders, ink transitions, atmospheric particles, image treatment, UI fixes.

**Architecture:** Single shared OGL WebGL2 canvas renders behind HTML content. Scroll position from Framer Motion feeds into shader uniforms via React context. CSS handles image masks and minor animations. Framer Motion still handles text reveals and parallax.

**Tech Stack:** Next.js 16, OGL (WebGL2), GLSL shaders, Framer Motion, Tailwind v4, CSS SVG filters

**Design doc:** `docs/plans/2026-03-07-awwward-polish-design.md`

---

## Task 1: Install OGL + Create Parchment Texture

**Files:**
- Modify: `package.json`
- Create: `public/textures/parchment-seamless.png`
- Modify: `src/app/globals.css:108-123`

**Step 1: Install OGL**

```bash
cd /Users/mac/prod/me.io && npm install ogl
```

**Step 2: Generate parchment texture**

Create a seamless parchment paper texture (512x512 PNG) using the nanobanana skill or source one. It should look like handmade washi paper — warm cream color, visible fibers, slight discoloration. Save to `public/textures/parchment-seamless.png`.

**Step 3: Replace SVG noise overlay with real texture in globals.css**

Replace the `body::after` block (lines 113-123) with:

```css
body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.18;
  background-image: url("/textures/parchment-seamless.png");
  background-size: 512px 512px;
  background-repeat: repeat;
  mix-blend-mode: multiply;
}
```

**Step 4: Verify**

```bash
cd /Users/mac/prod/me.io && npm run build
```

Expected: Build succeeds. The parchment texture tiles across the body.

**Step 5: Commit**

```bash
git add package.json package-lock.json public/textures/ src/app/globals.css
git commit -m "feat: install OGL, replace SVG noise with real parchment texture"
```

---

## Task 2: OGL Canvas Infrastructure — GLCanvas + ScrollContext

**Files:**
- Create: `src/components/gl/GLCanvas.tsx`
- Create: `src/components/gl/shaders/noise.glsl`
- Create: `src/components/gl/shaders/ink-wash.vert`
- Create: `src/components/gl/shaders/ink-wash.frag`
- Modify: `src/app/(public)/layout.tsx`
- Delete: `src/components/ink/InkWashBackground.tsx`

**Step 1: Create shared Simplex noise GLSL**

Create `src/components/gl/shaders/noise.glsl`:

This is the Ashima Arts Simplex noise implementation (MIT license, standard in WebGL). It provides `snoise(vec2)` and `snoise(vec3)` used by all our shaders.

```glsl
// Simplex 2D/3D noise — Ashima Arts (MIT)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                      -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                           + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                           dot(x12.zw,x12.zw)), 0.0);
  m = m*m;
  m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
```

**Step 2: Create vertex shader**

Create `src/components/gl/shaders/ink-wash.vert`:

```glsl
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0, 1);
}
```

**Step 3: Create ink wash fragment shader**

Create `src/components/gl/shaders/ink-wash.frag`:

This replaces the Canvas 2D `InkWashBackground`. It renders ~20 soft metaballs that drift organically, with smooth Gaussian falloff. Scroll velocity shifts the blobs slightly.

```glsl
precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uScrollVelocity;
uniform vec2 uResolution;

// Inline noise (copy from noise.glsl — GLSL has no #include)
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){
  const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
  vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1;
  i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
  vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);
  vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
  vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
  m=m*m;m=m*m;
  vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;
  m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
  vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;
  return 130.0*dot(m,g);
}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 st = vec2(uv.x * aspect, uv.y);

  float ink = 0.0;
  float t = uTime * 0.0003;
  float scrollShift = uScrollVelocity * 0.002;

  // 20 metaball-like ink blobs
  for (int i = 0; i < 20; i++) {
    float fi = float(i);
    float seed = fi * 1.347;

    // Position drifts with time + scroll
    vec2 center = vec2(
      0.5 + 0.4 * sin(t * (0.5 + seed * 0.1) + seed * 6.28) + scrollShift * sin(seed),
      0.5 + 0.4 * cos(t * (0.3 + seed * 0.08) + seed * 3.14)
    );
    center.x *= aspect;

    float dist = length(st - center);
    float radius = 0.15 + 0.1 * sin(t * 0.7 + seed * 2.0);

    // Gaussian falloff
    float blob = exp(-dist * dist / (2.0 * radius * radius));

    // Breathing opacity per blob
    float breath = 0.008 + 0.004 * sin(t * 1.3 + seed * 4.0);
    ink += blob * breath;
  }

  // Warm sumi ink color: rgb(26, 24, 20) with slight variation
  float n = snoise(st * 3.0 + t * 0.5) * 0.003;
  vec3 inkColor = vec3(0.102 + n, 0.094 + n * 0.5, 0.078);

  gl_FragColor = vec4(inkColor, ink);
}
```

**Step 4: Create GLCanvas React component**

Create `src/components/gl/GLCanvas.tsx`:

This manages the shared OGL renderer, renders the ink wash fullscreen quad, and exposes scroll state via context for child effects (particles, ink spill) to consume later.

```tsx
"use client";

import { useEffect, useRef, useState, createContext, useContext, useCallback } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";

// --- Scroll context for GL effects ---
interface ScrollGLState {
  scrollY: number;       // normalized 0-1
  scrollVelocity: number; // px/frame
  viewportHeight: number;
  documentHeight: number;
}

export const ScrollGLContext = createContext<ScrollGLState>({
  scrollY: 0,
  scrollVelocity: 0,
  viewportHeight: 0,
  documentHeight: 0,
});

export function useScrollGL() {
  return useContext(ScrollGLContext);
}

// --- Shader sources (inline to avoid fetch) ---
const VERT = `attribute vec2 position;attribute vec2 uv;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,0,1);}`;

const FRAG = `precision highp float;
varying vec2 vUv;
uniform float uTime;
uniform float uScrollVelocity;
uniform vec2 uResolution;
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1;i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);}
void main(){
  vec2 uv=vUv;
  float aspect=uResolution.x/uResolution.y;
  vec2 st=vec2(uv.x*aspect,uv.y);
  float ink=0.0;
  float t=uTime*0.0003;
  float scrollShift=uScrollVelocity*0.002;
  for(int i=0;i<20;i++){
    float fi=float(i);float seed=fi*1.347;
    vec2 center=vec2(0.5+0.4*sin(t*(0.5+seed*0.1)+seed*6.28)+scrollShift*sin(seed),0.5+0.4*cos(t*(0.3+seed*0.08)+seed*3.14));
    center.x*=aspect;
    float dist=length(st-center);
    float radius=0.15+0.1*sin(t*0.7+seed*2.0);
    float blob=exp(-dist*dist/(2.0*radius*radius));
    float breath=0.008+0.004*sin(t*1.3+seed*4.0);
    ink+=blob*breath;
  }
  float n=snoise(st*3.0+t*0.5)*0.003;
  vec3 inkColor=vec3(0.102+n,0.094+n*0.5,0.078);
  gl_FragColor=vec4(inkColor,ink);
}`;

export function GLCanvas({ children }: { children: React.ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());
  const scrollStateRef = useRef<ScrollGLState>({
    scrollY: 0,
    scrollVelocity: 0,
    viewportHeight: 0,
    documentHeight: 0,
  });
  const [scrollState, setScrollState] = useState<ScrollGLState>(scrollStateRef.current);
  const [supported, setSupported] = useState(true);
  const prevScrollY = useRef(0);

  // Read scroll from Framer Motion
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const velocity = Math.abs(v - prevScrollY.current) * 1000;
    prevScrollY.current = v;
    const next: ScrollGLState = {
      scrollY: v,
      scrollVelocity: velocity,
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
    };
    scrollStateRef.current = next;
    setScrollState(next);
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Check WebGL2 support
    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: false });
    if (!gl) {
      setSupported(false);
      return;
    }

    // --- OGL setup ---
    let Renderer: typeof import("ogl").Renderer;
    let Geometry: typeof import("ogl").Geometry;
    let Program: typeof import("ogl").Program;
    let Mesh: typeof import("ogl").Mesh;

    // Dynamic import to keep OGL out of SSR
    import("ogl").then((OGL) => {
      Renderer = OGL.Renderer;
      Geometry = OGL.Geometry;
      Program = OGL.Program;
      Mesh = OGL.Mesh;

      const renderer = new Renderer({
        canvas,
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: Math.min(window.devicePixelRatio, 1.5),
        alpha: true,
      });
      const oglGl = renderer.gl;
      oglGl.clearColor(0, 0, 0, 0);

      const geometry = new Geometry(oglGl, {
        position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
        uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
      });

      const program = new Program(oglGl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms: {
          uTime: { value: 0 },
          uScrollVelocity: { value: 0 },
          uResolution: { value: [window.innerWidth, window.innerHeight] },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      const mesh = new Mesh(oglGl, { geometry, program });

      const resize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        program.uniforms.uResolution.value = [window.innerWidth, window.innerHeight];
      };
      window.addEventListener("resize", resize);

      const animate = () => {
        const elapsed = Date.now() - startTimeRef.current;
        program.uniforms.uTime.value = elapsed;
        program.uniforms.uScrollVelocity.value = scrollStateRef.current.scrollVelocity;

        renderer.render({ scene: mesh });
        frameRef.current = requestAnimationFrame(animate);
      };
      frameRef.current = requestAnimationFrame(animate);

      // Cleanup stored for unmount
      (canvas as any).__cleanup = () => {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(frameRef.current);
      };
    });

    return () => {
      if ((canvas as any).__cleanup) (canvas as any).__cleanup();
      else cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // Fallback: if no WebGL2, import the old Canvas 2D background
  if (!supported) {
    // Lazy-load fallback
    const Fallback = require("@/components/ink/InkWashBackground").InkWashBackground;
    return (
      <ScrollGLContext.Provider value={scrollState}>
        <Fallback />
        {children}
      </ScrollGLContext.Provider>
    );
  }

  return (
    <ScrollGLContext.Provider value={scrollState}>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 z-0 pointer-events-none"
        aria-hidden="true"
      />
      {children}
    </ScrollGLContext.Provider>
  );
}
```

**Step 5: Update public layout to use GLCanvas**

Replace `src/app/(public)/layout.tsx`:

```tsx
import { GLCanvas } from "@/components/gl/GLCanvas";
import { InkSeal } from "@/components/ink/InkSeal";
import { MenuButton } from "@/components/ui/MenuButton";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <GLCanvas>
      <MenuButton />
      <InkSeal />
      {children}
    </GLCanvas>
  );
}
```

**Note:** Do NOT delete `InkWashBackground.tsx` yet — it's used as the WebGL2 fallback. Move deletion to final cleanup task.

**Step 6: Verify**

```bash
npm run build
```

Then `npm run dev` and check browser — should see the OGL ink wash blobs replacing the old Canvas 2D ones. Verify the WebGL canvas is rendering (DevTools > Canvas element visible, check console for errors).

**Step 7: Commit**

```bash
git add src/components/gl/ src/app/'(public)'/layout.tsx
git commit -m "feat: OGL canvas infrastructure with ink wash background shader"
```

---

## Task 3: Ink Spill Transition (parchment ↔ dark)

**Files:**
- Create: `src/components/gl/InkSpillTransition.tsx`
- Modify: `src/app/(public)/page.tsx` — replace both gradient `<div>`s

**Step 1: Create InkSpillTransition component**

Create `src/components/gl/InkSpillTransition.tsx`:

This renders a separate small OGL canvas positioned exactly where the transition lives. It uses a Simplex noise shader driven by scroll to organically dissolve parchment into ink (or reverse). Two instances: one for entering dark, one for exiting.

```tsx
"use client";

import { useEffect, useRef } from "react";
import { useScroll, useTransform, useMotionValueEvent } from "framer-motion";

interface InkSpillTransitionProps {
  /** "enter" = parchment→dark, "exit" = dark→parchment */
  direction: "enter" | "exit";
  className?: string;
}

const VERT = `attribute vec2 position;attribute vec2 uv;varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,0,1);}`;

const FRAG = `precision highp float;
varying vec2 vUv;
uniform float uProgress;
uniform float uTime;
uniform float uDirection; // 1.0 = enter (parchment→dark), -1.0 = exit (dark→parchment)
uniform vec2 uResolution;

vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
float snoise(vec2 v){const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);vec2 i=floor(v+dot(v,C.yy));vec2 x0=v-i+dot(i,C.xx);vec2 i1;i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);vec4 x12=x0.xyxy+C.xxzz;x12.xy-=i1;i=mod289(i);vec3 p=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);m=m*m;m=m*m;vec3 x=2.0*fract(p*C.www)-1.0;vec3 h=abs(x)-0.5;vec3 ox=floor(x+0.5);vec3 a0=x-ox;m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);vec3 g;g.x=a0.x*x0.x+h.x*x0.y;g.yz=a0.yz*x12.xz+h.yz*x12.yw;return 130.0*dot(m,g);}

void main() {
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;

  // Noise seed differs for enter vs exit
  float seedOffset = uDirection > 0.0 ? 0.0 : 5.7;

  // Two octaves of noise at different scales
  float n1 = snoise(vec2(uv.x * aspect * 2.0, uv.y * 2.0) + seedOffset) * 0.5 + 0.5;
  float n2 = snoise(vec2(uv.x * aspect * 5.0, uv.y * 5.0) + seedOffset + 3.3) * 0.5 + 0.5;
  float noise = n1 * 0.7 + n2 * 0.3;

  // Edge bias — ink seeps from bottom/edges for enter, top/center for exit
  float edgeBias;
  if (uDirection > 0.0) {
    // Enter: ink comes from bottom and edges
    float fromBottom = 1.0 - uv.y;
    float fromEdge = 1.0 - 2.0 * abs(uv.x - 0.5);
    edgeBias = mix(fromBottom, fromEdge, 0.3);
  } else {
    // Exit: light returns from top and center
    float fromTop = uv.y;
    float fromCenter = 1.0 - 2.0 * abs(uv.x - 0.5);
    edgeBias = mix(fromTop, fromCenter, 0.4);
  }

  // Combine noise with edge bias
  float threshold = noise * 0.6 + edgeBias * 0.4;

  // Map progress to fill — progress 0→1 sweeps the threshold
  float fill = smoothstep(threshold - 0.05, threshold + 0.05, uProgress);

  // Ink colors: transition through warm dark tones
  vec3 parchmentColor = vec3(0.961, 0.929, 0.878); // #F5EDE0
  vec3 inkDark = vec3(0.165, 0.145, 0.122);         // #2A2520
  vec3 inkDeep = vec3(0.071, 0.063, 0.051);          // #12100D
  vec3 inkColor = mix(inkDark, inkDeep, fill);

  // For enter: transparent → ink. For exit: ink → transparent.
  if (uDirection > 0.0) {
    gl_FragColor = vec4(inkColor, fill);
  } else {
    gl_FragColor = vec4(inkColor, 1.0 - fill);
  }
}`;

export function InkSpillTransition({ direction, className = "" }: InkSpillTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef(Date.now());

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    // Map scroll through this element to 0→1 progress
    // Only the middle portion of visibility = transition
    const mapped = Math.max(0, Math.min(1, (v - 0.2) / 0.6));
    progressRef.current = mapped;
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    import("ogl").then((OGL) => {
      const renderer = new OGL.Renderer({
        canvas,
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        dpr: Math.min(window.devicePixelRatio, 1.5),
        alpha: true,
      });
      const oglGl = renderer.gl;
      oglGl.clearColor(0, 0, 0, 0);

      const geometry = new OGL.Geometry(oglGl, {
        position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
        uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
      });

      const program = new OGL.Program(oglGl, {
        vertex: VERT,
        fragment: FRAG,
        uniforms: {
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uDirection: { value: direction === "enter" ? 1.0 : -1.0 },
          uResolution: { value: [canvas.clientWidth, canvas.clientHeight] },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      const mesh = new OGL.Mesh(oglGl, { geometry, program });

      const resize = () => {
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        renderer.setSize(w, h);
        program.uniforms.uResolution.value = [w, h];
      };
      window.addEventListener("resize", resize);

      const animate = () => {
        program.uniforms.uProgress.value = progressRef.current;
        program.uniforms.uTime.value = (Date.now() - startTimeRef.current) * 0.001;
        renderer.render({ scene: mesh });
        frameRef.current = requestAnimationFrame(animate);
      };
      frameRef.current = requestAnimationFrame(animate);

      (canvas as any).__cleanup = () => {
        window.removeEventListener("resize", resize);
        cancelAnimationFrame(frameRef.current);
      };
    });

    return () => {
      if ((canvas as any).__cleanup) (canvas as any).__cleanup();
      else cancelAnimationFrame(frameRef.current);
    };
  }, [direction]);

  return (
    <div ref={containerRef} className={`relative h-[70vh] ${className}`}>
      <canvas
        ref={canvasRef}
        className="sticky top-0 w-full h-screen"
        aria-hidden="true"
      />
    </div>
  );
}
```

**Step 2: Replace gradient transitions in page.tsx**

In `src/app/(public)/page.tsx`:

Add import at top:
```tsx
import { InkSpillTransition } from "@/components/gl/InkSpillTransition";
```

Replace the first gradient div (lines 274-292, the parchment→dark transition):
```tsx
<InkSpillTransition direction="enter" />
```

Replace the second gradient div (lines 351-357, the dark→parchment transition):
```tsx
<InkSpillTransition direction="exit" />
```

Remove the `InkSplatter` import if no longer used elsewhere. Check first — it's used in Act 1 (line 159). Keep the import.

**Step 3: Verify**

```bash
npm run dev
```

Scroll through the page. The parchment→dark and dark→parchment transitions should now show organic ink flooding/receding instead of flat gradients. Scroll back and forth to confirm reversibility.

**Step 4: Commit**

```bash
git add src/components/gl/InkSpillTransition.tsx src/app/'(public)'/page.tsx
git commit -m "feat: WebGL ink spill transitions replace CSS gradients"
```

---

## Task 4: Atmospheric Particles

**Files:**
- Create: `src/components/gl/AtmosphericParticles.tsx`
- Modify: `src/app/(public)/page.tsx` — add particle layers

**Step 1: Create AtmosphericParticles component**

Create `src/components/gl/AtmosphericParticles.tsx`:

A CSS/Canvas-hybrid particle system. Uses a fixed canvas overlay that renders tiny drifting particles. On parchment sections: dark ink motes. On dark sections: warm golden embers. Scroll velocity adds a wind effect.

Use Canvas 2D for particles (not OGL) — particles are simple dots, don't need shaders, and this avoids needing multiple GL contexts. The main OGL canvas handles the heavy shader work.

```tsx
"use client";

import { useEffect, useRef, useCallback } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
  maxLife: number;
}

interface AtmosphericParticlesProps {
  /** "parchment" = dark ink motes, "dark" = golden embers */
  mode: "parchment" | "dark";
  /** Number of particles */
  count?: number;
  className?: string;
}

export function AtmosphericParticles({
  mode,
  count = 50,
  className = "",
}: AtmosphericParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const frameRef = useRef<number>(0);
  const scrollVelRef = useRef(0);
  const lastScrollRef = useRef(0);

  const spawnParticle = useCallback((w: number, h: number): Particle => ({
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * 0.15,
    vy: -(Math.random() * 0.2 + 0.05), // drift upward
    size: Math.random() * 1.5 + 0.5,
    opacity: mode === "parchment"
      ? Math.random() * 0.05 + 0.03
      : Math.random() * 0.07 + 0.05,
    life: 0,
    maxLife: Math.random() * 600 + 300,
  }), [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio, 1.5);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + "px";
      canvas.style.height = rect.height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    // Track scroll velocity
    const onScroll = () => {
      const y = window.scrollY;
      scrollVelRef.current = y - lastScrollRef.current;
      lastScrollRef.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Spawn initial particles
    const rect = canvas.getBoundingClientRect();
    particlesRef.current = Array.from({ length: count }, () =>
      spawnParticle(rect.width, rect.height)
    );
    // Randomize initial life so they don't all fade in at once
    particlesRef.current.forEach(p => { p.life = Math.random() * p.maxLife; });

    const color = mode === "parchment"
      ? { r: 26, g: 24, b: 20 }    // ink motes
      : { r: 201, g: 168, b: 76 };  // golden embers

    const animate = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      const windX = scrollVelRef.current * 0.01;
      // Decay scroll velocity
      scrollVelRef.current *= 0.95;

      for (const p of particlesRef.current) {
        p.x += p.vx + windX;
        p.y += p.vy;
        p.life++;

        // Wrap
        if (p.y < -10) p.y = h + 10;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        // Respawn if dead
        if (p.life > p.maxLife) {
          Object.assign(p, spawnParticle(w, h));
          p.y = h + 10; // spawn at bottom
        }

        // Fade in/out over life
        const lifeRatio = p.life / p.maxLife;
        const fadeIn = Math.min(lifeRatio * 5, 1);
        const fadeOut = Math.min((1 - lifeRatio) * 5, 1);
        const alpha = p.opacity * fadeIn * fadeOut;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
        ctx.fill();
      }

      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frameRef.current);
    };
  }, [mode, count, spawnParticle]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
```

**Step 2: Add particles to page.tsx sections**

In `src/app/(public)/page.tsx`, add import:
```tsx
import { AtmosphericParticles } from "@/components/gl/AtmosphericParticles";
```

Add parchment particles to Act 1 section (after `<section className="relative z-10">` on line 143):
```tsx
<AtmosphericParticles mode="parchment" count={40} className="z-0" />
```

Add dark particles to Act 3 section (after `<section className="relative z-10 text-parchment"` on line 298, inside the section):
```tsx
<AtmosphericParticles mode="dark" count={35} className="z-0" />
```

Add parchment particles to Act 4+5 area (inside Act 4 section):
```tsx
<AtmosphericParticles mode="parchment" count={30} className="z-0" />
```

**Step 3: Verify**

```bash
npm run dev
```

Check: tiny faint particles drifting upward on parchment sections (dark motes) and dark sections (golden embers). They should be barely visible — atmospheric, not distracting.

**Step 4: Commit**

```bash
git add src/components/gl/AtmosphericParticles.tsx src/app/'(public)'/page.tsx
git commit -m "feat: atmospheric particles — ink motes on parchment, golden embers on dark"
```

---

## Task 5: Image Background Removal + Ink-Bleed Edge Masks

**Files:**
- Create: `scripts/remove-backgrounds.ts`
- Modify: `src/components/ink/StoryImage.tsx` — add ink-bleed mask prop
- Modify: `src/app/(public)/page.tsx` — add inkBleed props to images
- Process: all images in `public/images/`

**Step 1: Install sharp for image processing**

```bash
cd /Users/mac/prod/me.io && npm install --save-dev sharp @types/sharp
```

**Step 2: Create background removal script**

Create `scripts/remove-backgrounds.ts`:

This script processes each image to remove its solid background (parchment or dark) and save as transparent PNG. It uses sharp's threshold + alpha channel manipulation.

```ts
import sharp from "sharp";
import path from "path";
import fs from "fs";

const IMAGES_DIR = path.join(process.cwd(), "public/images");
const BACKUP_DIR = path.join(process.cwd(), "public/images/_originals");

// Images with parchment backgrounds (warm cream ~#F5EDE0)
const PARCHMENT_BG_IMAGES = [
  "hero-wanderer.png",
  "mandeville.png",
  "forking-paths.png",
  "the-weight.png",
  "enso-moment.png",
  "winding-river.png",
  "divine-brush.png",
  "spiral-seasons.png",
  "wolf-running.png",
  "footer-enso.png",
  "text-title.png",
  "text-but.png",
  "text-ebm.png",
  "obj-camera.png",
  "obj-storefront.png",
  "obj-code.png",
  "obj-coffee.png",
  "obj-passport.png",
  "obj-3dprint.png",
];

// Images with dark backgrounds (~#12100D)
const DARK_BG_IMAGES = [
  "submerged.png",
  "koi.png",
];

async function removeBackground(
  filename: string,
  bgType: "parchment" | "dark"
) {
  const src = path.join(IMAGES_DIR, filename);
  const backup = path.join(BACKUP_DIR, filename);

  if (!fs.existsSync(src)) {
    console.log(`  SKIP: ${filename} not found`);
    return;
  }

  // Backup original
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  if (!fs.existsSync(backup)) fs.copyFileSync(src, backup);

  const image = sharp(src);
  const { width, height } = await image.metadata();
  if (!width || !height) return;

  // Extract raw pixel data
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8Array(data);
  const channels = info.channels; // should be 4 (RGBA)

  // Define background color range
  let isBackground: (r: number, g: number, b: number) => boolean;

  if (bgType === "parchment") {
    // Parchment: R>220, G>210, B>190 with low saturation
    isBackground = (r, g, b) => {
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;
      return r > 210 && g > 195 && b > 170 && saturation < 0.15;
    };
  } else {
    // Dark: all channels < 50
    isBackground = (r, g, b) => r < 50 && g < 50 && b < 50;
  }

  // Process pixels — set matching background pixels to transparent
  for (let i = 0; i < pixels.length; i += channels) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    if (isBackground(r, g, b)) {
      // Fully transparent
      pixels[i + 3] = 0;
    } else {
      // Edge feathering — partially transparent near background color
      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      const saturation = max === 0 ? 0 : (max - min) / max;

      if (bgType === "parchment" && r > 190 && g > 175 && b > 150 && saturation < 0.2) {
        // Near-background: partial transparency for soft edges
        const proximity = Math.min(
          (r - 190) / 30,
          (g - 175) / 30,
          (b - 150) / 30
        );
        pixels[i + 3] = Math.round(255 * (1 - proximity * 0.7));
      } else if (bgType === "dark" && max < 80) {
        const proximity = 1 - max / 80;
        pixels[i + 3] = Math.round(255 * (1 - proximity * 0.7));
      }
    }
  }

  // Save processed image
  await sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png({ compressionLevel: 9 })
    .toFile(src);

  console.log(`  OK: ${filename}`);
}

async function main() {
  console.log("Removing parchment backgrounds...");
  for (const img of PARCHMENT_BG_IMAGES) {
    await removeBackground(img, "parchment");
  }

  console.log("\nRemoving dark backgrounds...");
  for (const img of DARK_BG_IMAGES) {
    await removeBackground(img, "dark");
  }

  console.log("\nDone! Originals backed up to public/images/_originals/");
}

main().catch(console.error);
```

**Step 3: Run the background removal script**

```bash
cd /Users/mac/prod/me.io && npx tsx scripts/remove-backgrounds.ts
```

Expected: Each image processed, originals backed up.

**Step 4: Add ink-bleed SVG filter to StoryImage**

Modify `src/components/ink/StoryImage.tsx` — add an `inkBleed` prop that applies an SVG displacement filter:

```tsx
"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface StoryImageProps {
  src: string;
  alt: string;
  className?: string;
  blend?: boolean;
  parallax?: number;
  priority?: boolean;
  delay?: number;
  /** Apply ink-bleed edge displacement — pass unique seed per image */
  inkBleed?: number;
  /** CSS animation class to apply to the img */
  animationClass?: string;
}

export function StoryImage({
  src,
  alt,
  className = "",
  blend = true,
  parallax = 0,
  priority = false,
  delay = 0,
  inkBleed,
  animationClass = "",
}: StoryImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const filterId = inkBleed != null ? `ink-bleed-${inkBleed}` : undefined;

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], [parallax * 60, -parallax * 60]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{
        duration: 1.2,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {/* Inline SVG filter for ink-bleed edges */}
      {filterId && (
        <svg className="absolute w-0 h-0" aria-hidden="true">
          <defs>
            <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.04"
                numOctaves="4"
                seed={inkBleed}
                result="noise"
              />
              <feDisplacementMap
                in="SourceGraphic"
                in2="noise"
                scale="15"
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}
      <motion.img
        src={src}
        alt={alt}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        style={{
          ...(parallax ? { y } : {}),
          ...(filterId ? { filter: `url(#${filterId})` } : {}),
        }}
        className={`w-full h-auto ${blend ? "mix-blend-multiply" : ""} ${animationClass}`}
      />
    </motion.div>
  );
}
```

**Step 5: Add inkBleed seeds to images in page.tsx**

In `src/app/(public)/page.tsx`, add `inkBleed` prop to the main story images. Use different seeds:

- Mandeville: `inkBleed={10}`
- Forking paths: `inkBleed={20}`
- The Weight: `inkBleed={30}`
- Enso moment: `inkBleed={40}`
- Winding river: `inkBleed={50}`
- Divine brush: `inkBleed={60}`
- Wolf running: `inkBleed={70}`

Don't add inkBleed to: text images (text-title, text-but, text-ebm), footer-enso, submerged, koi (dark bg images), or floating objects (too small).

**Step 6: Fix floating objects layout**

In `page.tsx`, replace the absolute-positioned floating objects section (lines 174-217) with a CSS grid layout:

```tsx
{/* Floating objects — scattered interests */}
<div className="relative min-h-[70vh] md:min-h-[80vh] grid grid-cols-3 grid-rows-3 gap-4 px-8 md:px-16 py-12">
  {FLOATING_OBJECTS.map((obj, i) => {
    // Grid positions that avoid overlap
    const gridPositions = [
      "col-start-1 row-start-1 justify-self-start self-start",
      "col-start-3 row-start-1 justify-self-end self-start",
      "col-start-1 row-start-2 justify-self-start self-center",
      "col-start-3 row-start-2 justify-self-end self-center",
      "col-start-1 row-start-3 justify-self-start self-end",
      "col-start-3 row-start-3 justify-self-end self-end",
    ];
    const rotations = ["-rotate-12", "rotate-3", "-rotate-6", "rotate-6", "-rotate-3", "rotate-[8deg]"];
    const sizes = ["w-28 md:w-40", "w-36 md:w-52", "w-24 md:w-32", "w-24 md:w-32", "w-28 md:w-36", "w-24 md:w-32"];

    return (
      <motion.div
        key={obj.src}
        className={`${gridPositions[i]} ${sizes[i]} ${rotations[i]}`}
        initial={{ opacity: 0, y: 40, scale: 0.85 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{
          duration: 1,
          delay: obj.delay,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <img
          src={obj.src}
          alt={obj.alt}
          loading="lazy"
          className="w-full h-auto mix-blend-multiply"
        />
      </motion.div>
    );
  })}

  {/* Center text among objects */}
  <div className="col-start-2 row-start-1 row-span-3 flex items-center justify-center px-4">
    <motion.p
      className="text-center font-light max-w-lg"
      style={{
        fontSize: "var(--text-subheading)",
        fontFamily: "var(--font-display), serif",
      }}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 0.6 }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.3 }}
    >
      Photography. Logistics. Code. Travel. Cooking. Making.
      <br />
      <span className="text-vermillion/60 italic">
        Everything moves me.
      </span>
    </motion.p>
  </div>
</div>
```

**Step 7: Verify**

```bash
npm run dev
```

Check: Images should now have transparent backgrounds sitting naturally on parchment. Ink-bleed edges should create subtle organic displacement at image borders. Floating objects should not overlap.

**Step 8: Commit**

```bash
git add scripts/ src/components/ink/StoryImage.tsx src/app/'(public)'/page.tsx public/images/
git commit -m "feat: image background removal, ink-bleed edge masks, grid floating objects"
```

---

## Task 6: Image Animations

**Files:**
- Modify: `src/app/globals.css` — add CSS keyframe animations
- Modify: `src/app/(public)/page.tsx` — apply animation classes/wrappers

**Step 1: Add CSS keyframe animations to globals.css**

Append to `src/app/globals.css`:

```css
/* ========================================
   IMAGE ANIMATIONS — subtle life in still images
   ======================================== */

@keyframes koi-sway {
  0%, 100% { transform: translateX(0) rotate(0deg); }
  25% { transform: translateX(3px) rotate(0.3deg); }
  75% { transform: translateX(-3px) rotate(-0.3deg); }
}

@keyframes spiral-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes enso-glow {
  0%, 100% { filter: drop-shadow(0 0 0px rgba(201, 168, 76, 0)); }
  50% { filter: drop-shadow(0 0 20px rgba(201, 168, 76, 0.15)); }
}

.animate-koi-sway {
  animation: koi-sway 6s ease-in-out infinite;
}

.animate-spiral-rotate {
  animation: spiral-rotate 60s linear infinite;
}

.animate-enso-glow {
  animation: enso-glow 4s ease-in-out infinite;
}
```

**Step 2: Apply animation classes in page.tsx**

In the koi image `StoryImage` (around line 329-335), add `animationClass="animate-koi-sway"`:
```tsx
<StoryImage
  src="/images/koi.png"
  alt="A koi fish swimming upward through dark water, vermillion and gold trailing behind"
  className="max-w-3xl"
  blend={false}
  parallax={0.4}
  animationClass="animate-koi-sway"
/>
```

In the spiral seasons `StoryImage` (around line 434-439), add `animationClass="animate-spiral-rotate"`:
```tsx
<StoryImage
  src="/images/spiral-seasons.png"
  alt="A spiral of seasons — winter, spring, summer, autumn — time compounding into growth"
  className="max-w-md md:max-w-lg"
  parallax={0.3}
  animationClass="animate-spiral-rotate"
  inkBleed={55}
/>
```

In the enso moment `StoryImage` (around line 365-371), add `animationClass="animate-enso-glow"`:
```tsx
<StoryImage
  src="/images/enso-moment.png"
  alt="A vermillion enso with divine golden energy spilling from the gap"
  className="max-w-3xl md:max-w-4xl"
  parallax={0.2}
  animationClass="animate-enso-glow"
  inkBleed={40}
/>
```

**Step 3: Verify**

```bash
npm run dev
```

Check: Koi gently sways, spiral slowly rotates (barely perceptible), enso has a soft golden glow pulse. All should be extremely subtle — enhancing, not distracting.

**Step 4: Commit**

```bash
git add src/app/globals.css src/app/'(public)'/page.tsx
git commit -m "feat: subtle image animations — koi sway, spiral rotation, enso glow"
```

---

## Task 7: Scroll Pacing + Text Reveal Tuning + BrushDividers

**Files:**
- Modify: `src/components/ink/ScrollTextReveal.tsx`
- Modify: `src/app/(public)/page.tsx`

**Step 1: Fix ScrollTextReveal — base opacity + remove will-change**

In `src/components/ink/ScrollTextReveal.tsx`:

Line 76 — change base opacity from `0.08` to `0.15`:
```tsx
const opacity = useTransform(scrollProgress, [start, end], [0.15, 1]);
```

Line 81 — remove `will-change-[opacity,transform]`:
```tsx
className="inline-block mr-[0.3em]"
```

**Step 2: Tighten scroll spans in page.tsx**

Update every `scrollSpan` value in `src/app/(public)/page.tsx`:

| Line (approx) | Old | New | Text |
|------|-----|-----|------|
| 148 | 2.2 | 1.6 | "From a balcony above..." |
| 168 | 2.0 | 1.5 | "I wanted to build things..." |
| 238 | 2.0 | 1.5 | "When you chase everything..." |
| 253 | 1.8 | 1.4 | "Pick a lane. Focus..." |
| 317 | 2.5 | 1.8 | "You're doing everything..." |
| 322 | 1.8 | 1.4 | "Some nights you sink..." |
| 339 | 2.2 | 1.6 | "But honestly, that tiny ember..." |
| 376 | 1.8 | 1.4 | "Then something shifts..." |
| 383 | 2.0 | 1.5 | "You stop caring..." |
| 399 | 2.2 | 1.6 | "You realize that the river..." |
| 404 | 1.5 | 1.2 | "Growth isn't a sprint..." |
| 429 | 2.2 | 1.6 | "And so, you keep going..." |
| 443 | 1.8 | 1.4 | "You stop trying to fix..." |
| 479 | 1.3 | 1.0 | "Maybe direction isn't found." |
| 486 | 1.5 | 1.2 | "Maybe it forms under your feet..." |
| 492 | 1.2 | 1.0 | "From Mandeville to wherever..." |

**Step 3: Add BrushDividers between acts**

In `page.tsx`, add import:
```tsx
import { BrushDivider } from "@/components/ink/BrushDivider";
```

Add a `BrushDivider` between Act 1 and Act 2:
```tsx
<BrushDivider variant={1} className="px-6 md:px-20" />
```

Add a `BrushDivider` between Act 4 and Act 5:
```tsx
<BrushDivider variant={2} className="px-6 md:px-20" />
```

Add a `BrushDivider` before the closing section:
```tsx
<BrushDivider variant={3} className="px-6 md:px-20" />
```

**Step 4: Verify**

```bash
npm run dev
```

Scroll through. Text should be ~30% faster to reveal. Ghost preview text visible before reveal. BrushDividers draw on between acts.

**Step 5: Commit**

```bash
git add src/components/ink/ScrollTextReveal.tsx src/app/'(public)'/page.tsx
git commit -m "feat: tighten scroll pacing, bump text ghost opacity, add BrushDividers"
```

---

## Task 8: Menu Button + Scroll Progress + Footer Polish

**Files:**
- Modify: `src/components/ui/MenuButton.tsx`
- Create: `src/components/ui/ScrollProgress.tsx`
- Modify: `src/app/(public)/page.tsx` — add scroll progress + section data attrs
- Modify: `src/app/(public)/layout.tsx` — add ScrollProgress
- Modify: `src/app/globals.css` — footer hover effects

**Step 1: Rewrite MenuButton with adaptive color**

Replace `src/components/ui/MenuButton.tsx`:

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { NavigationOverlay } from "./NavigationOverlay";

export function MenuButton() {
  const [open, setOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Detect whether button overlaps a dark section
  useEffect(() => {
    const darkSections = document.querySelectorAll("[data-theme='dark']");
    if (!darkSections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Check if any dark section is near the top of viewport (where button lives)
        let inDark = false;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const rect = entry.boundingClientRect;
            // Button is at top-6 (24px), so check if dark section covers that area
            if (rect.top < 60 && rect.bottom > 0) {
              inDark = true;
            }
          }
        }
        setIsDark(inDark);
      },
      { threshold: [0, 0.01, 0.99, 1], rootMargin: "-0px 0px -90% 0px" }
    );

    darkSections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const lineColor = open
    ? "bg-parchment/80"
    : isDark
      ? "bg-parchment/60 group-hover:bg-parchment/90"
      : "bg-ink-black/40 group-hover:bg-ink-black/70";

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setOpen(!open)}
        className="fixed top-6 right-6 z-[200] w-10 h-10 flex flex-col items-center justify-center gap-[5px] group"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <motion.span
          className={`block h-[1.5px] transition-colors duration-300 ${lineColor}`}
          animate={
            open
              ? { rotate: 45, y: 3.5, width: 18 }
              : { rotate: 0, y: 0, width: 20 }
          }
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.span
          className={`block h-[1.5px] transition-colors duration-300 ${lineColor}`}
          animate={
            open
              ? { opacity: 0, width: 0 }
              : { opacity: 1, width: 12 }
          }
          transition={{ duration: 0.2 }}
          style={{ alignSelf: "flex-end", marginRight: 5 }}
        />
        <motion.span
          className={`block h-[1.5px] transition-colors duration-300 ${lineColor}`}
          animate={
            open
              ? { rotate: -45, y: -3.5, width: 18 }
              : { rotate: 0, y: 0, width: 20 }
          }
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        />
      </button>

      <NavigationOverlay open={open} onClose={() => setOpen(false)} />
    </>
  );
}
```

**Step 2: Create ScrollProgress component**

Create `src/components/ui/ScrollProgress.tsx`:

```tsx
"use client";

import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      className="fixed left-0 top-0 bottom-0 w-[2px] z-[100] origin-top"
      style={{
        scaleY,
        background: "var(--vermillion)",
        opacity: 0.35,
      }}
    />
  );
}
```

**Step 3: Add data-theme="dark" to dark sections in page.tsx**

In `src/app/(public)/page.tsx`, add `data-theme="dark"` to:
- The ink spill enter transition wrapper
- The Act 3 dark section (line 298): `<section className="relative z-10 text-parchment" style={{ backgroundColor: "var(--ink-deep)" }} data-theme="dark">`
- The ink spill exit transition wrapper

**Step 4: Add ScrollProgress to layout**

In `src/app/(public)/layout.tsx`, add:
```tsx
import { ScrollProgress } from "@/components/ui/ScrollProgress";
```

And add `<ScrollProgress />` inside the GLCanvas children.

**Step 5: Footer polish — update wave opacity in page.tsx**

In `page.tsx` footer section (line 502), change WavePattern opacity:
```tsx
<WavePattern className="absolute inset-x-0 top-0" opacity={0.08} rows={3} />
```

Add a vermillion glow behind footer enso — wrap the StoryImage:
```tsx
<div className="flex justify-center px-6 mb-12 relative">
  {/* Vermillion glow behind enso */}
  <div className="absolute inset-0 flex items-center justify-center">
    <div className="w-48 h-48 rounded-full bg-vermillion/[0.04] blur-3xl" />
  </div>
  <StoryImage
    src="/images/footer-enso.png"
    alt="Enso circle with vermillion seal"
    className="max-w-[200px] md:max-w-[260px] relative z-10"
  />
</div>
```

**Step 6: Add brush-stroke hover underlines for social links**

Append to `src/app/globals.css`:

```css
/* Social link brush-stroke underline */
.brush-underline {
  position: relative;
}
.brush-underline::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 100%;
  height: 2px;
  background: var(--vermillion);
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
  opacity: 0.6;
}
.brush-underline:hover::after {
  transform: scaleX(1);
}
```

In `page.tsx` footer social links, add `brush-underline` class to the `<a>` tags:
```tsx
className="font-mono uppercase tracking-wider hover:text-vermillion transition-colors duration-500 brush-underline"
```

**Step 7: Verify**

```bash
npm run dev
```

Check:
- Menu button: dark lines on parchment, light lines on dark sections
- Scroll progress: thin vermillion line on left edge grows with scroll
- Footer: wave pattern visible, vermillion glow behind enso, brush underlines on hover

**Step 8: Commit**

```bash
git add src/components/ui/MenuButton.tsx src/components/ui/ScrollProgress.tsx src/app/'(public)'/page.tsx src/app/'(public)'/layout.tsx src/app/globals.css
git commit -m "feat: adaptive menu button, scroll progress indicator, footer polish"
```

---

## Task 9: Final Integration Verify + Build Check

**Files:**
- All modified files from Tasks 1-8

**Step 1: Full build check**

```bash
cd /Users/mac/prod/me.io && npm run build
```

Expected: Build succeeds with no errors.

**Step 2: Visual smoke test**

```bash
npm run dev
```

Walk through the entire scroll experience and verify:
1. Parchment texture is visible and warm
2. OGL ink wash blobs are smooth and GPU-rendered
3. Images have transparent backgrounds, sitting on parchment naturally
4. Ink-bleed edges on story images look organic
5. Floating objects don't overlap
6. Ink spill transition enters organically (parchment→dark)
7. Dark section has golden ember particles
8. Ink spill exit returns to parchment organically
9. Koi sways, spiral rotates, enso glows
10. Scroll text reveals faster with ghost preview text visible
11. BrushDividers draw on between acts
12. Menu button adapts color on dark/light sections
13. Scroll progress line works
14. Footer wave visible, enso has glow, social links have brush underlines
15. No console errors

**Step 3: Take fresh Playwright screenshots for comparison**

Use the browser's Playwright to take screenshots at the same scroll positions as the originals for before/after comparison.

**Step 4: Final commit**

If any fixes were needed:
```bash
git add -A
git commit -m "fix: polish pass final adjustments"
```

---

## Summary

| Task | What | Key Files |
|------|------|-----------|
| 1 | OGL install + parchment texture | package.json, globals.css, public/textures/ |
| 2 | OGL canvas + ink wash shader | GLCanvas.tsx, layout.tsx |
| 3 | Ink spill transitions | InkSpillTransition.tsx, page.tsx |
| 4 | Atmospheric particles | AtmosphericParticles.tsx, page.tsx |
| 5 | Image backgrounds + ink-bleed masks | remove-backgrounds.ts, StoryImage.tsx, page.tsx |
| 6 | Image animations | globals.css, page.tsx |
| 7 | Scroll pacing + BrushDividers | ScrollTextReveal.tsx, page.tsx |
| 8 | Menu + scroll progress + footer | MenuButton.tsx, ScrollProgress.tsx, globals.css |
| 9 | Integration verify | All files |
