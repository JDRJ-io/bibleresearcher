/**
 * Simple Background Component
 * Provides static gradient backgrounds for peaceful Bible study
 * No animations, no heavy processing
 */

interface DynamicBackgroundProps {
  className?: string;
}

export function DynamicBackground({ className = '' }: DynamicBackgroundProps) {
  // Simple, static background with minimal processing
  const backgroundClasses = [
    'dynamic-background',
    className
  ].filter(Boolean).join(' ');

  return <div className={backgroundClasses} />;
}

export default DynamicBackground;