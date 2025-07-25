import React, { useState, useEffect } from 'react';
import { Calendar, Clock } from 'lucide-react';
// import { getBibleDataAPI } from '@/data/BibleDataAPI'; // Will be integrated later
import { LoadingWheel } from '@/components/LoadingWheel';

interface DatesColumnProps {
  verseId: string;
  className?: string;
}

interface DateInfo {
  date: string;
  era: string;
  description?: string;
}

export function DatesColumn({ verseId, className = '' }: DatesColumnProps) {
  const [dateInfo, setDateInfo] = useState<DateInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDateInfo();
  }, [verseId]);

  const loadDateInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // This would load from BibleDataAPI - dates-canonical.txt or dates-chronological.txt
      // For now, creating sample data that matches the expected format
      const sampleDate = generateSampleDate(verseId);
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      setDateInfo(sampleDate);
    } catch (err) {
      console.error('Failed to load date info:', err);
      setError('Failed to load date');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSampleDate = (verseId: string): DateInfo => {
    // Generate sample dates based on verse for demonstration
    // In real implementation, this would come from dates-canonical.txt
    const book = verseId.split('-')[0];
    const sampleDates: Record<string, DateInfo> = {
      'gen': { date: '4004 BC', era: 'Creation', description: 'Beginning of time' },
      'exo': { date: '1491 BC', era: 'Exodus', description: 'Deliverance from Egypt' },
      'lev': { date: '1490 BC', era: 'Law', description: 'Mosaic Law given' },
      'num': { date: '1490 BC', era: 'Wilderness', description: 'Desert wandering' },
      'deu': { date: '1451 BC', era: 'Law', description: 'Law restated' },
      'jos': { date: '1451 BC', era: 'Conquest', description: 'Promised Land entered' },
      'jdg': { date: '1425 BC', era: 'Judges', description: 'Period of Judges' },
      'rut': { date: '1322 BC', era: 'Judges', description: 'Time of Ruth' },
      'sa1': { date: '1171 BC', era: 'Kingdom', description: 'Samuel & Saul' },
      'sa2': { date: '1056 BC', era: 'Kingdom', description: 'King David' },
      'kg1': { date: '1015 BC', era: 'Kingdom', description: 'Solomon\'s reign' },
      'kg2': { date: '975 BC', era: 'Divided', description: 'Divided Kingdom' },
      'ch1': { date: '1056 BC', era: 'Kingdom', description: 'David\'s lineage' },
      'ch2': { date: '1015 BC', era: 'Kingdom', description: 'Temple period' },
      'ezr': { date: '536 BC', era: 'Return', description: 'Return from exile' },
      'neh': { date: '445 BC', era: 'Restoration', description: 'Wall rebuilt' },
      'est': { date: '473 BC', era: 'Exile', description: 'Persian period' },
      'job': { date: '2000 BC', era: 'Patriarchs', description: 'Ancient wisdom' },
      'psa': { date: '1023 BC', era: 'Kingdom', description: 'David\'s psalms' },
      'pro': { date: '1000 BC', era: 'Wisdom', description: 'Solomon\'s wisdom' },
      'ecc': { date: '977 BC', era: 'Wisdom', description: 'Life\'s meaning' },
      'son': { date: '1014 BC', era: 'Wisdom', description: 'Love poetry' },
      'isa': { date: '740 BC', era: 'Prophets', description: 'Messianic prophecy' },
      'jer': { date: '627 BC', era: 'Prophets', description: 'Warning to Judah' },
      'lam': { date: '586 BC', era: 'Exile', description: 'Jerusalem\'s fall' },
      'eze': { date: '593 BC', era: 'Exile', description: 'Exile in Babylon' },
      'dan': { date: '605 BC', era: 'Exile', description: 'Babylonian court' },
      'hos': { date: '760 BC', era: 'Prophets', description: 'Israel\'s unfaithfulness' },
      'joe': { date: '835 BC', era: 'Prophets', description: 'Day of the Lord' },
      'amo': { date: '787 BC', era: 'Prophets', description: 'Social justice' },
      'oba': { date: '586 BC', era: 'Prophets', description: 'Edom\'s judgment' },
      'jon': { date: '760 BC', era: 'Prophets', description: 'Nineveh\'s repentance' },
      'mic': { date: '735 BC', era: 'Prophets', description: 'Justice & mercy' },
      'nah': { date: '663 BC', era: 'Prophets', description: 'Nineveh\'s fall' },
      'hab': { date: '607 BC', era: 'Prophets', description: 'Faith in crisis' },
      'zep': { date: '635 BC', era: 'Prophets', description: 'Coming judgment' },
      'hag': { date: '520 BC', era: 'Return', description: 'Temple rebuilding' },
      'zec': { date: '519 BC', era: 'Return', description: 'Messianic hope' },
      'mal': { date: '430 BC', era: 'Return', description: 'Final warning' },
      'mat': { date: '5 BC', era: 'Gospel', description: 'Jesus\' birth' },
      'mar': { date: '29 AD', era: 'Gospel', description: 'Jesus\' ministry' },
      'luk': { date: '30 AD', era: 'Gospel', description: 'Perfect humanity' },
      'joh': { date: '30 AD', era: 'Gospel', description: 'Divine Word' },
      'act': { date: '33 AD', era: 'Church', description: 'Church birth' },
      'rom': { date: '57 AD', era: 'Epistles', description: 'Justification' },
      'co1': { date: '55 AD', era: 'Epistles', description: 'Church problems' },
      'co2': { date: '56 AD', era: 'Epistles', description: 'Ministry defense' },
      'gal': { date: '49 AD', era: 'Epistles', description: 'Christian freedom' },
      'eph': { date: '61 AD', era: 'Prison', description: 'Church unity' },
      'phi': { date: '61 AD', era: 'Prison', description: 'Joy in Christ' },
      'col': { date: '61 AD', era: 'Prison', description: 'Christ\'s supremacy' },
      'th1': { date: '51 AD', era: 'Epistles', description: 'Second coming' },
      'th2': { date: '51 AD', era: 'Epistles', description: 'End times' },
      'ti1': { date: '63 AD', era: 'Pastoral', description: 'Church leadership' },
      'ti2': { date: '67 AD', era: 'Pastoral', description: 'Final charge' },
      'tit': { date: '63 AD', era: 'Pastoral', description: 'Church order' },
      'phm': { date: '61 AD', era: 'Prison', description: 'Forgiveness' },
      'heb': { date: '68 AD', era: 'General', description: 'Christ\'s priesthood' },
      'jam': { date: '49 AD', era: 'General', description: 'Faith & works' },
      'pe1': { date: '63 AD', era: 'General', description: 'Suffering hope' },
      'pe2': { date: '66 AD', era: 'General', description: 'False teachers' },
      'jo1': { date: '90 AD', era: 'Johannine', description: 'God is love' },
      'jo2': { date: '90 AD', era: 'Johannine', description: 'Walk in truth' },
      'jo3': { date: '90 AD', era: 'Johannine', description: 'Hospitality' },
      'jud': { date: '68 AD', era: 'General', description: 'Contend for faith' },
      'rev': { date: '95 AD', era: 'Prophetic', description: 'Final victory' }
    };

    return sampleDates[book] || { 
      date: 'Unknown', 
      era: 'Biblical', 
      description: 'Date uncertain' 
    };
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${className}`}>
        <LoadingWheel size="small" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full text-red-500 ${className}`}>
        <Clock className="w-3 h-3" />
      </div>
    );
  }

  if (!dateInfo) {
    return (
      <div className={`flex items-center justify-center h-full text-gray-400 ${className}`}>
        <span className="text-xs">—</span>
      </div>
    );
  }

  return (
    <div className={`flex flex-col justify-center h-full text-xs ${className}`}>
      <div className="text-blue-600 dark:text-blue-400">
        <span className="font-mono block">{dateInfo.date}</span>
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5">
        {dateInfo.era}
      </div>
    </div>
  );
}