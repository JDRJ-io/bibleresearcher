import { useState, useEffect, useRef } from 'react';

interface LoadingState {
  isLoading: boolean;
  loadingType: 'initial' | 'navigation' | 'data' | 'search' | null;
  connectionSpeed: 'fast' | 'medium' | 'slow' | 'unknown';
  estimatedLoadTime: number;
}

export function useLoadingDetection() {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    loadingType: null,
    connectionSpeed: 'unknown',
    estimatedLoadTime: 0
  });
  
  const loadStartTime = useRef<number | null>(null);
  const connectionSpeedRef = useRef<'fast' | 'medium' | 'slow' | 'unknown'>('unknown');

  // Detect connection speed using Navigation Timing API
  useEffect(() => {
    const detectConnectionSpeed = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection) {
          const effectiveType = connection.effectiveType;
          switch (effectiveType) {
            case '4g':
              connectionSpeedRef.current = 'fast';
              break;
            case '3g':
              connectionSpeedRef.current = 'medium';
              break;
            case '2g':
            case 'slow-2g':
              connectionSpeedRef.current = 'slow';
              break;
            default:
              connectionSpeedRef.current = 'medium';
          }
        }
      } else if (performance && performance.timing) {
        // Fallback: estimate based on page load time
        const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart;
        if (loadTime < 1000) {
          connectionSpeedRef.current = 'fast';
        } else if (loadTime < 3000) {
          connectionSpeedRef.current = 'medium';
        } else {
          connectionSpeedRef.current = 'slow';
        }
      }
      
      setLoadingState(prev => ({
        ...prev,
        connectionSpeed: connectionSpeedRef.current
      }));
    };

    detectConnectionSpeed();
  }, []);

  const startLoading = (type: LoadingState['loadingType'] = 'data') => {
    loadStartTime.current = Date.now();
    
    // Estimate load time based on connection speed and type
    let estimatedTime = 1000; // Default 1 second
    
    switch (connectionSpeedRef.current) {
      case 'fast':
        estimatedTime = type === 'initial' ? 800 : 400;
        break;
      case 'medium':
        estimatedTime = type === 'initial' ? 1500 : 800;
        break;
      case 'slow':
        estimatedTime = type === 'initial' ? 3000 : 1500;
        break;
      default:
        estimatedTime = type === 'initial' ? 1200 : 600;
    }
    
    setLoadingState({
      isLoading: true,
      loadingType: type,
      connectionSpeed: connectionSpeedRef.current,
      estimatedLoadTime: estimatedTime
    });
  };

  const stopLoading = () => {
    const actualLoadTime = loadStartTime.current ? Date.now() - loadStartTime.current : 0;
    
    // Update connection speed estimation based on actual performance
    if (actualLoadTime > 0 && loadStartTime.current) {
      if (actualLoadTime < 500) {
        connectionSpeedRef.current = 'fast';
      } else if (actualLoadTime < 1500) {
        connectionSpeedRef.current = 'medium';
      } else {
        connectionSpeedRef.current = 'slow';
      }
    }
    
    setLoadingState({
      isLoading: false,
      loadingType: null,
      connectionSpeed: connectionSpeedRef.current,
      estimatedLoadTime: 0
    });
    
    loadStartTime.current = null;
  };

  // Auto-detection for common loading scenarios
  const detectAndStartLoading = () => {
    // Check if major components are still mounting
    const hasLoadingElements = document.querySelectorAll('[data-loading="true"]').length > 0;
    const hasPendingRequests = document.querySelectorAll('[data-fetching="true"]').length > 0;
    
    if (hasLoadingElements || hasPendingRequests) {
      startLoading('data');
    }
  };

  return {
    ...loadingState,
    startLoading,
    stopLoading,
    detectAndStartLoading
  };
}