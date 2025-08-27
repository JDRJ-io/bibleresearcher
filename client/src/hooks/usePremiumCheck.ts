import { useAuth } from '@/contexts/AuthContext';

// List of premium-only translations
const PREMIUM_TRANSLATIONS: string[] = []; // All remaining translations are now free

export function usePremiumCheck() {
  const { profile } = useAuth();
  
  const isPremium = profile?.tier === 'premium';
  
  const canAccessTranslation = (translationCode: string) => {
    // Free translations are always accessible
    if (!PREMIUM_TRANSLATIONS.includes(translationCode)) {
      return true;
    }
    
    // Premium translations require premium tier
    return isPremium;
  };
  
  const getPremiumTranslations = () => PREMIUM_TRANSLATIONS;
  
  const canAccessForum = () => isPremium;
  
  return {
    isPremium,
    canAccessTranslation,
    getPremiumTranslations,
    canAccessForum,
  };
}