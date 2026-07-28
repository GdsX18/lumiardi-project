'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer } from '@/lib/animations';

export interface StaggerContainerProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export const StaggerContainer: React.FC<StaggerContainerProps> = ({
  children,
  className,
}) => {
  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
