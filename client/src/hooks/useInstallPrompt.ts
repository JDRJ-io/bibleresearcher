import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if app is already installed (standalone mode)
    if (typeof window !== 'undefined') {
      setIsStandalone(window.navigator.standalone === true || 
        window.matchMedia('(display-mode: standalone)').matches);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeinstallprompt', handler);
      
      // Add non-blocking "Add to Home Screen" instruction when navigator.standalone is false on Safari
      const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
      const isSafari = /Safari/.test(window.navigator.userAgent) && !/Chrome/.test(window.navigator.userAgent);
      
      if (isIOS && isSafari && !window.navigator.standalone) {
        console.log('iOS Safari detected - PWA install prompts don\'t appear. Show manual instruction.');
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeinstallprompt', handler);
      }
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    
    if (choiceResult.outcome === 'accepted') {
      setDeferredPrompt(null);
      setIsInstallable(false);
    }
  };

  return {
    isInstallable: isInstallable && !isStandalone,
    installApp,
    isStandalone
  };
}