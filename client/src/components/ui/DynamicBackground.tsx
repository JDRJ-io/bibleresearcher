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

  // Show video background only for monastery theme
  useEffect(() => {
    setShowVideo(theme === 'monastery-candlelight' && !videoError);
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
      {/* Video background for monastery theme */}
      {showVideo && (
        <video
          className="background-video"
          autoPlay
          loop
          muted
          playsInline
          onError={handleVideoError}
          onLoadedData={handleVideoLoad}
        >
          <source src="/monastery-library.mp4" type="video/mp4" />
          <source src="/monastery-library.webm" type="video/webm" />
        </video>
      )}
      
      {/* Fallback image for monastery theme when video fails */}
      {theme === 'monastery-candlelight' && (videoError || !showVideo) && (
        <div 
          className="background-image-fallback"
          style={{
            backgroundImage: 'url("/monastery-fallback.jpg")'
          }}
        />
      )}
      
      {/* Candlelight flicker overlay */}
      <div className="flicker-overlay" />
      
      {/* Standard gradient background */}
      <div className={backgroundClasses} />
    </>
  );
}

export default DynamicBackground;