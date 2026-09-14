import { useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";

import ShimmerText from "./ShimmerText";
import "./page-loader.css";

export default function PageLoader({ visible }) {
  useEffect(() => {
    document.documentElement.classList.toggle("is-page-loading", visible);
    return () => document.documentElement.classList.remove("is-page-loading");
  }, [visible]);

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="page-loader"
          role="status"
          aria-live="polite"
          aria-label="页面正在加载"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
        >
          <ShimmerText className="page-loader-title" duration={1.35}>
            吴义博作品集
          </ShimmerText>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
