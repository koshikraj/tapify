"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

const circleVariants: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    transition: {
      duration: 0.3,
      opacity: { duration: 0.1 },
    },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  },
};

const lineVariants: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    transition: {
      duration: 0.3,
      opacity: { duration: 0.1 },
    },
  },
  slash: () => ({
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  }),
};

const BanIcon = () => {
  const controls = useAnimation();

  return (
    <div
      className="cursor-pointer select-none p-2 text-red-600 rounded-md transition-colors duration-200 flex items-center justify-center"
      onLoad={() => {
        controls.start("animate");
        controls.start("slash", { delay: 0.5 });
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="100"
        height="100"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.circle
          cx="12"
          cy="12"
          r="10"
          variants={circleVariants}
          initial="normal"
          animate={controls}
        />
        <motion.path
          d="m4.9 4.9 14.2 14.2"
          variants={lineVariants}
          initial="normal"
          animate={controls}
        />
      </svg>
    </div>
  );
};

export { BanIcon };
