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
}

export function ProphecyColumns({ prophecyData, onVerseClick }: ProphecyColumnsProps) {
  const [collapsedProphecies, setCollapsedProphecies] = useState<Set<string>>(new Set());

  // Debug logging
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

  const formatVerseReference = (ref: string) => {
    // Convert Gen.1:1 format to clickable link
    return ref.replace('.', ' ');
  };

  const truncateText = (text: string, maxLength: number = 60) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
          <span className="text-xs">Evidence</span>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 h-full">
      {/* Predictions Column */}
      <div className="border border-gray-200 dark:border-gray-700 p-1 overflow-y-auto max-h-[120px]">
        <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Predictions</div>
        <div className="space-y-2">
          {(prophecyData || []).map((prophecy) => {
            const isCollapsed = collapsedProphecies.has(prophecy.id);
            return (
              <div key={`pred-${prophecy.id}`} className="border-b border-gray-100 dark:border-gray-800 pb-1 last:border-b-0">
                {/* Prophecy Header - Clickable to collapse/expand */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between p-1 h-auto text-xs font-medium text-blue-700 dark:text-blue-300"
                  onClick={() => toggleProphecy(prophecy.id)}
                  data-id={prophecy.id}
                >
                  <span className="text-left">{prophecy.id}. {prophecy.data.summary}</span>
                  {isCollapsed ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                </Button>
                
                {/* Prophecy Content - Collapsible */}
                {!isCollapsed && (
                  <div className="mt-1 space-y-1">
                    {prophecy.data.prophecy.map((pred: string, idx: number) => (
                      <div key={idx} className="text-xs">
                        <button
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                          onClick={() => onVerseClick(formatVerseReference(pred))}
                        >
                          {formatVerseReference(pred)}
                        </button>
                        <div className="text-gray-600 dark:text-gray-400 mt-1">
                          {truncateText(`[${pred} text preview]`)}
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
      <div className="border border-gray-200 dark:border-gray-700 p-1 overflow-y-auto max-h-[120px]">
        <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Fulfillments</div>
        <div className="space-y-2">
          {(prophecyData || []).map((prophecy) => {
            const isCollapsed = collapsedProphecies.has(prophecy.id);
            return (
              <div key={`fulf-${prophecy.id}`} className="border-b border-gray-100 dark:border-gray-800 pb-1 last:border-b-0">
                {/* Prophecy Header - Synced with other columns */}
                <div
                  className="text-xs font-medium text-green-700 dark:text-green-300 p-1 cursor-pointer"
                  onClick={() => toggleProphecy(prophecy.id)}
                  data-id={prophecy.id}
                >
                  {prophecy.id}. {prophecy.data.summary}
                </div>
                
                {/* Prophecy Content - Collapsible */}
                {!isCollapsed && (
                  <div className="mt-1 space-y-1">
                    {prophecy.data.fulfillment.map((fulf: string, idx: number) => (
                      <div key={idx} className="text-xs">
                        <button
                          className="text-green-600 dark:text-green-400 hover:underline font-medium"
                          onClick={() => onVerseClick(formatVerseReference(fulf))}
                        >
                          {formatVerseReference(fulf)}
                        </button>
                        <div className="text-gray-600 dark:text-gray-400 mt-1">
                          {truncateText(`[${fulf} text preview]`)}
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

      {/* Evidence Column */}
      <div className="border border-gray-200 dark:border-gray-700 p-1 overflow-y-auto max-h-[120px]">
        <div className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Evidence</div>
        <div className="space-y-2">
          {(prophecyData || []).map((prophecy) => {
            const isCollapsed = collapsedProphecies.has(prophecy.id);
            return (
              <div key={`evid-${prophecy.id}`} className="border-b border-gray-100 dark:border-gray-800 pb-1 last:border-b-0">
                {/* Prophecy Header - Synced with other columns */}
                <div
                  className="text-xs font-medium text-purple-700 dark:text-purple-300 p-1 cursor-pointer"
                  onClick={() => toggleProphecy(prophecy.id)}
                  data-id={prophecy.id}
                >
                  {prophecy.id}. {prophecy.data.summary}
                </div>
                
                {/* Prophecy Content - Collapsible */}
                {!isCollapsed && (
                  <div className="mt-1 space-y-1">
                    {prophecy.data.verification.map((evid: string, idx: number) => (
                      <div key={idx} className="text-xs">
                        <button
                          className="text-purple-600 dark:text-purple-400 hover:underline font-medium"
                          onClick={() => onVerseClick(formatVerseReference(evid))}
                        >
                          {formatVerseReference(evid)}
                        </button>
                        <div className="text-gray-600 dark:text-gray-400 mt-1">
                          {truncateText(`[${evid} text preview]`)}
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