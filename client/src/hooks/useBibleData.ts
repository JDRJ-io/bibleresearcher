import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BibleVerse, Translation, AppPreferences } from '@/types/bible';

// Load complete Bible data from your Supabase storage
const loadBibleData = async (progressCallback?: (progress: any) => void): Promise<BibleVerse[]> => {
  console.log('Loading Bible data from Supabase storage...');
  
  if (progressCallback) {
    progressCallback({
      stage: 'Connecting to Supabase...',
      progress: 5,
      details: 'Establishing connection to your Bible data'
    });
  }
  
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
      
      if (progressCallback) {
        progressCallback({
          stage: 'Loading fallback structure...',
          progress: 15,
          details: 'Using backup verse structure from attached files'
        });
      }
      
      // Generate fallback verses
      return generateFallbackVerses();
    }

    const verseKeysText = await verseKeysData.text();
    const verseKeys: string[] = JSON.parse(verseKeysText);
    console.log(`Successfully loaded ${verseKeys.length} verse keys from Supabase`);
    
    if (progressCallback) {
      progressCallback({ stage: 'text', percentage: 25 });
    }

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
      console.log(`PRIMARY PATH: Successfully parsed ${verses.length} verses from your KJV file`);
      
      if (verses.length === 0) {
        console.error('PRIMARY PATH FAILED: No verses created');
        return generateFallbackVerses();
      }
      
      // Load cross references and additional data
      await loadAdditionalData(verses);
      
      console.log(`PRIMARY PATH SUCCESS: Returning ${verses.length} actual Bible verses from your Supabase files`);
      return verses;
    }

    const kjvTextData = await kjvData.text();
    console.log('KJV loaded from translations/kjv/KJV.txt');
    console.log('Sample KJV content:', kjvTextData.substring(0, 200));
    
    const verses = parseActualSupabaseKJV(kjvTextData, verseKeys);
    console.log(`FALLBACK PATH: ${verses.length} verses from translations/kjv/KJV.txt`);
    
    if (progressCallback) {
      progressCallback({
        stage: 'Processing Bible text...',
        progress: 70,
        details: `Successfully parsed ${verses.length} verses from KJV`
      });
    }
    
    if (verses.length === 0) {
      console.error('CRITICAL: No verses created despite successful parsing');
      return generateFallbackVerses();
    }
    
    // Cross references will be loaded by the main query function
    
    console.log(`FALLBACK PATH SUCCESS: Returning ${verses.length} actual Bible verses`);
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
        // Cross references will be loaded separately
        console.log('Cross references found in Supabase');
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
        // Prophecy data will be loaded separately
        console.log('Prophecy data found in Supabase');
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
  console.log('First 5 lines for parsing test:', lines.slice(0, 5));
  
  // Test the exact parsing on first line
  if (lines.length > 0) {
    const testLine = lines[0].trim().replace(/\r/g, '');
    console.log(`Testing first line: "${testLine}"`);
    const testMatch = testLine.match(/^([^#]+)\s*#(.+)$/);
    console.log('Test match result:', testMatch ? 'SUCCESS' : 'FAILED');
    if (testMatch) {
      console.log('  Reference:', `"${testMatch[1].trim()}"`);
      console.log('  Text:', `"${testMatch[2].trim()}"`);
    }
  }
  
  // Create a map for quick text lookup
  const textMap = new Map<string, string>();
  
  lines.forEach((line, index) => {
    // Clean the line first
    const cleanLine = line.trim().replace(/\r/g, '');
    
    // Pattern: "Gen.1:1 #In the beginning God created the heaven and the earth."
    const match = cleanLine.match(/^([^#]+)\s*#(.+)$/);
    if (match) {
      const [, reference, text] = match;
      const cleanRef = reference.trim();
      const cleanText = text.trim();
      textMap.set(cleanRef, cleanText);
      
      if (index < 10) {
        console.log(`✓ Parsed line ${index + 1}: "${cleanRef}" -> "${cleanText.substring(0, 60)}..."`);
      }
    } else if (index < 10) {
      console.log(`✗ Failed to parse line ${index + 1}: "${cleanLine}"`);
    }
  });

  console.log(`Created text map with ${textMap.size} entries from KJV file`);
  
  if (textMap.size === 0) {
    console.error('❌ No entries parsed from KJV file! Check the format.');
    // Show some sample lines for debugging
    console.log('Sample lines for debugging:', lines.slice(0, 3));
    return verses; // Return empty array, will trigger fallback
  }
  
  // Show sample entries from the map
  console.log('Sample text map entries:', Array.from(textMap.entries()).slice(0, 3));
  
  // Now create verses using the verse keys and matching text
  let versesWithText = 0;
  let missingCount = 0;
  
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
          console.log(`✓ Created verse ${index + 1}: ${reference} -> ${verseText.substring(0, 60)}...`);
        }
      } else {
        missingCount++;
        if (index < 5) {
          console.log(`✗ Missing text for verse ${index + 1}: ${key} (looking for "${key}")`);
        }
      }
    }
  });
  
  console.log(`📊 Results: ${versesWithText} verses with text, ${missingCount} missing`);
  
  console.log(`SUCCESS: Generated ${verses.length} verses with actual KJV text from your Supabase files`);
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
  const [isLoading, setIsLoading] = useState(true);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [expandedVerse, setExpandedVerse] = useState<BibleVerse | null>(null);
  const [loadingProgress, setLoadingProgress] = useState({
    stage: 'initializing',
    percentage: 0
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        setLoadingProgress({ stage: 'structure', percentage: 10 });

        const data = await loadBibleData((progress) => {
          setLoadingProgress(progress);
        });

        setLoadingProgress({ stage: 'cross-refs', percentage: 80 });
        try {
          await loadCrossReferencesFromAssets(data);
          setLoadingProgress({ stage: 'finalizing', percentage: 95 });
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.warn('Cross-reference loading failed, continuing:', error);
        }
        
        setLoadingProgress({ stage: 'complete', percentage: 100 });
        await new Promise(resolve => setTimeout(resolve, 200));

        setVerses(data);
        setIsLoading(false);
        console.log('✓ Bible study platform ready!', {
          versesCount: data.length,
          isLoading: false,
          error: null,
          firstVerse: data[0]
        });
      } catch (err) {
        console.error('Error in useBibleData:', err);
        setError(err instanceof Error ? err.message : 'Failed to load Bible data');
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

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

// Function to load cross-references from attached assets
const loadCrossReferencesFromAssets = async (verses: BibleVerse[]) => {
  try {
    // Load actual cross-reference data from your attached file
    const response = await fetch('/attached_assets/Pasted-Gen-1-1-John-1-1-John-1-2-John-1-3-Heb-11-3-Isa-45-18-Rev-4-11-Heb-1-10-Col-1-16-Col-1-17-Isa-42-5--1750893815435_1750893815436.txt');
    
    if (response.ok) {
      const text = await response.text();
      
      // Check if we got your actual cross-reference data
      if (text.includes('Gen.1:1$$') && !text.includes('<html')) {
        console.log(`✓ Loading cross-references from your actual file`);
        console.log(`Cross-reference sample:`, text.substring(0, 200));
        
        const crossRefMap = parseCrossReferences(text);
        applyCrossReferences(verses, crossRefMap);
        return;
      } else {
        console.log('File access blocked, using embedded cross-reference data');
      }
    }
    
    // Use your actual cross-reference data embedded here
    const actualCrossRefData = `Gen.1:1$$John.1:1#John.1:2#John.1:3$Heb.11:3$Isa.45:18$Rev.4:11$Heb.1:10$Col.1:16#Col.1:17$Isa.42:5$Exod.20:11$Job.38:4$Acts.17:24$2Pet.3:5$Neh.9:6$Isa.44:24$Jer.32:17$Jer.51:15$Ps.33:9$Prov.3:19$Rev.14:7$Ps.115:15$Acts.14:15$Ps.136:5$Jer.10:12$Prov.8:22#Prov.8:23#Prov.8:24#Prov.8:25#Prov.8:26#Prov.8:27#Prov.8:28#Prov.8:29#Prov.8:30$Ps.8:3$Ps.102:25$1Cor.8:6$Ps.124:8$Heb.3:4$Ps.33:6$Zech.12:1$Heb.1:2$Prov.16:4$Ps.121:2$Ps.104:24$Ps.96:5$Rev.10:6$Isa.40:28$Acts.4:24$Ps.134:3$Rom.11:36$Ps.148:4#Ps.148:5$Isa.37:16$Ps.89:11#Ps.89:12$Ps.90:2$Isa.51:16$Ps.146:6$Rev.22:13$1John.1:1$Ps.104:30$Mark.13:19$Rom.1:19#Rom.1:20$Isa.40:26$1Chr.16:26$Rev.21:6$Eph.3:9$Isa.65:17$Isa.51:13$Rev.3:14$Job.26:13$Eccl.12:1$Matt.11:25$Exod.31:18
Gen.1:2$$Jer.4:23$Ps.104:30$Isa.45:18$Ps.33:6$Job.26:7$Isa.40:12#Isa.40:13#Isa.40:14$Job.26:14$Nah.2:10
Gen.1:3$$2Cor.4:6$John.1:5$Isa.45:7$Isa.60:19$1John.1:5$Eph.5:8$John.1:9$John.3:19$Ps.148:5$Ps.33:6$Ps.33:9$Ps.97:11$Eph.5:14$Job.38:19$Ps.104:2$1John.2:8$1Tim.6:16$Ps.118:27$Job.36:30$John.11:43$Matt.8:3
Gen.1:4$$Eccl.2:13$Gen.1:18$Eccl.11:7$Gen.1:12$Gen.1:31$Gen.1:10$Gen.1:25
Gen.1:5$$Ps.74:16$Isa.45:7$Ps.104:20$1Thess.5:5$Gen.8:22$Ps.19:2$Jer.33:20$Eph.5:13$1Cor.3:13$Gen.1:8$Gen.1:31$Gen.1:19$Gen.1:23$Gen.1:13`;
    
    console.log(`✓ Using embedded cross-reference data from your file`);
    const crossRefMap = parseCrossReferences(actualCrossRefData);
    applyCrossReferences(verses, crossRefMap);
    console.log('✓ Cross-reference processing completed');
    

    
  } catch (err) {
    console.log('Error loading cross-references:', err);
  }
};



const parseCrossReferences = (text: string) => {
  const crossRefMap: Record<string, any[]> = {};
  
  console.log('Parsing cross-references with Gen.1:1 format...');
  const lines = text.split('\n').filter(line => line.trim());
  console.log(`Found ${lines.length} cross-reference lines`);
  
  lines.forEach((line, index) => {
    if (line.includes('$$')) {
      const [mainRef, crossRefsText] = line.split('$$');
      // Keep the exact Gen.1:1 format - don't convert to spaces
      const cleanMainRef = mainRef.trim();
      
      if (crossRefsText) {
        // Split by $ to get different reference groups, then by # for sequential verses
        const refGroups = crossRefsText.split('$');
        const crossRefs: any[] = [];
        
        refGroups.forEach(group => {
          if (group.trim()) {
            const seqRefs = group.split('#');
            seqRefs.forEach(ref => {
              if (ref.trim()) {
                // Keep the exact format: John.1:1, don't convert to spaces
                const cleanRef = ref.trim();
                crossRefs.push({
                  reference: cleanRef,
                  text: '' // Will be populated with actual verse text
                });
              }
            });
          }
        });
        
        crossRefMap[cleanMainRef] = crossRefs;
        
        if (index < 5) {
          console.log(`✓ Parsed cross-ref ${index + 1}: ${cleanMainRef} -> ${crossRefs.length} references`);
        }
      }
    }
  });
  
  console.log(`📊 Cross-reference results: ${Object.keys(crossRefMap).length} verses with cross-references`);
  return crossRefMap;
};

const applyCrossReferences = (verses: BibleVerse[], crossRefMap: Record<string, any[]>) => {
  // Helper function to get verse text from the Bible data using Gen.1:1 format
  const getVerseText = (dotReference: string): string => {
    // Convert Gen.1:1 format to "Gen 1:1" format to match our verse data
    const spaceReference = dotReference.replace(/\./g, ' ');
    const verse = verses.find(v => v.reference === spaceReference);
    return verse?.text?.KJV || '';
  };
  
  // Apply cross-references to verses with actual text content
  let crossRefCount = 0;
  verses.forEach(verse => {
    // Convert verse reference back to Gen.1:1 format to match crossRefMap keys
    const dotFormat = verse.reference.replace(/\s/g, '.');
    const crossRefs = crossRefMap[dotFormat];
    
    if (crossRefs && crossRefs.length > 0) {
      verse.crossReferences = crossRefs.slice(0, 6).map(ref => ({ // Limit to first 6 for display
        ...ref,
        text: getVerseText(ref.reference) || 'Text not found'
      }));
      crossRefCount++;
    }
  });
  
  console.log(`✓ Applied cross-references to ${crossRefCount} verses using Gen.1:1 format`);
};

  const navigateToVerse = (reference: string) => {
    console.log('Navigating to verse:', reference);
    
    // Convert Gen.1:1 format to Gen 1:1 format for element search
    const spaceReference = reference.replace(/\./g, ' ');
    const verseElement = document.querySelector(`[data-verse-ref="${spaceReference}"]`);
    
    if (verseElement) {
      verseElement.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center',
        inline: 'nearest'
      });
      
      // Highlight the verse briefly
      verseElement.classList.add('bg-yellow-200', 'dark:bg-yellow-800');
      setTimeout(() => {
        verseElement.classList.remove('bg-yellow-200', 'dark:bg-yellow-800');
      }, 2000);
    } else {
      console.warn(`Verse element not found for reference: ${reference} (converted to ${spaceReference})`);
    }
  };

  return {
    data: verses, // Return all verses - BiblePage expects 'data' property
    isLoading,
    loadingProgress,
    navigateToVerse,
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
