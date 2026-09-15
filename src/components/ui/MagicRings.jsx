import { useEffect, useRef } from "react";
import * as THREE from "three";
import "./magic-rings.css";

const vertexShader = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
precision highp float;
uniform float uTime, uAttenuation, uLineThickness, uBaseRadius, uRadiusStep, uScaleRate;
uniform float uOpacity, uNoiseAmount, uRotation, uRingGap, uFadeIn, uFadeOut;
uniform vec2 uResolution;
uniform vec3 uColor, uColorTwo;
uniform int uRingCount;
const float HP = 1.5707963;
const float CYCLE = 3.45;

float fade(float t) {
  return t < uFadeIn ? smoothstep(0.0, uFadeIn, t) : 1.0 - smoothstep(uFadeOut, CYCLE - 0.2, t);
}

float ring(vec2 p, float ri, float cut, float t0, float px) {
  float t = mod(uTime + t0, CYCLE);
  float r = ri + t / CYCLE * uScaleRate;
  float d = abs(length(p) - r);
  float a = atan(abs(p.y), abs(p.x)) / HP;
  float th = max(1.0 - a, 0.5) * px * uLineThickness;
  float h = (1.0 - smoothstep(th, th * 1.5, d)) + 1.0;
  d += pow(cut * a, 3.0) * r;
  return h * exp(-uAttenuation * d) * fade(t);
}

void main() {
  float px = 1.0 / min(uResolution.x, uResolution.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) * px;
  float cr = cos(uRotation), sr = sin(uRotation);
  p = mat2(cr, -sr, sr, cr) * p;
  vec3 c = vec3(0.0);
  float coverage = 0.0;
  float rcf = max(float(uRingCount) - 1.0, 1.0);
  for (int i = 0; i < 10; i++) {
    if (i >= uRingCount) break;
    float fi = float(i);
    vec3 rc = mix(uColor, uColorTwo, fi / rcf);
    float amount = ring(p, uBaseRadius + fi * uRadiusStep, pow(uRingGap, fi), i == 0 ? 0.0 : 2.95 * fi, px);
    c = mix(c, rc, vec3(amount));
    coverage = max(coverage, amount);
  }
  float noise = fract(sin(dot(gl_FragCoord.xy + uTime * 100.0, vec2(12.9898, 78.233))) * 43758.5453);
  c += (noise - 0.5) * uNoiseAmount;
  float intensity = max(c.r, max(c.g, c.b));
  vec3 outputColor = intensity > 0.0001 ? clamp(c / intensity, 0.0, 1.0) : vec3(0.0);
  gl_FragColor = vec4(outputColor, clamp(max(intensity, coverage) * uOpacity, 0.0, 1.0));
}
`;

export default function MagicRings({
  active = true,
  color = "#468ee8",
  colorTwo = "#a879ff",
  ringCount = 6,
  speed = 0.75,
  attenuation = 10,
  lineThickness = 2,
  baseRadius = 0.35,
  radiusStep = 0.1,
  scaleRate = 0.1,
  opacity = 0.5,
  noiseAmount = 0.03,
  rotation = 0,
  ringGap = 1.5,
  fadeIn = 0.7,
  fadeOut = 0.5
}) {
  const mountRef = useRef(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    } catch {
      return undefined;
    }

    // The canvas itself is the player-page background, so it must obscure
    // the page beneath while the animated rings remain the only visual layer.
    renderer.setClearColor(0x080b12, 1);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10);
    camera.position.z = 1;
    const uniforms = {
      uTime: { value: 0 }, uAttenuation: { value: attenuation }, uResolution: { value: new THREE.Vector2() },
      uColor: { value: new THREE.Color(color) }, uColorTwo: { value: new THREE.Color(colorTwo) },
      uLineThickness: { value: lineThickness }, uBaseRadius: { value: baseRadius }, uRadiusStep: { value: radiusStep },
      uScaleRate: { value: scaleRate }, uRingCount: { value: ringCount }, uOpacity: { value: opacity },
      uNoiseAmount: { value: noiseAmount }, uRotation: { value: rotation * Math.PI / 180 },
      uRingGap: { value: ringGap }, uFadeIn: { value: fadeIn }, uFadeOut: { value: fadeOut }
    };
    const material = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, transparent: true });
    const geometry = new THREE.PlaneGeometry(1, 1);
    scene.add(new THREE.Mesh(geometry, material));

    const resize = () => {
      const width = mount.clientWidth;
      const height = mount.clientHeight;
      const dpr = Math.min(window.devicePixelRatio, 2);
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      uniforms.uResolution.value.set(width * dpr, height * dpr);
    };
    resize();
    // Compile and paint once while the layer is hidden, so opening the player
    // never has to pay the WebGL shader warm-up cost.
    renderer.compile(scene, camera);
    renderer.render(scene, camera);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    let frameId = 0;
    let lastTime = 0;
    const render = (time) => {
      const delta = lastTime ? Math.min(time - lastTime, 100) : 0;
      lastTime = time;
      if (activeRef.current) {
        uniforms.uTime.value += delta * 0.001 * speed;
        renderer.render(scene, camera);
      }
      frameId = requestAnimationFrame(render);
    };

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !frameId) frameId = requestAnimationFrame(render);
      if (!entry.isIntersecting && frameId) {
        cancelAnimationFrame(frameId);
        frameId = 0;
        lastTime = 0;
      }
    });
    observer.observe(mount);

    return () => {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      resizeObserver.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [attenuation, baseRadius, color, colorTwo, fadeIn, fadeOut, lineThickness, noiseAmount, opacity, radiusStep, ringCount, ringGap, rotation, scaleRate, speed]);

  return <div ref={mountRef} className="magic-rings-container" aria-hidden="true" />;
}
