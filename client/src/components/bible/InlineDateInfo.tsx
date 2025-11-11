import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { loadDatesMap } from '@/data/BibleDataAPI';

interface InlineDateInfoProps {
  verseId: string;
  className?: string;
}

interface DateInfo {
  date: string;
  era: string;
  description?: string;
}

export function InlineDateInfo({ verseId, className = '' }: InlineDateInfoProps) {
  const [dateInfo, setDateInfo] = useState<DateInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDateInfo();
  }, [verseId]);

  const loadDateInfo = async () => {
    try {
      setIsLoading(true);
      
      // Load real dates from BibleDataAPI
      const datesMap = await loadDatesMap(false); // Use canonical dates
      const dateText = datesMap.get(verseId);
      
      if (dateText) {
        setDateInfo({
          date: dateText,
          era: dateText,
          description: dateText
        });
      } else {
        // Fallback to book-level sample if specific verse not found
        const sampleDate = generateSampleDate(verseId);
        setDateInfo(sampleDate);
      }
    } catch (err) {
      console.error('Failed to load date info:', err);
      // Fallback to sample data on error
      const sampleDate = generateSampleDate(verseId);
      setDateInfo(sampleDate);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleDate = (verseId: string): DateInfo => {
    const book = verseId.split('-')[0];
    const sampleDates: Record<string, DateInfo> = {
      'gen': { date: 'Before 4000 BC', era: 'Before 4000 BC', description: 'Before 4000 BC' },
      'exo': { date: 'Before 1500 BC', era: 'Before 1500 BC', description: 'Before 1500 BC' },
      'lev': { date: 'Before 1490 BC', era: 'Before 1490 BC', description: 'Before 1490 BC' },
      'num': { date: 'Before 1490 BC', era: 'Before 1490 BC', description: 'Before 1490 BC' },
      'deu': { date: 'Before 1451 BC', era: 'Before 1451 BC', description: 'Before 1451 BC' },
      'jos': { date: 'Before 1451 BC', era: 'Before 1451 BC', description: 'Before 1451 BC' },
      'jdg': { date: 'Before 1425 BC', era: 'Before 1425 BC', description: 'Before 1425 BC' },
      'rut': { date: 'Before 1322 BC', era: 'Before 1322 BC', description: 'Before 1322 BC' },
      'sa1': { date: 'Before 1171 BC', era: 'Before 1171 BC', description: 'Before 1171 BC' },
      'sa2': { date: 'Before 1056 BC', era: 'Before 1056 BC', description: 'Before 1056 BC' },
      'kg1': { date: 'Before 1015 BC', era: 'Before 1015 BC', description: 'Before 1015 BC' },
      'kg2': { date: 'Before 975 BC', era: 'Before 975 BC', description: 'Before 975 BC' },
      'ch1': { date: 'Before 1056 BC', era: 'Before 1056 BC', description: 'Before 1056 BC' },
      'ch2': { date: 'Before 1015 BC', era: 'Before 1015 BC', description: 'Before 1015 BC' },
      'ezr': { date: 'Before 536 BC', era: 'Before 536 BC', description: 'Before 536 BC' },
      'neh': { date: 'Before 445 BC', era: 'Before 445 BC', description: 'Before 445 BC' },
      'est': { date: 'Before 473 BC', era: 'Before 473 BC', description: 'Before 473 BC' },
      'job': { date: 'Before 2000 BC', era: 'Before 2000 BC', description: 'Before 2000 BC' },
      'psa': { date: 'Before 1023 BC', era: 'Before 1023 BC', description: 'Before 1023 BC' },
      'pro': { date: 'Before 1000 BC', era: 'Before 1000 BC', description: 'Before 1000 BC' },
      'ecc': { date: 'Before 977 BC', era: 'Before 977 BC', description: 'Before 977 BC' },
      'son': { date: 'Before 1014 BC', era: 'Before 1014 BC', description: 'Before 1014 BC' },
      'isa': { date: 'Before 740 BC', era: 'Before 740 BC', description: 'Before 740 BC' },
      'jer': { date: 'Before 627 BC', era: 'Before 627 BC', description: 'Before 627 BC' },
      'lam': { date: 'Before 586 BC', era: 'Before 586 BC', description: 'Before 586 BC' },
      'eze': { date: 'Before 593 BC', era: 'Before 593 BC', description: 'Before 593 BC' },
      'dan': { date: 'Before 605 BC', era: 'Before 605 BC', description: 'Before 605 BC' },
      'hos': { date: 'Before 760 BC', era: 'Before 760 BC', description: 'Before 760 BC' },
      'joe': { date: 'Before 835 BC', era: 'Before 835 BC', description: 'Before 835 BC' },
      'amo': { date: 'Before 787 BC', era: 'Before 787 BC', description: 'Before 787 BC' },
      'oba': { date: 'Before 586 BC', era: 'Before 586 BC', description: 'Before 586 BC' },
      'jon': { date: 'Before 760 BC', era: 'Before 760 BC', description: 'Before 760 BC' },
      'mic': { date: 'Before 735 BC', era: 'Before 735 BC', description: 'Before 735 BC' },
      'nah': { date: 'Before 663 BC', era: 'Before 663 BC', description: 'Before 663 BC' },
      'hab': { date: 'Before 607 BC', era: 'Before 607 BC', description: 'Before 607 BC' },
      'zep': { date: 'Before 635 BC', era: 'Before 635 BC', description: 'Before 635 BC' },
      'hag': { date: 'Before 520 BC', era: 'Before 520 BC', description: 'Before 520 BC' },
      'zec': { date: 'Before 519 BC', era: 'Before 519 BC', description: 'Before 519 BC' },
      'mal': { date: 'Before 430 BC', era: 'Before 430 BC', description: 'Before 430 BC' },
      'mat': { date: '5 BC', era: '5 BC', description: '5 BC' },
      'mar': { date: '29 AD', era: '29 AD', description: '29 AD' },
      'luk': { date: '30 AD', era: '30 AD', description: '30 AD' },
      'joh': { date: '30 AD', era: '30 AD', description: '30 AD' },
      'act': { date: '33 AD', era: '33 AD', description: '33 AD' },
      'rom': { date: '57 AD', era: '57 AD', description: '57 AD' },
      'co1': { date: '55 AD', era: '55 AD', description: '55 AD' },
      'co2': { date: '56 AD', era: '56 AD', description: '56 AD' },
      'gal': { date: '49 AD', era: '49 AD', description: '49 AD' },
      'eph': { date: '61 AD', era: '61 AD', description: '61 AD' },
      'phi': { date: '61 AD', era: '61 AD', description: '61 AD' },
      'col': { date: '61 AD', era: '61 AD', description: '61 AD' },
      'th1': { date: '51 AD', era: '51 AD', description: '51 AD' },
      'th2': { date: '51 AD', era: '51 AD', description: '51 AD' },
      'ti1': { date: '63 AD', era: '63 AD', description: '63 AD' },
      'ti2': { date: '67 AD', era: '67 AD', description: '67 AD' },
      'tit': { date: '63 AD', era: '63 AD', description: '63 AD' },
      'phm': { date: '61 AD', era: '61 AD', description: '61 AD' },
      'heb': { date: '68 AD', era: '68 AD', description: '68 AD' },
      'jam': { date: '49 AD', era: '49 AD', description: '49 AD' },
      'pe1': { date: '63 AD', era: '63 AD', description: '63 AD' },
      'pe2': { date: '66 AD', era: '66 AD', description: '66 AD' },
      'jo1': { date: '90 AD', era: '90 AD', description: '90 AD' },
      'jo2': { date: '90 AD', era: '90 AD', description: '90 AD' },
      'jo3': { date: '90 AD', era: '90 AD', description: '90 AD' },
      'jud': { date: '68 AD', era: '68 AD', description: '68 AD' },
      'rev': { date: '95 AD', era: '95 AD', description: '95 AD' }
    };

    return sampleDates[book] || { 
      date: 'Unknown', 
      era: 'Unknown', 
      description: 'Date uncertain' 
    };
  };

  if (isLoading || !dateInfo) {
    return <Clock className="w-2.5 h-2.5" style={{color: 'var(--text-secondary)'}} />;
  }

  const isVertical = className?.includes('vertical-text');

  return (
    <div 
      className={`font-mono leading-tight text-center ${className}`} 
      style={{
        color: 'var(--text-secondary)',
        fontSize: 'calc(9px * 1.5)',
        wordWrap: 'break-word',
        overflowWrap: 'break-word',
        whiteSpace: isVertical ? 'normal' : 'normal',
        maxWidth: '100%'
      }}
    >
      {dateInfo.era}
    </div>
  );
}