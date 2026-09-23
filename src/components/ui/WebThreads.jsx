import { useEffect, useRef, useState } from "react";
import { Mesh, Program, Renderer, Triangle } from "ogl";
import "./web-threads.css";

const vertex = `#version 300 es
in vec2 position;
void main() { gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime, uSpeed, uCount, uFrequency, uSpread, uTaper, uPosition;
uniform float uGlow, uFalloff, uThickness, uBrightness, uOpacity, uMirror;
uniform float uShimmer, uGrain, uGrainIntensity, uMouseStrength, uMouseActive, uPinchPosition;
uniform vec3 uColor1, uColor2, uColor3;
uniform vec2 uMouse;
out vec4 fragColor;
#define TAU 6.28318530718
#define MAX_THREADS 10

float filamentGlow(float distance, float falloff, float strength) {
  return strength / pow(max(distance, 0.0001), falloff);
}

void main() {
  vec2 uv = gl_FragCoord.xy / iResolution.xy;
  float threads = max(uCount, 1.0);
  float pinch = mix(uPinchPosition, uMouse.x, uMouseStrength * uMouseActive);
  float distanceFromPinch = uSpread * abs(uv.x - pinch);
  float inverseThickness = 1.0 / max(uThickness, 0.01);
  float energy = 0.0;
  vec3 color = vec3(0.0);
  for (int index = 0; index < MAX_THREADS; index++) {
    float i = float(index);
    if (i >= threads) break;
    float amplitude = distanceFromPinch * (1.0 + i * uTaper);
    float shimmer = uShimmer > 0.5 ? sin(iTime * 1.7 + i * 1.3) * 0.35 : 0.0;
    float phase = (iTime * uSpeed + i * TAU / threads) * (uMirror > 0.5 ? sign(pinch - uv.x) : 1.0) + shimmer;
    float line = abs(uv.y - uPosition + sin(uv.x * uFrequency + phase) * amplitude) * inverseThickness;
    float glow = filamentGlow(line, uFalloff, uGlow);
    float mixAmount = threads > 1.0 ? i / (threads - 1.0) : 0.0;
    color += glow * mix(uColor1, uColor2, mixAmount);
    energy += glow;
  }
  color = mix(color, uColor3 * energy, smoothstep(0.5, 2.2, energy) * 0.5);
  float brightness = uBrightness + uMouseStrength * uMouseActive * exp(-dot(uv - uMouse, uv - uMouse) * 6.0) * 0.6;
  color *= brightness;
  // Keep the canvas genuinely transparent away from the filaments. Using the
  // raw accumulated glow as alpha leaves a faint full-canvas rectangle because
  // the inverse-power glow never reaches zero.
  float alpha = smoothstep(0.2, 0.72, energy) * uOpacity;
  float peak = max(color.r, max(color.g, color.b));
  vec3 luminousColor = peak > 0.0001 ? color / peak : vec3(0.0);
  luminousColor = mix(luminousColor, vec3(1.0), smoothstep(0.35, 1.4, energy) * 0.28);
  if (uGrain > 0.5) {
    float grain = (fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453) - 0.5) * uGrainIntensity;
    luminousColor = clamp(luminousColor + grain * alpha, 0.0, 1.0);
  }
  fragColor = vec4(luminousColor * alpha, alpha);
}`;

const toRgb = (hex) => {
  const value = hex.replace("#", "");
  return new Float32Array([0, 2, 4].map((start) => parseInt(value.slice(start, start + 2), 16) / 255));
};

export default function WebThreads({
  color1 = "#5227ff",
  color2 = "#ad2831",
  color3 = "#ffffff",
  speed = 0.2,
  threadCount = 6,
  frequency = 5,
  spread = 0.18,
  taper = 1,
  position = 0.5,
  glow = 0.02,
  falloff = 0.6,
  thickness = 1.1,
  brightness = 0.6,
  opacity = 1,
  mirror = true,
  shimmer = false,
  grain = true,
  grainIntensity = 0.05,
  mouseInteraction = true,
  mouseStrength = 0.3,
  pinchPosition = 0.64,
  className = ""
}) {
  const mountRef = useRef(null);
  const [isCompactViewport, setIsCompactViewport] = useState(() => (
    typeof window !== "undefined" && window.matchMedia("(max-width: 720px)").matches
  ));

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const updateViewport = () => setIsCompactViewport(mediaQuery.matches);
    updateViewport();
    mediaQuery.addEventListener("change", updateViewport);
    return () => mediaQuery.removeEventListener("change", updateViewport);
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (isCompactViewport || !mount || !window.WebGL2RenderingContext) return undefined;

    const renderer = new Renderer({ webgl: 2, alpha: true, premultipliedAlpha: true, dpr: Math.min(devicePixelRatio, 2) });
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    const canvas = gl.canvas;
    mount.appendChild(canvas);

    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        iResolution: { value: new Float32Array([1, 1]) }, iTime: { value: 0 },
        uSpeed: { value: speed }, uCount: { value: threadCount }, uFrequency: { value: frequency },
        uSpread: { value: spread }, uTaper: { value: taper }, uPosition: { value: position },
        uGlow: { value: glow }, uFalloff: { value: falloff }, uThickness: { value: thickness },
        uBrightness: { value: brightness }, uOpacity: { value: opacity }, uMirror: { value: mirror ? 1 : 0 },
        uShimmer: { value: shimmer ? 1 : 0 }, uGrain: { value: grain ? 1 : 0 }, uGrainIntensity: { value: grainIntensity },
        uMouseStrength: { value: mouseStrength }, uMouseActive: { value: 0 }, uPinchPosition: { value: pinchPosition }, uMouse: { value: new Float32Array([0.5, 0.5]) },
        uColor1: { value: toRgb(color1) }, uColor2: { value: toRgb(color2) }, uColor3: { value: toRgb(color3) }
      }
    });
    const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      renderer.setSize(Math.max(1, width), Math.max(1, height));
      program.uniforms.iResolution.value.set([gl.drawingBufferWidth, gl.drawingBufferHeight]);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    const move = (event) => {
      const bounds = canvas.getBoundingClientRect();
      program.uniforms.uMouse.value[0] = (event.clientX - bounds.left) / bounds.width;
      program.uniforms.uMouse.value[1] = 1 - (event.clientY - bounds.top) / bounds.height;
      program.uniforms.uMouseActive.value = mouseInteraction ? 1 : 0;
    };
    const leave = () => { program.uniforms.uMouseActive.value = 0; };
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("blur", leave);
    let frame = 0;
    const start = performance.now();
    const render = (now) => {
      program.uniforms.iTime.value = (now - start) / 1000;
      renderer.render({ scene: mesh });
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", leave);
      canvas.remove();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [brightness, color1, color2, color3, falloff, frequency, glow, grain, grainIntensity, isCompactViewport, mirror, mouseInteraction, mouseStrength, opacity, pinchPosition, position, shimmer, speed, spread, taper, thickness, threadCount]);

  if (isCompactViewport) return null;
  return <div ref={mountRef} className={`web-threads ${className}`.trim()} aria-hidden="true" />;
}
