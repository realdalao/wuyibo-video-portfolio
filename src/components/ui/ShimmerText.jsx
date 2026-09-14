import { motion } from "motion/react";

import "./shimmer-text.css";

export default function ShimmerText({
  children,
  className = "",
  duration = 1.5,
  delay = 0.15,
}) {
  return (
    <div className="shimmer-text-wrap">
      <motion.div
        className={`shimmer-text ${className}`.trim()}
        initial={{ backgroundPositionX: "250%" }}
        animate={{ backgroundPositionX: ["-100%", "250%"] }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          repeatDelay: 0.65,
          ease: "linear",
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}
