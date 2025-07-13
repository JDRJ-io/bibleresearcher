import React from 'react';

interface ProphecyColumnsProps {
  prophecyData: any[];
  onVerseClick: (reference: string) => void;
  verses: any[];
  verseReference: string;
  getGlobalVerseText?: (reference: string) => string;
}

export function ProphecyColumns({
  prophecyData,
  onVerseClick,
  verses,
  verseReference,
  getGlobalVerseText
}: ProphecyColumnsProps) {
  return (
    <div className="h-[120px] p-2 text-xs">
      <div className="grid grid-cols-3 gap-2 h-full">
        {/* Predictions */}
        <div className="border-r pr-2">
          <div className="text-blue-600 font-medium mb-1">P</div>
          {/* Placeholder for prophecy predictions */}
        </div>
        
        {/* Fulfillments */}
        <div className="border-r pr-2">
          <div className="text-green-600 font-medium mb-1">F</div>
          {/* Placeholder for prophecy fulfillments */}
        </div>
        
        {/* Verification */}
        <div>
          <div className="text-purple-600 font-medium mb-1">V</div>
          {/* Placeholder for prophecy verification */}
        </div>
      </div>
    </div>
  );
}