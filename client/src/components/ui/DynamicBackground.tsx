/**
 * Simple Background Component
 * Provides clean static gradients for light and dark themes
 */

interface DynamicBackgroundProps {
  className?: string;
}

export function DynamicBackground({ className = '' }: DynamicBackgroundProps) {
  const backgroundClasses = [
    'dynamic-background',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={backgroundClasses} />
  );
}

export default DynamicBackground;