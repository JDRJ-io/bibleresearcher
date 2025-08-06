import { segmentTextWithReferences } from '@/lib/verseReferenceParser';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface NotesTextWithLinksProps {
  text: string;
  className?: string;
  onVerseClick?: (reference: string) => void;
}

/**
 * Component that renders text with clickable hyperlinks for verse references
 * When users type references like "Gen.1:1" or "John 3:16" in their notes,
 * they become clickable links that navigate to those verses
 */
export function NotesTextWithLinks({ text, className, onVerseClick }: NotesTextWithLinksProps) {
  
  if (!text.trim()) {
    return null;
  }
  
  const segments = segmentTextWithReferences(text);
  
  const handleReferenceClick = (reference: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('📝 Notes reference clicked:', { 
      reference, 
      originalText: text,
      parsedReference: reference 
    });
    if (onVerseClick) {
      onVerseClick(reference);
    } else {
      console.warn('📝 No onVerseClick handler provided');
    }
  };
  
  return (
    <div className={`whitespace-pre-wrap ${className}`}>
      {segments.map((segment, index) => {
        if (segment.isReference && segment.parsedReference) {
          return (
            <Button
              key={index}
              variant="link"
              size="sm"
              className="p-0 h-auto font-normal text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline inline-flex items-center gap-1"
              onClick={(e) => handleReferenceClick(segment.parsedReference!, e)}
              title={`Navigate to ${segment.parsedReference}`}
            >
              {segment.text}
              <ExternalLink className="w-3 h-3" />
            </Button>
          );
        }
        
        return (
          <span key={index}>
            {segment.text}
          </span>
        );
      })}
    </div>
  );
}