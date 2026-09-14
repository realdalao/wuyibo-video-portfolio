import { motion } from "motion/react";
import { memo, useEffect, useMemo, useRef, useState } from "react";

const buildKeyframes = (from, steps) => {
  const keys = new Set([...Object.keys(from), ...steps.flatMap(step => Object.keys(step))]);
  const keyframes = {};
  keys.forEach(key => { keyframes[key] = [from[key], ...steps.map(step => step[key])]; });
  return keyframes;
};

function BlurText({
  text = "", delay = 150, className = "", animateBy = "words",
  direction = "top", threshold = 0.1, rootMargin = "0px",
  animationFrom, animationTo, easing = t => t,
  onAnimationComplete, stepDuration = 0.35, as: Tag = "p"
}) {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInView(true);
      return undefined;
    }
    const node = ref.current;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.unobserve(node);
      }
    }, { threshold, rootMargin });
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin]);

  const defaultFrom = useMemo(() => direction === "top"
    ? { filter: "blur(10px)", opacity: 0, y: -50 }
    : { filter: "blur(10px)", opacity: 0, y: 50 }, [direction]);
  const defaultTo = useMemo(() => [
    { filter: "blur(5px)", opacity: 0.5, y: direction === "top" ? 5 : -5 },
    { filter: "blur(0px)", opacity: 1, y: 0 }
  ], [direction]);
  const fromSnapshot = animationFrom ?? defaultFrom;
  const toSnapshots = animationTo ?? defaultTo;
  const stepCount = toSnapshots.length + 1;
  const totalDuration = stepDuration * (stepCount - 1);
  const times = Array.from({ length: stepCount }, (_, index) => stepCount === 1 ? 0 : index / (stepCount - 1));
  const animateKeyframes = buildKeyframes(fromSnapshot, toSnapshots);

  return (
    <Tag ref={ref} className={`blur-text ${className}`.trim()}>
      {elements.map((segment, index) => (
        <motion.span
          className="blur-text-segment"
          key={`${segment}-${index}`}
          initial={fromSnapshot}
          animate={inView ? animateKeyframes : fromSnapshot}
          transition={{ duration: totalDuration, times, delay: (index * delay) / 1000, ease: easing }}
          onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
        >
          {segment === " " ? "\u00a0" : segment}
          {animateBy === "words" && index < elements.length - 1 ? "\u00a0" : null}
        </motion.span>
      ))}
    </Tag>
  );
}

export default memo(BlurText);
