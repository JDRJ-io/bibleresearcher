import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useBibleStore } from '@/providers/BibleDataProvider';

interface ProphecyData {
  id: string;
  role: 'P' | 'F' | 'V'; // Prediction, Fulfillment, Verification
  data: {
    summary: string;
    prophecy: string[];
    fulfillment: string[];
    verification: string[];
  };
}

interface ProphecyColumnsProps {
  prophecyData: ProphecyData[] | undefined;
  onVerseClick: (reference: string) => void;
  verses: any[];
  verseReference: string;
  getGlobalVerseText?: (reference: string) => string; // Add function prop for global verse lookup
}

export function ProphecyColumns({ prophecyData, onVerseClick, verses, verseReference, getGlobalVerseText }: ProphecyColumnsProps) {
  const [collapsedProphecies, setCollapsedProphecies] = useState<Set<string>>(new Set());
  const { store } = useBibleStore();

  console.log("ProphecyColumns received data:", prophecyData);
  
  // Render rows in <ProphecyColumns />
  const renderRows = () => {
    if (store.prophecies && store.prophecies[verseReference]) {
      const prophecyBlocks = store.prophecies[verseReference];
      return prophecyBlocks.map((block: any, index: number) => (
        <React.Fragment key={index}>
          <td className="table-cell">{block.P?.join('; ')}</td>
          <td className="table-cell">{block.F?.join('; ')}</td>
          <td className="table-cell">{block.V?.join('; ')}</td>
        </React.Fragment>
      ));
    }
    
    return (
      <React.Fragment>
        <td className="table-cell"></td>
        <td className="table-cell"></td>
        <td className="table-cell"></td>
      </React.Fragment>
    );
  };

  const toggleProphecy = (prophecyId: string) => {
    const newCollapsed = new Set(collapsedProphecies);
    if (newCollapsed.has(prophecyId)) {
      newCollapsed.delete(prophecyId);
    } else {
      newCollapsed.add(prophecyId);
    }
    setCollapsedProphecies(newCollapsed);
  };

  const getVerseText = (reference: string): string => {
    // First try to find in current loaded verses
    const verse = verses.find(v => v.reference === reference || v.reference === reference.replace('.', ' '));
    if (verse?.text?.KJV) {
      return verse.text.KJV;
    }
    
    // Use the global verse text lookup function if provided
    if (getGlobalVerseText) {
      return getGlobalVerseText(reference);
    }
    
    return '';
  };

  const truncateText = (text: string, maxLength: number = 80): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatVerseReference = (ref: string) => {
    return ref.replace('.', ' ');
  };

  const getRoleForVerse = (prophecyId: string, currentRef: string): 'P' | 'F' | 'V' | null => {
    // Check if this verse has a role for this specific prophecy
    // The prophecyData already contains the role information
    const prophecy = prophecyData?.find(p => p.id === prophecyId);
    if (!prophecy) return null;
    
    const normalizedRef = currentRef.replace(' ', '.');
    const altRef = currentRef.replace('.', ' ');
    
    // Check if current verse is in any of the prophecy arrays
    if (prophecy.data.prophecy.includes(normalizedRef) || prophecy.data.prophecy.includes(altRef)) {
      return 'P';
    }
    if (prophecy.data.fulfillment.includes(normalizedRef) || prophecy.data.fulfillment.includes(altRef)) {
      return 'F';
    }
    if (prophecy.data.verification.includes(normalizedRef) || prophecy.data.verification.includes(altRef)) {
      return 'V';
    }
    
    return null;
  };

  if (!prophecyData || prophecyData.length === 0) {
    return (
      <div className="grid grid-cols-3 gap-1 h-full">
        <div className="border border-gray-200 dark:border-gray-700 p-2 text-center text-gray-400">
          <span className="text-xs">Predictions</span>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 p-2 text-center text-gray-400">
          <span className="text-xs">Fulfillments</span>
        </div>
        <div className="border border-gray-200 dark:border-gray-700 p-2 text-center text-gray-400">
          <span className="text-xs">Verifications</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 h-full">
      {/* Predictions Column */}
      <div className="border border-gray-200 dark:border-gray-700 p-2 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">
          Predictions
        </div>
        <div className="space-y-2">
          {(prophecyData || []).map((prophecy) => {
            const isCollapsed = collapsedProphecies.has(prophecy.id);
            const roleConnection = getRoleForVerse(prophecy.id, verseReference);
            const isHighlighted = roleConnection === 'P';
            
            return (
              <div 
                key={`pred-${prophecy.id}`} 
                className={`border-b border-gray-100 dark:border-gray-800 pb-1 last:border-b-0 relative ${
                  isHighlighted ? 'bg-amber-50 dark:bg-amber-900/10 shadow-sm' : ''
                }`}
              >
                {/* Subtle visual indicator for role connection */}
                {isHighlighted && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400 dark:bg-amber-500 rounded-r-sm opacity-60"></div>
                )}
                
                <div
                  className="w-full p-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer rounded"
                  onClick={() => toggleProphecy(prophecy.id)}
                  data-id={prophecy.id}
                >
                  <span className="text-left break-words whitespace-normal leading-tight">{prophecy.id}. {prophecy.data.summary}</span>
                </div>
                
                {!isCollapsed && (
                  <div className="mt-1 space-y-1 pl-1">
                    {prophecy.data.prophecy.map((pred: string, idx: number) => (
                      <div key={idx} className="text-xs">
                        <button
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:underline font-medium block"
                          onClick={() => onVerseClick(formatVerseReference(pred))}
                        >
                          {formatVerseReference(pred)}
                        </button>
                        <div className="text-gray-500 dark:text-gray-500 mt-1 break-words text-[11px] leading-tight">
                          {truncateText(getVerseText(formatVerseReference(pred)) || `Loading ${pred}...`, 70)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Fulfillments Column */}
      <div className="border border-gray-200 dark:border-gray-700 p-2 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">
          Fulfillments
        </div>
        <div className="space-y-2">
          {(prophecyData || []).map((prophecy) => {
            const isCollapsed = collapsedProphecies.has(prophecy.id);
            const roleConnection = getRoleForVerse(prophecy.id, verseReference);
            const isHighlighted = roleConnection === 'F';
            
            return (
              <div 
                key={`fulf-${prophecy.id}`} 
                className={`border-b border-gray-100 dark:border-gray-800 pb-1 last:border-b-0 relative ${
                  isHighlighted ? 'bg-emerald-50 dark:bg-emerald-900/10 shadow-sm' : ''
                }`}
              >
                {/* Subtle visual indicator for role connection */}
                {isHighlighted && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 dark:bg-emerald-500 rounded-r-sm opacity-60"></div>
                )}
                
                <div
                  className="text-xs font-medium text-gray-700 dark:text-gray-300 p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                  onClick={() => toggleProphecy(prophecy.id)}
                  data-id={prophecy.id}
                >
                  <span className="break-words max-w-full whitespace-normal leading-tight">{prophecy.id}. {prophecy.data.summary}</span>
                </div>
                
                {!isCollapsed && (
                  <div className="mt-1 space-y-1 pl-1">
                    {prophecy.data.fulfillment.map((fulf: string, idx: number) => (
                      <div key={idx} className="text-xs">
                        <button
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:underline font-medium block"
                          onClick={() => onVerseClick(formatVerseReference(fulf))}
                        >
                          {formatVerseReference(fulf)}
                        </button>
                        <div className="text-gray-500 dark:text-gray-500 mt-1 break-words text-[11px] leading-tight">
                          {truncateText(getVerseText(formatVerseReference(fulf)) || `Loading ${fulf}...`, 70)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Verifications Column */}
      <div className="border border-gray-200 dark:border-gray-700 p-2 overflow-y-auto">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">
          Verifications
        </div>
        <div className="space-y-2">
          {(prophecyData || []).map((prophecy) => {
            const isCollapsed = collapsedProphecies.has(prophecy.id);
            const roleConnection = getRoleForVerse(prophecy.id, verseReference);
            const isHighlighted = roleConnection === 'V';
            
            return (
              <div 
                key={`evid-${prophecy.id}`} 
                className={`border-b border-gray-100 dark:border-gray-800 pb-1 last:border-b-0 relative ${
                  isHighlighted ? 'bg-violet-50 dark:bg-violet-900/10 shadow-sm' : ''
                }`}
              >
                {/* Subtle visual indicator for role connection */}
                {isHighlighted && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-violet-400 dark:bg-violet-500 rounded-r-sm opacity-60"></div>
                )}
                
                <div
                  className="text-xs font-medium text-gray-700 dark:text-gray-300 p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded"
                  onClick={() => toggleProphecy(prophecy.id)}
                  data-id={prophecy.id}
                >
                  <span className="break-words max-w-full whitespace-normal leading-tight">{prophecy.id}. {prophecy.data.summary}</span>
                </div>
                
                {!isCollapsed && (
                  <div className="mt-1 space-y-1 pl-1">
                    {prophecy.data.verification.map((evid: string, idx: number) => (
                      <div key={idx} className="text-xs">
                        <button
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:underline font-medium block"
                          onClick={() => onVerseClick(formatVerseReference(evid))}
                        >
                          {formatVerseReference(evid)}
                        </button>
                        <div className="text-gray-500 dark:text-gray-500 mt-1 break-words text-[11px] leading-tight">
                          {truncateText(getVerseText(formatVerseReference(evid)) || `Loading ${evid}...`, 70)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}