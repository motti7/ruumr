import React from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

// Root screens that slide in from bottom (like tab screens)
const ROOT_SCREENS = ["/Discover", "/Matches", "/LikesYou", "/GroupTracker", "/", ""];

const isRootScreen = (pathname) =>
  ROOT_SCREENS.some(
    (r) => pathname === r || pathname === `/${r.replace(/^\//, "")}`
  );

export default function PageTransition({ children }) {
  const location = useLocation();
  const root = isRootScreen(location.pathname);

  const variants = {
    initial: root
      ? { opacity: 1 }
      : { x: "-100%", opacity: 0 },
    animate: root
      ? { opacity: 1 }
      : { x: 0, opacity: 1 },
    exit: root
      ? { opacity: 1 }
      : { x: "100%", opacity: 0 },
  };

  return (
    <motion.div
      key={location.pathname}
      variants={variants}
      initial={root ? false : "initial"}
      animate="animate"
      exit="exit"
      transition={{ type: "tween", duration: 0.22, ease: "easeInOut" }}
      style={{ width: "100%", height: "100%" }}
    >
      {children}
    </motion.div>
  );
}
