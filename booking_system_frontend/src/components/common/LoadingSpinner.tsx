/**
 * LoadingSpinner component using Carbon Design System Loading
 * Maintains compatibility with existing LoadingSpinner API
 */
import { Loading } from '@carbon/react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export const LoadingSpinner = ({ size = 'md', text }: LoadingSpinnerProps) => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <Loading
        description={text || 'Loading...'}
        withOverlay={false}
        small={size === 'sm'}
      />
    </div>
  );
};

// Made with Bob
