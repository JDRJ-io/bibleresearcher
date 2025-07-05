import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
}

export function ProphecyColumns({ prophecyData, onVerseClick, verses, verseReference }: ProphecyColumnsProps) {
  const [collapsedProphecies, setCollapsedProphecies] = useState<Set<string>>(new Set());

  console.log("ProphecyColumns received data:", prophecyData);

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
    const verse = verses.find(v => v.reference === reference || v.reference === reference.replace('.', ' '));
    return verse?.text?.KJV || '';
  };

  const truncateText = (text: string, maxLength: number = 80): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const formatVerseReference = (ref: string) => {
    return ref.replace('.', ' ');
  };

  const getRoleForVerse = (prophecyId: string, currentRef: string): 'P' | 'F' | 'V' | null => {
    const normalizedRef = currentRef.replace(' ', '.');
    // TODO: Implement prophecy role mapping
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
        <div className="text-xs font-semibold text-blue-800 dark:text-blue-200 mb-2 border-b border-blue-200 dark:border-blue-700 pb-1">
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
                className={`border-b border-gray-100 dark:border-gray-800 pb-1 last:border-b-0 ${
                  isHighlighted ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-200 dark:ring-blue-700 rounded-md p-1' : ''
                }`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between p-1 h-auto text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/50"
                  onClick={() => toggleProphecy(prophecy.id)}
                  data-id={prophecy.id}
                >
                  <span className="text-left break-words">{prophecy.id}. {prophecy.data.summary}</span>
                  {isCollapsed ? <ChevronDown className="h-3 w-3 flex-shrink-0 ml-1" /> : <ChevronUp className="h-3 w-3 flex-shrink-0 ml-1" />}
                </Button>
                
                {!isCollapsed && (
                  <div className="mt-1 space-y-1">
                    {prophecy.data.prophecy.map((pred: string, idx: number) => (
                      <div key={idx} className="text-xs">
                        <button
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium block"
                          onClick={() => onVerseClick(formatVerseReference(pred))}
                        >
                          {formatVerseReference(pred)}
                        </button>
                        <div className="text-gray-600 dark:text-gray-400 mt-1 break-words">
                          {truncateText(getVerseText(pred) || `[${pred}]`)}
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
        <div className="text-xs font-semibold text-green-800 dark:text-green-200 mb-2 border-b border-green-200 dark:border-green-700 pb-1">
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
                className={`border-b border-gray-100 dark:border-gray-800 pb-1 last:border-b-0 ${
                  isHighlighted ? 'bg-green-50 dark:bg-green-900/20 ring-2 ring-green-200 dark:ring-green-700 rounded-md p-1' : ''
                }`}
              >
                <div
                  className="text-xs font-medium text-green-700 dark:text-green-300 p-1 cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/50 rounded"
                  onClick={() => toggleProphecy(prophecy.id)}
                  data-id={prophecy.id}
                >
                  <span className="break-words">{prophecy.id}. {prophecy.data.summary}</span>
                </div>
                
                {!isCollapsed && (
                  <div className="mt-1 space-y-1">
                    {prophecy.data.fulfillment.map((fulf: string, idx: number) => (
                      <div key={idx} className="text-xs">
                        <button
                          className="text-green-600 dark:text-green-400 hover:underline font-medium block"
                          onClick={() => onVerseClick(formatVerseReference(fulf))}
                        >
                          {formatVerseReference(fulf)}
                        </button>
                        <div className="text-gray-600 dark:text-gray-400 mt-1 break-words">
                          {truncateText(getVerseText(fulf) || `[${fulf}]`)}
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
        <div className="text-xs font-semibold text-purple-800 dark:text-purple-200 mb-2 border-b border-purple-200 dark:border-purple-700 pb-1">
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
                className={`border-b border-gray-100 dark:border-gray-800 pb-1 last:border-b-0 ${
                  isHighlighted ? 'bg-purple-50 dark:bg-purple-900/20 ring-2 ring-purple-200 dark:ring-purple-700 rounded-md p-1' : ''
                }`}
              >
                <div
                  className="text-xs font-medium text-purple-700 dark:text-purple-300 p-1 cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/50 rounded"
                  onClick={() => toggleProphecy(prophecy.id)}
                  data-id={prophecy.id}
                >
                  <span className="break-words">{prophecy.id}. {prophecy.data.summary}</span>
                </div>
                
                {!isCollapsed && (
                  <div className="mt-1 space-y-1">
                    {prophecy.data.verification.map((evid: string, idx: number) => (
                      <div key={idx} className="text-xs">
                        <button
                          className="text-purple-600 dark:text-purple-400 hover:underline font-medium block"
                          onClick={() => onVerseClick(formatVerseReference(evid))}
                        >
                          {formatVerseReference(evid)}
                        </button>
                        <div className="text-gray-600 dark:text-gray-400 mt-1 break-words">
                          {truncateText(getVerseText(evid) || `[${evid}]`)}
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