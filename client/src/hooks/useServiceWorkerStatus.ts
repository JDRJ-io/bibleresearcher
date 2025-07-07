import { useState, useEffect } from 'react';

export function useServiceWorkerStatus() {
  const [isActivated, setIsActivated] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      // Check if SW is already registered
      navigator.serviceWorker.getRegistration()
        .then(registration => {
          if (registration) {
            setIsRegistered(true);
            if (registration.active) {
              setIsActivated(true);
            }
          }
        })
        .catch(error => {
          console.error('SW status check failed:', error);
        });

      // Listen for SW state changes
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setIsActivated(true);
      });
    }
  }, []);

  return { isActivated, isRegistered };
}