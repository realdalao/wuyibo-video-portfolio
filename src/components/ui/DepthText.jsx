import { useEffect, useMemo, useRef } from "react";
import "./depth-text.css";

const MAX_LAYERS = 64;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const layerColor = (faceColor, depthColor, index, total) => {
  const progress = total <= 1 ? 1 : index / total;
  const faceMix = Math.round((1 - progress * progress) * 72 + 4);
  return `color-mix(in srgb, ${faceColor} ${faceMix}%, ${depthColor})`;
};
const rotation = (x, y) => `rotateX(${x.toFixed(3)}deg) rotateY(${y.toFixed(3)}deg)`;

export default function DepthText({
  text,
  layers = 26,
  depth = 1.1,
  faceColor = "#ffffff",
  depthColor = "#a855f7",
  tilt = 6,
  pointerTracking = true,
  smoothing = 0.14,
  perspective = 800,
  autoOrbit = true,
  orbitSpeed = 0.22,
  fontSize = "clamp(1.9rem, 4.2vw, 3.35rem)",
  fontWeight = 500,
  shadow = true,
  className = ""
}) {
  const rootRef = useRef(null);
  const stageRef = useRef(null);
  const safeLayers = clamp(Math.round(Number(layers) || 1), 2, MAX_LAYERS);
  const safeDepth = clamp(Number(depth) || 0, 0, 12);
  const safeTilt = clamp(Number(tilt) || 0, 0, 12);
  const safeSmoothing = clamp(Number(smoothing) || 0.14, 0.02, 0.35);
  const baseRotation = useMemo(() => ({ x: -safeTilt * 0.32, y: safeTilt * 0.42 }), [safeTilt]);

  const depthLayers = useMemo(() => Array.from({ length: safeLayers }, (_, layerIndex) => {
    const index = safeLayers - layerIndex;
    return {
      index,
      color: layerColor(faceColor, depthColor, index, safeLayers),
      transform: `translateZ(${-index * safeDepth}px)`
    };
  }), [depthColor, faceColor, safeDepth, safeLayers]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return undefined;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const canTrack = pointerTracking && finePointer && !reducedMotion;
    const current = { ...baseRotation };
    const target = { ...baseRotation };
    let activePointer = false;
    let frame = 0;
    const start = performance.now();
    const apply = () => stage.style.setProperty("--depth-text-transform", rotation(current.x, current.y));
    const move = (event) => {
      const rect = root.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      activePointer = true;
      const x = clamp((event.clientX - rect.left - rect.width / 2) / (rect.width * 0.8), -1, 1);
      const y = clamp((event.clientY - rect.top - rect.height / 2) / (rect.height * 0.8), -1, 1);
      target.x = baseRotation.x - y * safeTilt;
      target.y = baseRotation.y + x * safeTilt;
    };
    const leave = () => {
      activePointer = false;
      target.x = baseRotation.x;
      target.y = baseRotation.y;
    };
    if (canTrack) {
      window.addEventListener("pointermove", move, { passive: true });
      window.addEventListener("blur", leave);
    }
    const tick = (now) => {
      if ((!canTrack || !activePointer) && autoOrbit && !reducedMotion) {
        const orbit = ((now - start) / 1000) * orbitSpeed * Math.PI * 2;
        target.x = baseRotation.x + Math.sin(orbit) * safeTilt * 0.18;
        target.y = baseRotation.y + Math.cos(orbit * 0.85) * safeTilt * 0.18;
      }
      current.x += (target.x - current.x) * safeSmoothing;
      current.y += (target.y - current.y) * safeSmoothing;
      apply();
      frame = requestAnimationFrame(tick);
    };
    apply();
    if (!reducedMotion) frame = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", leave);
      cancelAnimationFrame(frame);
    };
  }, [autoOrbit, baseRotation, orbitSpeed, pointerTracking, safeSmoothing, safeTilt]);

  const style = {
    "--depth-text-perspective": `${perspective}px`,
    "--depth-text-font-size": fontSize,
    "--depth-text-font-weight": fontWeight,
    "--depth-text-face-color": faceColor,
    "--depth-text-depth-color": depthColor,
    "--depth-text-shadow": shadow
      ? `0 14px 24px color-mix(in srgb, ${depthColor} 30%, transparent), 0 3px 6px rgba(0, 0, 0, 0.24)`
      : "none"
  };

  return (
    <span ref={rootRef} className={`depth-text ${className}`.trim()} style={style}>
      <span ref={stageRef} className="depth-text__stage">
        {depthLayers.map((layer) => (
          <span
            aria-hidden="true"
            className="depth-text__layer"
            key={layer.index}
            style={{ "--depth-layer-color": layer.color, transform: layer.transform }}
          >
            {text}
          </span>
        ))}
        <span className="depth-text__face">{text}</span>
      </span>
    </span>
  );
}
