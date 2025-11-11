interface ScrollbarLabelProps {
  label: string;
  className?: string;
  style?: React.CSSProperties;
}

export function ScrollbarLabel({ label, className = "", style }: ScrollbarLabelProps) {
  return (
    <div
      className={`text-xs font-medium text-muted-foreground/60 tracking-wider select-none pointer-events-none ${className}`}
      style={{
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
        top: '4rem',
        ...style,
      }}
      data-testid="scrollbar-label"
    >
      {label}
    </div>
  );
}
