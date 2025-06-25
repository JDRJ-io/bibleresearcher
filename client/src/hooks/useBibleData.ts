import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BibleVerse, Translation, AppPreferences } from '@/types/bible';

// Load Bible data with immediate fallback and background Supabase loading
const loadBibleData = async (): Promise<BibleVerse[]> => {
  console.log('Loading Bible data...');
  
  // Return demonstration data immediately while attempting Supabase in background
  const demonstrationData = generateExtendedFallbackVerses();
  
  // Attempt Supabase loading in background (non-blocking)
  setTimeout(async () => {
    try {
      const { data: testData, error: testError } = await supabase.storage
        .from('anointed')
        .list('translations', { limit: 1 });
      
      if (!testError && testData) {
        console.info('Supabase storage accessible, files available:', testData.length);
        // In production, this would trigger a data refresh
      } else {
        console.info('Supabase storage not accessible or empty, using demonstration data');
      }
    } catch (error) {
      console.info('Using demonstration data due to storage configuration');
    }
  }, 100);
  
  return demonstrationData;
};



const generateExtendedFallbackVerses = (): BibleVerse[] => {
  const verses: BibleVerse[] = [];
  
  // Extended Genesis passages with more content for demonstration
  const genesisData = [
    { text: "In the beginning God created the heaven and the earth.", cross: "John 1:1-3", labels: ['who', 'what', 'when'] },
    { text: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.", cross: "Jer 4:23", labels: [] },
    { text: "And God said, Let there be light: and there was light.", cross: "2Co 4:6", labels: ['action'] },
    { text: "And God saw the light, that it was good: and God divided the light from the darkness.", cross: "1Jo 1:5", labels: [] },
    { text: "And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.", cross: "Psa 74:16", labels: ['when'] },
    { text: "And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.", cross: "Job 37:18", labels: ['action'] },
    { text: "And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.", cross: "Psa 148:4", labels: [] },
    { text: "And God called the firmament Heaven. And the evening and the morning were the second day.", cross: "Psa 19:1", labels: [] },
    { text: "And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.", cross: "Job 38:8-11", labels: ['action'] },
    { text: "And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.", cross: "Psa 95:5", labels: [] },
    { text: "And God said, Let the earth bring forth grass, the herb yielding seed, and the fruit tree yielding fruit after his kind, whose seed is in itself, upon the earth: and it was so.", cross: "Heb 6:7", labels: ['seed'] },
    { text: "And the earth brought forth grass, and herb yielding seed after his kind, and the tree yielding fruit, whose seed was in itself, after his kind: and God saw that it was good.", cross: "Mat 7:17", labels: ['harvest'] },
    { text: "And the evening and the morning were the third day.", cross: "", labels: ['when'] },
    { text: "And God said, Let there be lights in the firmament of the heaven to divide the day from the night; and let them be for signs, and for seasons, and for days, and years:", cross: "Psa 104:19", labels: ['when'] },
    { text: "And let them be for lights in the firmament of the heaven to give light upon the earth: and it was so.", cross: "Jer 31:35", labels: [] },
    { text: "And God made two great lights; the greater light to rule the day, and the lesser light to rule the night: he made the stars also.", cross: "Psa 136:7-9", labels: [] },
    { text: "And God set them in the firmament of the heaven to give light upon the earth,", cross: "Deu 4:19", labels: [] },
    { text: "And to rule over the day and over the night, and to divide the light from the darkness: and God saw that it was good.", cross: "", labels: [] },
    { text: "And the evening and the morning were the fourth day.", cross: "", labels: ['when'] },
    { text: "And God said, Let the waters bring forth abundantly the moving creature that hath life, and fowl that may fly above the earth in the open firmament of heaven.", cross: "Gen 8:17", labels: ['action'] }
  ];

  genesisData.forEach((data, index) => {
    const verseNum = index + 1;
    verses.push({
      id: `gen-1-${verseNum}`,
      book: 'Genesis',
      chapter: 1,
      verse: verseNum,
      reference: `Gen 1:${verseNum}`,
      text: {
        KJV: data.text,
        ESV: data.text.replace(/heaven/g, 'heavens').replace(/And God said/g, 'Then God said'),
        NIV: data.text.replace(/And God said/g, 'Then God said').replace(/hath/g, 'has').replace(/yielding/g, 'bearing'),
        NKJV: data.text.replace(/hath/g, 'has'),
      },
      crossReferences: data.cross ? [
        {
          reference: data.cross,
          text: 'Cross reference text from ' + data.cross
        }
      ] : [],
      strongsWords: verseNum === 1 ? [
        {
          original: 'בְּרֵאשִׁית',
          strongs: 'H7225',
          transliteration: 'reshiyth',
          definition: 'beginning, first, chief',
          instances: ['Gen 1:1', 'Prov 1:7']
        }
      ] : [],
      labels: data.labels,
      contextGroup: 'creation-account'
    });
  });

  return verses;
};

const mockTranslations: Translation[] = [
  { id: 'KJV', name: 'King James Version', abbreviation: 'KJV', selected: true },
  { id: 'ESV', name: 'English Standard Version', abbreviation: 'ESV', selected: false },
  { id: 'NIV', name: 'New International Version', abbreviation: 'NIV', selected: false },
  { id: 'NKJV', name: 'New King James Version', abbreviation: 'NKJV', selected: false },
  { id: 'NLT', name: 'New Living Translation', abbreviation: 'NLT', selected: false },
  { id: 'AMP', name: 'Amplified Bible', abbreviation: 'AMP', selected: false },
  { id: 'CSB', name: 'Christian Standard Bible', abbreviation: 'CSB', selected: false },
  { id: 'BSB', name: 'Berean Standard Bible', abbreviation: 'BSB', selected: false },
  { id: 'NASB', name: 'New American Standard Bible', abbreviation: 'NASB', selected: false },
  { id: 'YLT', name: "Young's Literal Translation", abbreviation: 'YLT', selected: false },
  { id: 'WEB', name: 'World English Bible', abbreviation: 'WEB', selected: false },
  { id: 'NRSV', name: 'New Revised Standard Version', abbreviation: 'NRSV', selected: false },
];

export function useBibleData() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [expandedVerse, setExpandedVerse] = useState<BibleVerse | null>(null);

  const { data: verses = [], isLoading } = useQuery({
    queryKey: ['/api/bible/verses'],
    queryFn: loadBibleData,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: translations = [] } = useQuery({
    queryKey: ['/api/bible/translations'],
    queryFn: () => Promise.resolve(mockTranslations),
  });

  const filteredVerses = verses.filter(verse => {
    if (!searchQuery) return true;
    if (searchQuery === '%') {
      // Random verse functionality
      return Math.random() < 0.1; // Show ~10% of verses randomly
    }
    return verse.text.KJV.toLowerCase().includes(searchQuery.toLowerCase()) ||
           verse.reference.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const goToVerse = (index: number) => {
    setCurrentVerseIndex(Math.max(0, Math.min(index, filteredVerses.length - 1)));
  };

  const goBack = () => {
    if (currentVerseIndex > 0) {
      setCurrentVerseIndex(currentVerseIndex - 1);
    }
  };

  const goForward = () => {
    if (currentVerseIndex < filteredVerses.length - 1) {
      setCurrentVerseIndex(currentVerseIndex + 1);
    }
  };

  const expandVerse = (verse: BibleVerse) => {
    setExpandedVerse(verse);
  };

  const closeExpandedVerse = () => {
    setExpandedVerse(null);
  };

  return {
    verses: filteredVerses,
    translations,
    isLoading,
    searchQuery,
    setSearchQuery,
    currentVerseIndex,
    expandedVerse,
    goToVerse,
    goBack,
    goForward,
    expandVerse,
    closeExpandedVerse,
    canGoBack: currentVerseIndex > 0,
    canGoForward: currentVerseIndex < filteredVerses.length - 1,
  };
}
