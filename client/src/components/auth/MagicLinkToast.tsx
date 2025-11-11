import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export function MagicLinkToast() {
  const { toast } = useToast();

  useEffect(() => {
    const handleMagicLinkSuccess = () => {
      toast({
        title: "✅ You're in!",
        description: "Successfully signed in via magic link.",
        duration: 4000,
      });
    };

    // Listen for magic link success event
    window.addEventListener('magic-link-success', handleMagicLinkSuccess);

    return () => {
      window.removeEventListener('magic-link-success', handleMagicLinkSuccess);
    };
  }, [toast]);

  return null; // This component doesn't render anything
}