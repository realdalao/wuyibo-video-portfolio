import { memo, useRef } from "react";
import { motion, useInView } from "motion/react";
import "./AnimatedListItem.css";

function AnimatedListItem({ children, delay = 0, index }) {
  const ref = useRef(null);
  const inView = useInView(ref, { amount: 0.35, once: true });

  return (
    <motion.div
      ref={ref}
      className="animated-video-list-item"
      data-index={index}
      initial={{ scale: 0.7, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.7, opacity: 0 }}
      transition={{ duration: 0.28, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </motion.div>
  );
}

export default memo(AnimatedListItem);
