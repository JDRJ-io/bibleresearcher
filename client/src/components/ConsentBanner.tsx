import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { enableAnalytics } from '@/lib/analytics';
import { X, Cookie, Shield } from 'lucide-react';

interface ConsentPreferences {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
}

const CONSENT_KEY = 'anointed-consent-preferences';
const CONSENT_VERSION = '1.0';

export function ConsentBanner() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    essential: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version === CONSENT_VERSION) {
          setPreferences(parsed.preferences);
          
          // Enable analytics if previously consented
          if (parsed.preferences.analytics) {
            enableAnalytics();
          }
          return;
        }
      } catch (e) {
        console.error('[Consent] Failed to parse stored preferences', e);
      }
    }
    
    // Show banner if no valid consent found
    setShowBanner(true);
  }, []);

  const savePreferences = (prefs: ConsentPreferences) => {
    const data = {
      version: CONSENT_VERSION,
      preferences: prefs,
      timestamp: new Date().toISOString(),
    };
    
    localStorage.setItem(CONSENT_KEY, JSON.stringify(data));
    setPreferences(prefs);
    setShowBanner(false);
    
    // Enable analytics if consented
    if (prefs.analytics) {
      enableAnalytics();
    }
  };

  const acceptAll = () => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: false, // We don't have marketing tracking yet
    });
  };

  const acceptEssentialOnly = () => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false,
    });
  };

  const saveCustomPreferences = () => {
    savePreferences(preferences);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-gradient-to-t from-black/50 to-transparent backdrop-blur-sm" data-testid="consent-banner">
      <Card className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-900 border-2 shadow-2xl">
        <div className="flex items-start gap-4">
          <Cookie className="w-6 h-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Your Privacy Matters
            </h3>
            
            {!showSettings ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  We use cookies to provide essential features and optional analytics to improve your experience. 
                  Your data is never sold or shared with third parties.
                </p>
                
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={acceptAll}
                    className="bg-purple-600 hover:bg-purple-700"
                    data-testid="consent-accept-all"
                  >
                    Accept All
                  </Button>
                  
                  <Button 
                    onClick={acceptEssentialOnly}
                    variant="outline"
                    data-testid="consent-essential-only"
                  >
                    Essential Only
                  </Button>
                  
                  <Button 
                    onClick={() => setShowSettings(true)}
                    variant="ghost"
                    data-testid="consent-customize"
                  >
                    Customize
                  </Button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                  Choose which cookies you want to allow:
                </p>
                
                <div className="space-y-4 mb-4">
                  {/* Essential Cookies */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-green-600" />
                        <Label className="font-medium cursor-default">Essential Cookies</Label>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Required for authentication, security, and basic site functionality
                      </p>
                    </div>
                    <Switch 
                      checked={true} 
                      disabled 
                      className="opacity-50"
                      data-testid="consent-essential-switch"
                    />
                  </div>
                  
                  {/* Analytics Cookies */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="flex-1">
                      <Label htmlFor="analytics-toggle" className="font-medium cursor-pointer">
                        Analytics Cookies
                      </Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Help us understand how you use the site to improve your experience (Plausible - privacy-friendly)
                      </p>
                    </div>
                    <Switch 
                      id="analytics-toggle"
                      checked={preferences.analytics}
                      onCheckedChange={(checked) => setPreferences({ ...preferences, analytics: checked })}
                      data-testid="consent-analytics-switch"
                    />
                  </div>
                  
                  {/* Marketing Cookies - Disabled for now */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg opacity-50">
                    <div className="flex-1">
                      <Label className="font-medium cursor-default">Marketing Cookies</Label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Not currently used
                      </p>
                    </div>
                    <Switch 
                      checked={false} 
                      disabled
                      data-testid="consent-marketing-switch"
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    onClick={saveCustomPreferences}
                    className="bg-purple-600 hover:bg-purple-700"
                    data-testid="consent-save-preferences"
                  >
                    Save Preferences
                  </Button>
                  
                  <Button 
                    onClick={() => setShowSettings(false)}
                    variant="ghost"
                    data-testid="consent-back"
                  >
                    Back
                  </Button>
                </div>
              </>
            )}
          </div>
          
          <button
            onClick={acceptEssentialOnly}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close and accept essential only"
            data-testid="consent-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </Card>
    </div>
  );
}

/**
 * Hook to check if analytics consent has been granted
 */
export function useAnalyticsConsent(): boolean {
  const [hasConsent, setHasConsent] = useState(false);
  
  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setHasConsent(parsed.preferences?.analytics === true);
      } catch (e) {
        setHasConsent(false);
      }
    }
  }, []);
  
  return hasConsent;
}
