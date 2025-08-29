/**
 * Enhanced Background Component
 * Provides static gradients and video backgrounds for immersive Bible study
 * Includes monastery candlelight theme support
 */

import { useTheme } from '@/components/bible/ThemeProvider';
import { useEffect, useState } from 'react';

interface DynamicBackgroundProps {
  className?: string;
}

export function DynamicBackground({ className = '' }: DynamicBackgroundProps) {
  const { theme } = useTheme();
  const [videoError, setVideoError] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  // Show video background for monastery and meadow themes
  useEffect(() => {
    setShowVideo((theme === 'monastery-candlelight' || theme === 'mystical-meadow') && !videoError);
  }, [theme, videoError]);

  const backgroundClasses = [
    'dynamic-background',
    className
  ].filter(Boolean).join(' ');

  const handleVideoError = () => {
    console.log('📹 Video background failed to load, using fallback');
    setVideoError(true);
  };

  const handleVideoLoad = () => {
    console.log('📹 Monastery video background loaded successfully');
  };

  return (
    <>
      {/* Video background for monastery and meadow themes */}
      {showVideo && (
        <video
          className={`background-video ${theme === 'mystical-meadow' ? 'meadow-filter' : ''}`}
          autoPlay
          loop
          muted
          playsInline
          onError={handleVideoError}
          onLoadedData={handleVideoLoad}
        >
          {theme === 'mystical-meadow' ? (
            <>
              <source src="/meadow-fireflies.mp4" type="video/mp4" />
              <source src="/meadow-fireflies.webm" type="video/webm" />
            </>
          ) : (
            <>
              <source src="/monastery-library.mp4" type="video/mp4" />
              <source src="/monastery-library.webm" type="video/webm" />
            </>
          )}
        </video>
      )}
      
      {/* Fallback images when video fails */}
      {(theme === 'monastery-candlelight' || theme === 'mystical-meadow') && (videoError || !showVideo) && (
        <div 
          className="background-image-fallback"
          style={{
            backgroundImage: theme === 'mystical-meadow' 
              ? 'url("/meadow-fallback.jpg")' 
              : 'url("/monastery-fallback.jpg")'
          }}
        />
      )}
      
      {/* Candlelight flicker overlay */}
      <div className="flicker-overlay" />
      
      {/* Mystical orb overlay */}
      <div className="orb-overlay">
        {Array.from({ length: 25 }, (_, i) => (
          <div 
            key={i}
            className="orb"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `-${Math.random() * 8}s`,
              width: `${25 + Math.random() * 20}px`,
              height: `${25 + Math.random() * 20}px`
            }}
          />
        ))}
      </div>
      
      {/* Aurora orb overlay for celestial theme */}
      <div className="aurora-orb-overlay">
        {Array.from({ length: 20 }, (_, i) => (
          <div 
            key={i}
            className="aurora-orb"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `-${Math.random() * 8}s`
            }}
          />
        ))}
      </div>
      
      {/* Rainbow gradient overlay for spectral covenant */}
      <div className="rainbow-overlay" />
      
      {/* Aurora wave overlay for celestial veil */}
      <div className="aurora-overlay" />
      
      {/* Electric lightning overlay for electric voodoo */}
      <div className="electric-overlay" />
      
      {/* Standard gradient background */}
      <div className={backgroundClasses} />
    </>
  );
}

export default DynamicBackground;