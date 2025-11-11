import type { Scale } from '@/lib/smartScrollbar';

type BandBackgroundsProps = {
  scale: Scale;
  height: number;
  version?: number; // Force re-render when version changes
};

export function BandBackgrounds({ scale, height, version }: BandBackgroundsProps) {
  return (
    <>
      {scale.bands.map((band, index) => {
        const y0 = (band.y0 ?? 0) * height;
        const y1 = (band.y1 ?? 1) * height;
        const bandHeight = y1 - y0;
        
        // Determine color based on band type
        let bgColor = 'transparent';
        if (band.id.startsWith('test:')) {
          // Testament bands - very subtle tint
          bgColor = band.id === 'test:OT' 
            ? 'rgba(139, 92, 246, 0.05)' // Purple tint for OT
            : 'rgba(59, 130, 246, 0.05)';  // Blue tint for NT
        } else if (band.id.startsWith('sec:')) {
          // Section bands - slightly more visible
          bgColor = 'rgba(59, 130, 246, 0.08)';
        }
        
        return (
          <div
            key={band.id || index}
            className="absolute left-0 right-0 pointer-events-none"
            style={{
              top: `${y0}px`,
              height: `${bandHeight}px`,
              backgroundColor: bgColor,
              transition: 'all 180ms ease-out'
            }}
          />
        );
      })}
    </>
  );
}
