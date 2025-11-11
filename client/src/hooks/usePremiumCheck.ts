import { useAuth } from '@/contexts/AuthContext';

// List of premium-only translations
const PREMIUM_TRANSLATIONS: string[] = []; // All remaining translations are now free

export function usePremiumCheck() {
  const { profile } = useAuth();
  
  // All users are founding members with full access
  const isPremium = true;
  
  const canAccessTranslation = (translationCode: string) => {
    // All translations are accessible to all users
    return true;
  };
  
  const getPremiumTranslations = () => PREMIUM_TRANSLATIONS;
  
  const canAccessForum = () => true; // All users have forum access
  
  return {
    isPremium,
    canAccessTranslation,
    getPremiumTranslations,
    canAccessForum,
  };
}