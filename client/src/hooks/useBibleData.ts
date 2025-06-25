import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BibleVerse, Translation, AppPreferences } from '@/types/bible';

// Load complete Bible data from your Supabase storage
const loadBibleData = async (): Promise<BibleVerse[]> => {
  console.log('Loading Bible data from Supabase storage...');
  
  try {
    // First, let's check what buckets and files are available
    console.log('Checking available storage buckets...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
    } else {
      console.log('Available buckets:', buckets?.map(b => b.name));
    }

    // Try to list files in the storage
    const { data: files, error: filesError } = await supabase.storage
      .from('anointed')
      .list();
    
    if (filesError) {
      console.error('Error listing files in anointed bucket:', filesError);
      console.log('Attempting to access files directly...');
    } else {
      console.log('Files in anointed bucket:', files?.map(f => f.name));
    }

    // Check metadata folder for verse keys
    const { data: metadataFiles, error: metadataError } = await supabase.storage
      .from('anointed')
      .list('metadata');
    
    console.log('Files in metadata folder:', metadataFiles?.map(f => f.name));

    // Try loading verse keys from metadata folder
    let verseKeysData, verseKeysError;
    
    // Try different possible locations for verse keys
    const possiblePaths = [
      'metadata/verseKeys-canonical.json',
      'verseKeys-canonical.json',
      'metadata/verseKeys.json'
    ];
    
    for (const path of possiblePaths) {
      const result = await supabase.storage.from('anointed').download(path);
      if (!result.error) {
        verseKeysData = result.data;
        console.log(`Found verse keys at: ${path}`);
        break;
      } else {
        console.log(`Verse keys not found at: ${path}`);
      }
    }
    
    if (!verseKeysData) {
      console.error('Could not find verse keys file in any location');
      console.log('Loading from attached file structure...');
      // Use the verse keys from your attached file
      const verseKeys = await loadVerseKeysFromAttached();
      return await loadBibleWithKeys(verseKeys);
    }

    const verseKeysText = await verseKeysData.text();
    const verseKeys: string[] = JSON.parse(verseKeysText);
    console.log(`Successfully loaded ${verseKeys.length} verse keys from Supabase`);

    // Load KJV translation from Supabase storage
    const { data: kjvData, error: kjvError } = await supabase.storage
      .from('anointed')
      .download('translations/kjv/KJV.txt');
    
    if (kjvError) {
      console.error('Error loading KJV from translations/kjv/KJV.txt:', kjvError);
      // Try alternative path
      const { data: kjvData2, error: kjvError2 } = await supabase.storage
        .from('anointed')
        .download('translations/KJV.txt');
      
      if (kjvError2) {
        console.error('Error loading KJV from translations/KJV.txt:', kjvError2);
        return generateFallbackVerses();
      }
      
      const kjvTextData = await kjvData2.text();
      console.log('KJV loaded from translations/KJV.txt');
      console.log('Sample KJV content:', kjvTextData.substring(0, 200));
      const verses = parseActualSupabaseKJV(kjvTextData, verseKeys);
      return finalizeBibleData(verses);
    }

    const kjvTextData = await kjvData.text();
    console.log('KJV loaded from translations/kjv/KJV.txt');
    console.log('Sample KJV content:', kjvTextData.substring(0, 200));
    
    const verses = parseActualSupabaseKJV(kjvTextData, verseKeys);
    
    // Load cross references and Strong's data
    await loadAdditionalData(verses);
    
    console.log(`Successfully loaded ${verses.length} verses from your Supabase files`);
    
    if (verses.length === 0) {
      console.warn('No verses loaded, using fallback data');
      return generateFallbackVerses();
    }
    
    console.log('Returning verses from loadBibleData:', verses.length);
    console.log('First 3 verses with text:', verses.slice(0, 3));
    return verses;
  } catch (error) {
    console.error('Error loading Bible data:', error);
    return generateFallbackVerses();
  }
};

const loadAdditionalData = async (verses: BibleVerse[]): Promise<void> => {
    // Load cross references from Supabase
    try {
      const { data: crossRefData } = await supabase.storage
        .from('anointed')
        .download('references/cf1.txt');
      
      if (crossRefData) {
        const crossRefText = await crossRefData.text();
        parseAndMergeCrossReferences(verses, crossRefText);
        console.log('Cross references loaded from Supabase');
      }
    } catch (err) {
      console.warn('Could not load cross references');
    }

    // Load prophecy data from Supabase
    try {
      const { data: prophecyData } = await supabase.storage
        .from('anointed')
        .download('references/prophecy-file.txt');
      
      if (prophecyData) {
        const prophecyText = await prophecyData.text();
        parseAndMergeProphecyData(verses, prophecyText);
        console.log('Prophecy data loaded from Supabase');
      }
    } catch (err) {
      console.warn('Could not load prophecy data:', err);
    }
};

const parseActualSupabaseKJV = (content: string, verseKeys: string[]): BibleVerse[] => {
  console.log(`Parsing actual KJV content with ${verseKeys.length} verse keys`);
  
  const verses: BibleVerse[] = [];
  const lines = content.split('\n').filter(line => line.trim());
  
  console.log(`Processing ${lines.length} lines from KJV file`);
  console.log('First 10 lines:', lines.slice(0, 10));
  
  // Create a map for quick text lookup
  const textMap = new Map<string, string>();
  
  lines.forEach((line, index) => {
    // Pattern: "Gen.1:1 #In the beginning God created the heaven and the earth."
    // Handle both formats: with space before # and without space
    const match = line.match(/^([^#]+)\s*#(.+)$/);
    if (match) {
      const [, reference, text] = match;
      const cleanRef = reference.trim();
      const cleanText = text.trim().replace(/\r/g, ''); // Remove carriage returns
      textMap.set(cleanRef, cleanText);
      
      if (index < 5) {
        console.log(`Parsed line ${index + 1}: ${cleanRef} -> ${cleanText.substring(0, 80)}...`);
      }
    }
  });

  console.log(`Created text map with ${textMap.size} entries from KJV file`);
  
  // Now create verses using the verse keys and matching text
  let versesWithText = 0;
  verseKeys.forEach((key, index) => {
    const match = key.match(/^(\w+)\.(\d+):(\d+)$/);
    if (match) {
      const [, book, chapter, verse] = match;
      const reference = `${book} ${chapter}:${verse}`;
      const verseText = textMap.get(key); // Use exact key match
      
      if (verseText) {
        verses.push({
          id: `${book.toLowerCase()}-${chapter}-${verse}`,
          book: book,
          chapter: parseInt(chapter),
          verse: parseInt(verse),
          reference,
          text: { KJV: verseText },
          crossReferences: [],
          strongsWords: [],
          labels: [],
          contextGroup: undefined
        });
        versesWithText++;
        
        if (index < 5) {
          console.log(`Created verse ${index + 1}: ${reference} -> ${verseText.substring(0, 80)}...`);
        }
      }
    }
  });
  
  console.log(`Generated ${verses.length} verses with actual KJV text from your Supabase files`);
  return verses;
};

const generateFallbackVerses = (): BibleVerse[] => {
  console.log('Generating fallback Bible verses...');
  const verses: BibleVerse[] = [];
  
  // Generate a comprehensive set of Bible verses for fallback
  const books = [
    { name: 'Gen', fullName: 'Genesis', chapters: 50 },
    { name: 'Exo', fullName: 'Exodus', chapters: 40 },
    { name: 'Mat', fullName: 'Matthew', chapters: 28 },
    { name: 'Joh', fullName: 'John', chapters: 21 },
    { name: 'Rom', fullName: 'Romans', chapters: 16 },
    { name: 'Rev', fullName: 'Revelation', chapters: 22 }
  ];

  const sampleTexts: Record<string, string> = {
    'Gen 1:1': 'In the beginning God created the heaven and the earth.',
    'Gen 1:2': 'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.',
    'Gen 1:3': 'And God said, Let there be light: and there was light.',
    'Mat 1:1': 'The book of the generation of Jesus Christ, the son of David, the son of Abraham.',
    'Joh 1:1': 'In the beginning was the Word, and the Word was with God, and the Word was God.',
    'Joh 3:16': 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
    'Rom 1:1': 'Paul, a servant of Jesus Christ, called to be an apostle, separated unto the gospel of God.',
    'Rev 1:1': 'The Revelation of Jesus Christ, which God gave unto him, to shew unto his servants things which must shortly come to pass.'
  };

  books.forEach(book => {
    for (let chapter = 1; chapter <= Math.min(book.chapters, 5); chapter++) {
      for (let verse = 1; verse <= 25; verse++) {
        const reference = `${book.name} ${chapter}:${verse}`;
        const verseText = sampleTexts[reference] || `${book.fullName} ${chapter}:${verse} - [Verse text from your files will appear here]`;
        
        verses.push({
          id: `${book.name.toLowerCase()}-${chapter}-${verse}`,
          book: book.name,
          chapter,
          verse,
          reference,
          text: { KJV: verseText },
          crossReferences: [],
          strongsWords: [],
          labels: [],
          contextGroup: undefined
        });
      }
    }
  });

  addSampleCrossReferences(verses);
  console.log(`Generated ${verses.length} fallback verses`);
  return verses;
};

const parseTranslationFileWithKeys = (text: string, translation: string, verseKeys: string[]): BibleVerse[] => {
  const verses: BibleVerse[] = [];
  const lines = text.split('\n').filter(line => line.trim());
  
  // Create a map for quick lookup from available text
  const textMap = new Map<string, string>();
  lines.forEach((line) => {
    // Parse format: "Gen.1:1 #In the beginning God created..."
    const match = line.match(/^([^#]+)#(.+)$/);
    if (match) {
      const [, reference, verseText] = match;
      textMap.set(reference.trim(), verseText.trim());
    }
  });

  // Create all verses from verse keys, with available text or placeholder
  verseKeys.forEach((key) => {
    // Parse key format: "Gen.1:1"
    const match = key.match(/^(\w+)\.(\d+):(\d+)$/);
    if (match) {
      const [, book, chapter, verse] = match;
      const reference = `${book} ${chapter}:${verse}`;
      const verseText = textMap.get(key) || `[${reference} - Text not available in demo]`;
      
      verses.push({
        id: `${book.toLowerCase()}-${chapter}-${verse}`,
        book: book,
        chapter: parseInt(chapter),
        verse: parseInt(verse),
        reference,
        text: { [translation]: verseText },
        crossReferences: [],
        strongsWords: [],
        labels: [],
        contextGroup: undefined
      });
    }
  });
  
  return verses;
};

const mergeTranslationWithKeys = (verses: BibleVerse[], text: string, translation: string) => {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Create a map for quick lookup
  const textMap = new Map<string, string>();
  lines.forEach((line) => {
    const match = line.match(/^([^#]+)#(.+)$/);
    if (match) {
      const [, reference, verseText] = match;
      textMap.set(reference.trim(), verseText.trim());
    }
  });

  // Merge text into existing verses
  verses.forEach(verse => {
    const key = `${verse.book}.${verse.chapter}:${verse.verse}`;
    const verseText = textMap.get(key);
    if (verseText) {
      verse.text[translation] = verseText;
    }
  });
};

const mergeCrossReferences = (verses: BibleVerse[], crossRefText: string) => {
  const lines = crossRefText.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    // Parse cross reference format from your files
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const [reference, crossRefs] = parts;
      const verse = verses.find(v => v.reference.replace(/\s/g, '') === reference.replace(/\s/g, ''));
      if (verse) {
        if (!verse.crossReferences) verse.crossReferences = [];
        
        // Parse multiple cross references separated by semicolons
        const refs = crossRefs.split(';').map(ref => ref.trim()).filter(ref => ref);
        refs.forEach(ref => {
          verse.crossReferences!.push({
            reference: ref,
            text: `Cross reference to ${ref}`
          });
        });
      }
    }
  });
};

const mergeStrongsData = (verses: BibleVerse[], strongsText: string) => {
  const lines = strongsText.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    // Parse Strong's format from your files
    const parts = line.split('\t');
    if (parts.length >= 4) {
      const [reference, original, strongs, definition] = parts;
      const verse = verses.find(v => v.reference.replace(/\s/g, '') === reference.replace(/\s/g, ''));
      if (verse) {
        if (!verse.strongsWords) verse.strongsWords = [];
        verse.strongsWords.push({
          original: original.trim(),
          strongs: strongs.trim(),
          transliteration: '', // Would need transliteration file
          definition: definition.trim(),
          instances: [reference]
        });
      }
    }
  });
};

const mergeProphecyData = (verses: BibleVerse[], prophecyText: string) => {
  const lines = prophecyText.split('\n').filter(line => line.trim());
  
  lines.forEach(line => {
    // Parse prophecy format from your files
    const parts = line.split('\t');
    if (parts.length >= 4) {
      const [reference, type, content, verification] = parts;
      const verse = verses.find(v => v.reference.replace(/\s/g, '') === reference.replace(/\s/g, ''));
      if (verse) {
        if (!verse.prophecy) {
          verse.prophecy = {
            predictions: [],
            fulfillments: [],
            verifications: []
          };
        }
        
        if (type.toLowerCase() === 'prediction') {
          verse.prophecy.predictions?.push(content.trim());
        } else if (type.toLowerCase() === 'fulfillment') {
          verse.prophecy.fulfillments?.push(content.trim());
        } else if (type.toLowerCase() === 'verification') {
          verse.prophecy.verifications?.push(verification.trim());
        }
      }
    }
  });
};

const addSampleCrossReferences = (verses: BibleVerse[]) => {
  const crossRefMap: Record<string, string[]> = {
    'Gen 1:1': ['Joh 1:1', 'Heb 11:3', 'Rev 4:11'],
    'Gen 1:2': ['Gen 1:26', 'Psa 104:30'],
    'Gen 1:3': ['2Co 4:6', 'Psa 33:9'],
    'Joh 3:16': ['Rom 5:8', '1Jo 4:9', 'Joh 1:14'],
    'Joh 1:1': ['Gen 1:1', 'Rev 19:13', '1Jo 1:1'],
    'Mat 1:1': ['Luk 3:23', 'Rom 1:3', 'Gal 3:16']
  };

  verses.forEach(verse => {
    const refs = crossRefMap[verse.reference];
    if (refs) {
      verse.crossReferences = refs.map(ref => ({
        reference: ref,
        text: `Cross reference to ${ref}`
      }));
    }
  });
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

  const { data: verses = [], isLoading, error } = useQuery({
    queryKey: ['/api/bible/verses'],
    queryFn: loadBibleData,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  console.log('useBibleData hook:', { 
    versesCount: verses.length, 
    isLoading, 
    error,
    firstVerse: verses[0] 
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
    return verse.text.KJV?.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
    data: verses, // Return all verses - BiblePage expects 'data' property
    isLoading,
    translations,
    searchQuery,
    setSearchQuery,
    currentVerseIndex,
    setCurrentVerseIndex,
    expandedVerse,
    expandVerse,
    closeExpandedVerse: () => setExpandedVerse(null),
    goToVerse,
    goBack,
    goForward,
    canGoBack: currentVerseIndex > 0,
    canGoForward: currentVerseIndex < verses.length - 1,
  };
}
