import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTranslationMaps } from '@/store/translationSlice';
import { useEnsureTranslationLoaded } from '@/hooks/useEnsureTranslationLoaded';
import { Check, X, Star, Plus } from 'lucide-react';

interface UnifiedTranslationSelectorProps {
  onUpdate?: () => void;
}

const AVAILABLE_TRANSLATIONS = ["KJV", "BSB", "WEB", "YLT"];

export function UnifiedTranslationSelector({ onUpdate }: UnifiedTranslationSelectorProps) {
  const { main, alternates, setMain, toggleAlternate } = useTranslationMaps();
  const ensureTranslationLoaded = useEnsureTranslationLoaded();
  const [loadingTranslations, setLoadingTranslations] = useState<Set<string>>(new Set());
  const [lastTap, setLastTap] = useState<{ code: string; time: number } | null>(null);

  const handleMainChange = async (value: string) => {
    console.log(`🔄 UnifiedTranslationSelector: Switching main translation from ${main} to ${value}`);
    setLoadingTranslations(prev => new Set(prev).add(value));
    
    try {
      // 1. Load the new translation data from Supabase
      await ensureTranslationLoaded(value);
      
      // 2. Update the translation store
      setMain(value);
      
      // 3. Trigger re-render and label cache updates
      onUpdate?.();
      
      console.log(`✅ UnifiedTranslationSelector: Successfully switched to ${value}`);
    } catch (error) {
      console.error(`❌ UnifiedTranslationSelector: Failed to switch to ${value}:`, error);
    } finally {
      setLoadingTranslations(prev => {
        const newSet = new Set(prev);
        newSet.delete(value);
        return newSet;
      });
    }
  };

  const handleAlternateToggle = async (translationId: string, checked: boolean) => {
    console.log(`🔄 Toggling alternate translation ${translationId}: ${checked}`);
    setLoadingTranslations(prev => new Set(prev).add(translationId));
    
    try {
      if (checked) {
        await ensureTranslationLoaded(translationId);
      }
      toggleAlternate(translationId);
      onUpdate?.();
      console.log(`✅ Successfully toggled alternate ${translationId}: ${checked}`);
    } catch (error) {
      console.error(`❌ Failed to toggle alternate ${translationId}:`, error);
    } finally {
      setLoadingTranslations(prev => {
        const newSet = new Set(prev);
        newSet.delete(translationId);
        return newSet;
      });
    }
  };

  const handleTap = async (code: string) => {
    const now = Date.now();
    const DOUBLE_TAP_THRESHOLD = 300; // 300ms for double tap
    
    if (lastTap && lastTap.code === code && (now - lastTap.time) < DOUBLE_TAP_THRESHOLD) {
      // Double tap - set as main
      console.log(`🖱️ Double tap detected on ${code} - setting as main`);
      setLastTap(null);
      await handleMainChange(code);
    } else {
      // Single tap - toggle alternate (with delay to check for double tap)
      setLastTap({ code, time: now });
      
      setTimeout(() => {
        setLastTap(prev => {
          // Only process single tap if no double tap occurred
          if (prev && prev.code === code && prev.time === now) {
            console.log(`🖱️ Single tap confirmed on ${code} - toggling alternate`);
            if (!loadingTranslations.has(code)) {
              handleAlternateToggle(code, !alternates.includes(code));
            }
            return null;
          }
          return prev;
        });
      }, DOUBLE_TAP_THRESHOLD);
    }
  };

  const promoteToMain = async (translationId: string) => {
    await handleMainChange(translationId);
  };

  const clearAllAlternates = () => {
    alternates.forEach(alt => {
      toggleAlternate(alt);
    });
    onUpdate?.();
  };

  return (
    <div className="space-y-1.5">
      {/* Compact Status Bar */}
      <div className="flex items-center justify-between p-1.5 rounded bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2 text-xs">
          <Star className="w-3 h-3 text-yellow-500" />
          <span className="font-mono font-medium px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
            {main}
          </span>
          {alternates.length > 0 && (
            <>
              <span className="text-gray-400">+</span>
              <span className="font-medium text-green-600 dark:text-green-400">{alternates.length}</span>
            </>
          )}
        </div>
        {alternates.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllAlternates}
            className="h-6 px-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>

      {/* Compact Translation Grid */}
      <div className="grid grid-cols-3 gap-1.5 max-h-32 overflow-y-auto">
        {AVAILABLE_TRANSLATIONS.map(code => {
          const isMain = code === main;
          const isAlternate = alternates.includes(code);
          const isLoading = loadingTranslations.has(code);
          
          return (
            <div 
              key={code} 
              className={`
                relative group flex items-center justify-center p-1.5 rounded-md transition-all duration-200 border
                ${isMain ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-blue-300 dark:border-blue-600 shadow-sm' : ''}
                ${isAlternate && !isMain ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-300 dark:border-green-600 shadow-sm' : ''}
                ${!isMain && !isAlternate ? 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
              `}
            >
              {/* Click Handler */}
              <div 
                className="absolute inset-0 cursor-pointer select-none"
                onClick={() => !isLoading && handleTap(code)}
                onContextMenu={(e) => e.preventDefault()}
              />
              
              {/* Translation Code */}
              <div className="text-center">
                <div className={`
                  text-xs font-mono font-medium transition-colors
                  ${isMain ? 'text-blue-700 dark:text-blue-300' : ''}
                  ${isAlternate && !isMain ? 'text-green-700 dark:text-green-300' : ''}
                  ${!isMain && !isAlternate ? 'text-gray-700 dark:text-gray-300' : ''}
                `}>
                  {code}
                </div>
              </div>

              {/* Status Indicator */}
              <div className="absolute -top-1 -right-1">
                {isLoading && (
                  <div className="animate-spin rounded-full h-3 w-3 border border-gray-400 border-t-transparent bg-white dark:bg-gray-800"></div>
                )}
                {isMain && !isLoading && (
                  <div className="w-3 h-3 rounded-full bg-blue-500 flex items-center justify-center">
                    <Star className="w-2 h-2 text-white" />
                  </div>
                )}
                {isAlternate && !isMain && !isLoading && (
                  <div className="w-3 h-3 rounded-full bg-green-500 flex items-center justify-center">
                    <Plus className="w-2 h-2 text-white" />
                  </div>
                )}
              </div>

              {/* Promote Button for Alternates */}
              {isAlternate && !isMain && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => !isLoading && promoteToMain(code)}
                  disabled={isLoading}
                  className="absolute -bottom-1 -right-1 h-4 w-4 p-0 rounded-full bg-blue-500 hover:bg-blue-600 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title={`Set ${code} as main translation`}
                >
                  <Star className="w-2 h-2" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Instructions */}
      <div className="text-xs text-center py-0.5" style={{color: 'var(--text-secondary)'}}>
        Single tap for alternate • Double tap to set as main
      </div>

      {/* Coming Soon Message */}
      <div className="text-center px-2 py-1.5 rounded-lg bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800/30">
        <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug">
          🕊️ More coming soon — share Anointed.io to help unlock & expand access to our favorite translations.
        </p>
      </div>
    </div>
  );
}