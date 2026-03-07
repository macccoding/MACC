"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";

// ---------------------------------------------------------------------------
// Scroll GL Context
// ---------------------------------------------------------------------------

interface ScrollGLState {
  /** Normalized scroll position 0-1 */
  scrollY: number;
  /** Scroll velocity (pixels/frame, smoothed) */
  scrollVelocity: number;
  /** Viewport height in pixels */
  viewportHeight: number;
  /** Document height in pixels */
  documentHeight: number;
}

export const ScrollGLContext = createContext<ScrollGLState>({
  scrollY: 0,
  scrollVelocity: 0,
  viewportHeight: 0,
  documentHeight: 0,
});

export const useScrollGL = () => useContext(ScrollGLContext);

// ---------------------------------------------------------------------------
// Shaders
// ---------------------------------------------------------------------------

const VERTEX = /* glsl */ `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT = /* glsl */ `
precision highp float;

varying vec2 vUv;
uniform float uTime;
uniform float uScrollVelocity;
uniform vec2 uResolution;

// --- Simplex noise (Ashima Arts) ---
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 10.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(
    0.211324865405187,   // (3.0 - sqrt(3.0)) / 6.0
    0.366025403784439,   // 0.5 * (sqrt(3.0) - 1.0)
   -0.577350269189626,   // -1.0 + 2.0 * C.x
    0.024390243902439    // 1.0 / 41.0
  );
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                            + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy),
                           dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x  = 2.0 * fract(p * C.www) - 1.0;
  vec3 h  = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
// --- End Simplex noise ---

void main() {
  float t = uTime;
  vec2 uv = vUv;
  float aspect = uResolution.x / uResolution.y;
  vec2 st = vec2(uv.x * aspect, uv.y);

  float totalInk = 0.0;
  float noiseAccum = 0.0;

  // Wind effect from scroll velocity
  float wind = uScrollVelocity * 0.0003;

  for (int i = 0; i < 20; i++) {
    float fi = float(i);
    float seed = fi * 1.618033988749895; // golden ratio spacing

    // Organic drifting positions
    float cx = 0.5 * aspect + 0.45 * aspect * sin(t * 0.3 + seed * 2.5) * cos(t * 0.17 + seed * 1.3)
             + wind * sin(seed * 3.0);
    float cy = 0.5 + 0.45 * cos(t * 0.23 + seed * 1.7) * sin(t * 0.31 + seed * 0.9)
             + wind * cos(seed * 2.0) * 0.5;

    // Breathing radius
    float radius = 0.15 + 0.1 * sin(t * 0.7 + seed * 2.0);

    // Gaussian falloff
    float dx = st.x - cx;
    float dy = st.y - cy;
    float dist2 = dx * dx + dy * dy;
    float gauss = exp(-dist2 / (2.0 * radius * radius));

    // Breathing opacity — very subtle
    float breath = 0.008 + 0.004 * sin(t * 1.3 + seed * 4.0);

    totalInk += gauss * breath;

    // Accumulate noise variation per blob
    noiseAccum += gauss * snoise(st * 3.0 + vec2(seed, t * 0.1)) * 0.002;
  }

  totalInk += noiseAccum;
  totalInk = clamp(totalInk, 0.0, 1.0);

  // Warm sumi ink color with slight noise variation
  float nz = snoise(st * 2.0 + t * 0.05) * 0.01;
  vec3 inkColor = vec3(0.102 + nz, 0.094 + nz * 0.7, 0.078);

  gl_FragColor = vec4(inkColor, totalInk);
}
`;

// ---------------------------------------------------------------------------
// GLCanvas Component
// ---------------------------------------------------------------------------

interface GLCanvasProps {
  children?: ReactNode;
}

export function GLCanvas({ children }: GLCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webglSupported, setWebglSupported] = useState<boolean | null>(null);

  // Scroll state exposed via context
  const [scrollState, setScrollState] = useState<ScrollGLState>({
    scrollY: 0,
    scrollVelocity: 0,
    viewportHeight: typeof window !== "undefined" ? window.innerHeight : 0,
    documentHeight: typeof window !== "undefined" ? document.documentElement.scrollHeight : 0,
  });

  // Refs for the animation loop to read without re-renders
  const scrollVelocityRef = useRef(0);
  const prevScrollYRef = useRef(0);

  // Framer Motion scroll tracking
  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const velocity = (latest - prevScrollYRef.current) * 1000;
    prevScrollYRef.current = latest;

    // Smooth velocity
    scrollVelocityRef.current += (velocity - scrollVelocityRef.current) * 0.3;

    setScrollState((prev) => ({
      ...prev,
      scrollY: latest,
      scrollVelocity: scrollVelocityRef.current,
      viewportHeight: window.innerHeight,
      documentHeight: document.documentElement.scrollHeight,
    }));
  });

  // Keep viewport dimensions up to date
  useEffect(() => {
    const onResize = () => {
      setScrollState((prev) => ({
        ...prev,
        viewportHeight: window.innerHeight,
        documentHeight: document.documentElement.scrollHeight,
      }));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // WebGL init + render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Feature-detect WebGL2
    const testCtx = canvas.getContext("webgl2");
    if (!testCtx) {
      setWebglSupported(false);
      return;
    }
    setWebglSupported(true);

    let disposed = false;

    // Dynamic import to keep OGL out of SSR bundle
    import("ogl").then(({ Renderer, Geometry, Program, Mesh }) => {
      if (disposed) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);

      const renderer = new Renderer({
        canvas,
        alpha: true,
        dpr,
        depth: false,
        stencil: false,
        antialias: false,
        premultipliedAlpha: false,
        webgl: 2,
      });
      const gl = renderer.gl;

      // Fullscreen triangle (covers viewport with 3 verts instead of 6)
      const geometry = new Geometry(gl, {
        position: { size: 2, data: new Float32Array([-1, -1, 3, -1, -1, 3]) },
        uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
      });

      const program = new Program(gl, {
        vertex: VERTEX,
        fragment: FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uScrollVelocity: { value: 0 },
          uResolution: { value: [window.innerWidth, window.innerHeight] },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      const mesh = new Mesh(gl, { geometry, program });

      const resize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        program.uniforms.uResolution.value = [window.innerWidth, window.innerHeight];
      };
      resize();
      window.addEventListener("resize", resize);

      const startTime = performance.now();

      const tick = () => {
        if (disposed) return;

        const elapsed = (performance.now() - startTime) * 0.001; // seconds
        program.uniforms.uTime.value = elapsed;
        program.uniforms.uScrollVelocity.value = scrollVelocityRef.current;

        renderer.render({ scene: mesh });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      // Cleanup closure
      const cleanup = () => {
        window.removeEventListener("resize", resize);
        geometry.remove();
        program.remove();
        // Lose context to free GPU resources
        const ext = gl.getExtension("WEBGL_lose_context");
        if (ext) ext.loseContext();
      };

      // Store cleanup so the effect destructor can call it
      cleanupRef.current = cleanup;
    });

    return () => {
      disposed = true;
      cleanupRef.current?.();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const cleanupRef = useRef<(() => void) | null>(null);

  // WebGL2 not supported — fall back to Canvas 2D
  if (webglSupported === false) {
    return <FallbackInkWash>{children}</FallbackInkWash>;
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

// ---------------------------------------------------------------------------
// Fallback — lazy-loads the old Canvas 2D ink wash
// ---------------------------------------------------------------------------

import dynamic from "next/dynamic";

const LazyInkWashBackground = dynamic(
  () =>
    import("@/components/ink/InkWashBackground").then(
      (mod) => mod.InkWashBackground
    ),
  { ssr: false }
);

function FallbackInkWash({ children }: { children?: ReactNode }) {
  return (
    <>
      <LazyInkWashBackground />
      {children}
    </>
  );
}
