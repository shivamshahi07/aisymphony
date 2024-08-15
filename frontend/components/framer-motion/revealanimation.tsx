'use client'
import React, { ReactNode } from 'react';
import { motion } from "framer-motion";

interface RevealAnimationProps {
  children: ReactNode;
  className?: string;
  direction?: 'left' | 'right' | 'top' | 'bottom';
}

const RevealAnimation = ({ children, className, direction = 'left' }: RevealAnimationProps) => {
  const getInitialClipPath = () => {
    switch (direction) {
      case 'left':
        return "inset(0 0 0 100%)";
      case 'right':
        return "inset(0 100% 0 0)";
      case 'top':
        return "inset(100% 0 0 0)";
      case 'bottom':
        return "inset(0 0 100% 0)";
      default:
        return "inset(0 0 0 100%)";
    }
  };

  return (
    <motion.div
      className={`w-full flex justify-center ${className}`}
      initial={{ clipPath: getInitialClipPath() }}
      animate={{ clipPath: "inset(0 0 0 0)" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
};

export default RevealAnimation;