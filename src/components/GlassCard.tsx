import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  aurora?: boolean;
  hover?: boolean;
  tilt?: boolean;
}

export default function GlassCard({ 
  children, 
  className, 
  glow = false, 
  aurora = false, 
  hover = false,
  tilt = false 
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'glass-card',
        glow && 'pulse-glow',
        aurora && 'aurora-border',
        hover && 'magnetic-hover',
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      whileHover={tilt ? { 
        rotateX: 5, 
        rotateY: 5, 
        scale: 1.02,
        transition: { duration: 0.2 }
      } : hover ? {
        y: -4,
        scale: 1.02,
        transition: { duration: 0.2 }
      } : {}}
      style={{
        transformStyle: 'preserve-3d',
        perspective: 1000
      }}
    >
      {children}
    </motion.div>
  );
}
