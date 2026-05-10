/**
 * Button component using Carbon Design System
 * Maintains compatibility with existing Button API while using Carbon components
 */
import { Button as CarbonButton } from '@carbon/react';
import { motion } from 'framer-motion';
import type { ComponentProps } from 'react';

type CarbonButtonProps = ComponentProps<typeof CarbonButton>;

interface ButtonProps extends Omit<CarbonButtonProps, 'kind' | 'size'> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = ({ 
  variant = 'primary', 
  size = 'md',
  isLoading = false,
  children,
  disabled,
  className,
  ...props 
}: ButtonProps) => {
  // Map custom variants to Carbon kinds
  const kindMap: Record<string, CarbonButtonProps['kind']> = {
    primary: 'primary',
    secondary: 'secondary',
    danger: 'danger',
    ghost: 'ghost',
    tertiary: 'tertiary'
  };

  // Map custom sizes to Carbon sizes
  const sizeMap: Record<string, CarbonButtonProps['size']> = {
    sm: 'sm',
    md: 'md',
    lg: 'lg'
  };

  // Wrap Carbon Button with Framer Motion for animations
  return (
    <motion.div
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      style={{ display: 'inline-block' }}
    >
      <CarbonButton
        kind={kindMap[variant]}
        size={sizeMap[size]}
        disabled={disabled || isLoading}
        className={className}
        {...props}
      >
        {isLoading ? 'Loading...' : children}
      </CarbonButton>
    </motion.div>
  );
};

// Made with Bob
