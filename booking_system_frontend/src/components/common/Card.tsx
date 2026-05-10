/**
 * Card component using Carbon Design System Tile
 * Maintains compatibility with existing Card API
 */
import type { ReactNode } from 'react';
import { Tile, ClickableTile } from '@carbon/react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card = ({ children, className, hover = false, onClick }: CardProps) => {
  // Use ClickableTile if onClick is provided, otherwise use regular Tile
  if (onClick) {
    return (
      <motion.div
        whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
        transition={{ duration: 0.2 }}
      >
        <ClickableTile className={className} onClick={onClick}>
          {children}
        </ClickableTile>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
      transition={{ duration: 0.2 }}
    >
      <Tile className={className}>
        {children}
      </Tile>
    </motion.div>
  );
};

// Made with Bob
