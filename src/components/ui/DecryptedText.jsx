import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";

const visuallyHidden = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  border: 0,
};

export default function DecryptedText({
  text,
  speed = 52,
  delay = 0,
  characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
  sequential = true,
  revealDirection = "start",
  useOriginalCharsOnly = true,
  className = "",
  encryptedClassName = "",
  animateOn = "view",
}) {
  const [displayText, setDisplayText] = useState(text);
  const [revealed, setRevealed] = useState(new Set());
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef(null);
  const hasStartedRef = useRef(false);

  const availableCharacters = useMemo(() => {
    const source = useOriginalCharsOnly
      ? Array.from(new Set(text.replaceAll(" ", "")))
      : characters.split("");
    return source.length ? source : characters.split("");
  }, [characters, text, useOriginalCharsOnly]);

  const shuffle = useCallback((visible) => (
    text.split("").map((character, index) => {
      if (character === " " || visible.has(index)) return character;
      return availableCharacters[Math.floor(Math.random() * availableCharacters.length)];
    }).join("")
  ), [availableCharacters, text]);

  const revealOrder = useMemo(() => {
    const indices = Array.from({ length: text.length }, (_, index) => index);
    if (revealDirection === "end") return indices.reverse();
    if (revealDirection !== "center") return indices;
    const middle = Math.floor(text.length / 2);
    return indices.sort((a, b) => Math.abs(a - middle) - Math.abs(b - middle));
  }, [revealDirection, text.length]);

  useEffect(() => {
    if (animateOn !== "view" || !containerRef.current) return undefined;
    let startTimer;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasStartedRef.current) {
        hasStartedRef.current = true;
        startTimer = window.setTimeout(() => {
          setRevealed(new Set());
          setDisplayText(shuffle(new Set()));
          setIsAnimating(true);
        }, delay);
      }
    }, { threshold: 0.12 });
    observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      window.clearTimeout(startTimer);
    };
  }, [animateOn, delay, shuffle]);

  useEffect(() => {
    if (!isAnimating) return undefined;
    let position = 0;
    const interval = window.setInterval(() => {
      setRevealed((previous) => {
        const next = new Set(previous);
        if (sequential) {
          const index = revealOrder[position++];
          if (index !== undefined) next.add(index);
        } else {
          text.split("").forEach((_, index) => {
            if (Math.random() > 0.65) next.add(index);
          });
        }
        setDisplayText(shuffle(next));
        if (next.size >= text.length) {
          window.clearInterval(interval);
          setDisplayText(text);
          setIsAnimating(false);
        }
        return next;
      });
    }, speed);
    return () => window.clearInterval(interval);
  }, [isAnimating, revealOrder, sequential, shuffle, speed, text]);

  return (
    <motion.span ref={containerRef} className="decrypted-text">
      <span style={visuallyHidden}>{text}</span>
      <span aria-hidden="true">
        {displayText.split("").map((character, index) => (
          <span key={`${character}-${index}`} className={revealed.has(index) || !isAnimating ? className : encryptedClassName}>
            {character}
          </span>
        ))}
      </span>
    </motion.span>
  );
}
