/**
 * Test component to verify Carbon Design System installation
 * This component can be removed after migration is complete
 */
import { Button } from '@carbon/react';

export const CarbonTest = () => {
  return (
    <div style={{ padding: '2rem', background: 'var(--space-dark)' }}>
      <h2 style={{ color: 'var(--star-white)', marginBottom: '1rem' }}>
        Carbon Design System Test
      </h2>
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Button kind="primary">Primary Button</Button>
        <Button kind="secondary">Secondary Button</Button>
        <Button kind="tertiary">Tertiary Button</Button>
        <Button kind="danger">Danger Button</Button>
        <Button kind="ghost">Ghost Button</Button>
      </div>
      <p style={{ color: 'var(--star-white)', marginTop: '1rem', fontSize: '0.875rem' }}>
        ✅ If you can see styled buttons above, Carbon is working correctly!
      </p>
    </div>
  );
};

// Made with Bob