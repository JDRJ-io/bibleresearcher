import { ScrollArea } from '@/components/ui/scroll-area';
import { ProphecyData } from '@/types/bible';

interface ProphecyColumnsProps {
  prophecyData?: ProphecyData;
  onNavigateToVerse: (reference: string) => void;
}

export function ProphecyColumns({ prophecyData, onNavigateToVerse }: ProphecyColumnsProps) {
  if (!prophecyData) {
    return (
      <>
        <div className="border-r p-2 w-48 h-[120px] bg-gray-50 dark:bg-gray-900/50">
          <div className="text-xs font-semibold text-gray-500 mb-1">Predictions</div>
          <div className="text-xs text-gray-400">No predictions</div>
        </div>
        <div className="border-r p-2 w-48 h-[120px] bg-gray-50 dark:bg-gray-900/50">
          <div className="text-xs font-semibold text-gray-500 mb-1">Fulfillments</div>
          <div className="text-xs text-gray-400">No fulfillments</div>
        </div>
        <div className="border-r p-2 w-48 h-[120px] bg-gray-50 dark:bg-gray-900/50">
          <div className="text-xs font-semibold text-gray-500 mb-1">Verifications</div>
          <div className="text-xs text-gray-400">No verifications</div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Predictions Column */}
      <div className="border-r p-2 w-48 h-[120px]">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Predictions</div>
        <ScrollArea className="h-[100px]">
          <div className="space-y-1">
            {prophecyData.predictions?.map((prediction, idx) => (
              <button
                key={idx}
                className="block text-xs text-blue-600 dark:text-blue-400 hover:underline text-left w-full"
                onClick={() => onNavigateToVerse(prediction)}
              >
                {prediction}
              </button>
            )) || <span className="text-xs text-gray-400">No predictions</span>}
          </div>
        </ScrollArea>
      </div>

      {/* Fulfillments Column */}
      <div className="border-r p-2 w-48 h-[120px]">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Fulfillments</div>
        <ScrollArea className="h-[100px]">
          <div className="space-y-1">
            {prophecyData.fulfillments?.map((fulfillment, idx) => (
              <button
                key={idx}
                className="block text-xs text-green-600 dark:text-green-400 hover:underline text-left w-full"
                onClick={() => onNavigateToVerse(fulfillment)}
              >
                {fulfillment}
              </button>
            )) || <span className="text-xs text-gray-400">No fulfillments</span>}
          </div>
        </ScrollArea>
      </div>

      {/* Verifications Column */}
      <div className="border-r p-2 w-48 h-[120px]">
        <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Verifications</div>
        <ScrollArea className="h-[100px]">
          <div className="space-y-1">
            {prophecyData.verifications?.map((verification, idx) => (
              <button
                key={idx}
                className="block text-xs text-purple-600 dark:text-purple-400 hover:underline text-left w-full"
                onClick={() => onNavigateToVerse(verification)}
              >
                {verification}
              </button>
            )) || <span className="text-xs text-gray-400">No verifications</span>}
          </div>
        </ScrollArea>
      </div>
    </>
  );
}