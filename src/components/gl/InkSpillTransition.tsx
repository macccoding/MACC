"use client";

import { useEffect, useRef } from "react";
import { useScroll, useMotionValueEvent } from "framer-motion";

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
uniform float uProgress;
uniform float uTime;
uniform float uDirection;
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
  vec2 uv = vUv;

  // Seed offset so enter/exit look different
  float seedOffset = uDirection > 0.0 ? 0.0 : 73.156;

  // Two octaves of Simplex noise: large + fine detail, blended 70/30
  float noiseLarge = snoise((uv * 2.0) + vec2(seedOffset, uTime * 0.05));
  float noiseFine  = snoise((uv * 5.0) + vec2(seedOffset + 31.7, uTime * 0.08));
  float noise = noiseLarge * 0.7 + noiseFine * 0.3;
  // Normalize from [-1,1] to [0,1]
  noise = noise * 0.5 + 0.5;

  // Edge bias
  float edgeBias;
  if (uDirection > 0.0) {
    // Enter: ink seeps from bottom and edges
    edgeBias = mix(1.0 - uv.y, 1.0 - 2.0 * abs(uv.x - 0.5), 0.3);
  } else {
    // Exit: light returns from top and center
    edgeBias = mix(uv.y, 1.0 - 2.0 * abs(uv.x - 0.5), 0.4);
  }

  // Threshold combining noise and edge bias
  float threshold = noise * 0.6 + edgeBias * 0.4;

  // Soft feathered fill
  float fill = smoothstep(threshold - 0.05, threshold + 0.05, uProgress);

  // Ink color: transition through ink-dark to ink-deep
  vec3 inkDark = vec3(0.165, 0.145, 0.125);  // #2A2520
  vec3 inkDeep = vec3(0.071, 0.063, 0.051);  // #12100D
  vec3 inkColor = mix(inkDark, inkDeep, fill);

  // Output
  if (uDirection > 0.0) {
    // Enter: transparent parchment becomes opaque ink
    gl_FragColor = vec4(inkColor, fill);
  } else {
    // Exit: opaque ink becomes transparent
    gl_FragColor = vec4(inkColor, 1.0 - fill);
  }
}
`;

// ---------------------------------------------------------------------------
// InkSpillTransition Component
// ---------------------------------------------------------------------------

interface InkSpillTransitionProps {
  /** "enter" = parchment->dark, "exit" = dark->parchment */
  direction: "enter" | "exit";
  className?: string;
}

export function InkSpillTransition({
  direction,
  className = "",
}: InkSpillTransitionProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(0);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Scroll tracking scoped to this container
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    // Only the middle 60% of visibility drives the transition
    const mapped = Math.max(0, Math.min(1, (latest - 0.2) / 0.6));
    progressRef.current = mapped;
  });

  // WebGL init + render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;

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

      // Fullscreen triangle
      const geometry = new Geometry(gl, {
        position: {
          size: 2,
          data: new Float32Array([-1, -1, 3, -1, -1, 3]),
        },
        uv: { size: 2, data: new Float32Array([0, 0, 2, 0, 0, 2]) },
      });

      const program = new Program(gl, {
        vertex: VERTEX,
        fragment: FRAGMENT,
        uniforms: {
          uProgress: { value: 0 },
          uTime: { value: 0 },
          uDirection: { value: direction === "enter" ? 1.0 : -1.0 },
          uResolution: {
            value: [window.innerWidth, window.innerHeight],
          },
        },
        transparent: true,
        depthTest: false,
        depthWrite: false,
      });

      const mesh = new Mesh(gl, { geometry, program });

      const resize = () => {
        renderer.setSize(window.innerWidth, window.innerHeight);
        program.uniforms.uResolution.value = [
          window.innerWidth,
          window.innerHeight,
        ];
      };
      resize();
      window.addEventListener("resize", resize);

      const startTime = performance.now();

      const tick = () => {
        if (disposed) return;

        const elapsed = (performance.now() - startTime) * 0.001;
        program.uniforms.uTime.value = elapsed;
        program.uniforms.uProgress.value = progressRef.current;

        renderer.render({ scene: mesh });
        requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);

      cleanupRef.current = () => {
        window.removeEventListener("resize", resize);
        geometry.remove();
        program.remove();
        const ext = gl.getExtension("WEBGL_lose_context");
        if (ext) ext.loseContext();
      };
    });

    return () => {
      disposed = true;
      cleanupRef.current?.();
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
