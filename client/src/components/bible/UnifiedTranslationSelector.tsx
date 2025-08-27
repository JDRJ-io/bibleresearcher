import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useTranslationMaps } from '@/store/translationSlice';
import { useEnsureTranslationLoaded } from '@/hooks/useEnsureTranslationLoaded';
import { Check, X, Bookmark } from 'lucide-react';

interface UnifiedTranslationSelectorProps {
  onUpdate?: () => void;
}

const AVAILABLE_TRANSLATIONS = ["KJV", "AMP", "ESV", "CSB", "BSB", "NLT", "NASB", "NKJV", "NIV", "NRSV", "WEB", "YLT"];

export function UnifiedTranslationSelector({ onUpdate }: UnifiedTranslationSelectorProps) {
  const { main, alternates, setMain, toggleAlternate } = useTranslationMaps();
  const ensureTranslationLoaded = useEnsureTranslationLoaded();
  const [loadingTranslations, setLoadingTranslations] = useState<Set<string>>(new Set());

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
    <div className="space-y-4">
      {/* Status Summary */}
      <div className="p-3 rounded-md bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium" style={{color: 'var(--text-primary)'}}>
            Translation Overview
          </div>
          {alternates.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllAlternates}
              className="h-6 px-2 text-xs"
            >
              <X className="w-3 h-3 mr-1" />
              Clear All
            </Button>
          )}
        </div>
        
        <div className="space-y-1 text-xs" style={{color: 'var(--text-secondary)'}}>
          <div>
            <span className="font-medium">Main:</span> 
            <span className="ml-2 font-mono text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
              {main}
            </span>
          </div>
          
          {alternates.length > 0 && (
            <div>
              <span className="font-medium">Active ({alternates.length}):</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {alternates.map(alt => (
                  <span 
                    key={alt}
                    className="font-mono text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  >
                    {alt}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className="text-xs mt-2" style={{color: 'var(--text-secondary)'}}>
            Main appears in slot 3, alternates use slots 5-16
          </div>
        </div>
      </div>

      {/* Translation Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Available Translations
          </h4>
          <div className="text-xs" style={{color: 'var(--text-secondary)'}}>
            Click radio to set main, checkbox to add/remove alternates
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {AVAILABLE_TRANSLATIONS.map(code => {
            const isMain = code === main;
            const isAlternate = alternates.includes(code);
            const isLoading = loadingTranslations.has(code);
            
            return (
              <div 
                key={code} 
                className={`
                  flex items-center space-x-2 p-2 rounded-md transition-colors
                  ${isMain ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700' : ''}
                  ${isAlternate && !isMain ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' : ''}
                  ${!isMain && !isAlternate ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''}
                `}
              >
                {/* Radio for Main Selection */}
                <div className="flex items-center">
                  <input
                    type="radio"
                    id={`main-${code}`}
                    name="main-translation"
                    checked={isMain}
                    onChange={() => !isLoading && handleMainChange(code)}
                    disabled={isLoading}
                    className="w-3 h-3 text-blue-600 focus:ring-blue-500"
                  />
                </div>
                
                {/* Checkbox for Alternate Selection */}
                <div className="flex items-center">
                  <Checkbox
                    id={`alt-${code}`}
                    checked={isAlternate}
                    onCheckedChange={(checked) => !isMain && !isLoading && handleAlternateToggle(code, checked as boolean)}
                    disabled={isMain || isLoading}
                    className="w-3 h-3"
                  />
                </div>
                
                {/* Translation Label */}
                <div className="flex-1 min-w-0">
                  <Label 
                    htmlFor={isMain ? `main-${code}` : `alt-${code}`} 
                    className={`
                      text-xs cursor-pointer truncate block
                      ${isMain ? 'font-semibold text-blue-700 dark:text-blue-300' : ''}
                      ${isAlternate && !isMain ? 'font-medium text-green-700 dark:text-green-300' : ''}
                      ${!isMain && !isAlternate ? '' : ''}
                    `}
                    style={{color: isMain || isAlternate ? undefined : 'var(--text-primary)'}}
                  >
                    {code}
                  </Label>
                </div>
                
                {/* Status Indicators */}
                <div className="flex items-center space-x-1">
                  {isLoading && (
                    <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-transparent"></div>
                  )}
                  {isMain && (
                    <Bookmark className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                  )}
                  {isAlternate && !isMain && (
                    <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                  )}
                </div>
                
                {/* Quick Promote Button for Alternates */}
                {isAlternate && !isMain && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => !isLoading && promoteToMain(code)}
                    disabled={isLoading}
                    className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                    title={`Set ${code} as main translation`}
                  >
                    <Bookmark className="w-3 h-3" />
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}