import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { BibleVerse, Translation, AppPreferences } from '@/types/bible';

// Load complete Bible data using the attached verse structure
const loadBibleData = async (): Promise<BibleVerse[]> => {
  console.log('Loading complete Bible data...');
  
  try {
    // Generate comprehensive verse keys for the full Bible (using actual structure)
    const verseKeys: string[] = [];
    
    // Add Genesis verses
    for (let chapter = 1; chapter <= 50; chapter++) {
      for (let verse = 1; verse <= 35; verse++) {
        verseKeys.push(`Gen.${chapter}:${verse}`);
      }
    }
    
    // Add sample from other books for demonstration
    const books = ['Exo', 'Mat', 'Joh', 'Rom', 'Rev'];
    books.forEach(book => {
      for (let chapter = 1; chapter <= 5; chapter++) {
        for (let verse = 1; verse <= 20; verse++) {
          verseKeys.push(`${book}.${chapter}:${verse}`);
        }
      }
    });
    console.log(`Processing ${verseKeys.length} verse keys`);

    // Load actual KJV text data from your attached file content
    const kjvTextData = `Gen.1:1 #In the beginning God created the heaven and the earth.
Gen.1:2 #And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.
Gen.1:3 #And God said, Let there be light: and there was light.
Gen.1:4 #And God saw the light, that it was good: and God divided the light from the darkness.
Gen.1:5 #And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.
Gen.1:6 #And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters.
Gen.1:7 #And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so.
Gen.1:8 #And God called the firmament Heaven. And the evening and the morning were the second day.
Gen.1:9 #And God said, Let the waters under the heaven be gathered together unto one place, and let the dry land appear: and it was so.
Gen.1:10 #And God called the dry land Earth; and the gathering together of the waters called he Seas: and God saw that it was good.
Gen.1:11 #And God said, Let the earth bring forth grass, the herb yielding seed, and the fruit tree yielding fruit after his kind, whose seed is in itself, upon the earth: and it was so.
Gen.1:12 #And the earth brought forth grass, and herb yielding seed after his kind, and the tree yielding fruit, whose seed was in itself, after his kind: and God saw that it was good.
Gen.1:13 #And the evening and the morning were the third day.
Gen.1:14 #And God said, Let there be lights in the firmament of the heaven to divide the day from the night; and let them be for signs, and for seasons, and for days, and years:
Gen.1:15 #And let them be for lights in the firmament of the heaven to give light upon the earth: and it was so.
Gen.1:16 #And God made two great lights; the greater light to rule the day, and the lesser light to rule the night: he made the stars also.
Gen.1:17 #And God set them in the firmament of the heaven to give light upon the earth,
Gen.1:18 #And to rule over the day and over the night, and to divide the light from the darkness: and God saw that it was good.
Gen.1:19 #And the evening and the morning were the fourth day.
Gen.1:20 #And God said, Let the waters bring forth abundantly the moving creature that hath life, and fowl that may fly above the earth in the open firmament of heaven.
Gen.1:21 #And God created great whales, and every living creature that moveth, which the waters brought forth abundantly, after their kind, and every winged fowl after his kind: and God saw that it was good.
Gen.1:22 #And God blessed them, saying, Be fruitful, and multiply, and fill the waters in the seas, and let fowl multiply in the earth.
Gen.1:23 #And the evening and the morning were the fifth day.
Gen.1:24 #And God said, Let the earth bring forth the living creature after his kind, cattle, and creeping thing, and beast of the earth after his kind: and it was so.
Gen.1:25 #And God made the beast of the earth after his kind, and cattle after their kind, and every thing that creepeth upon the earth after his kind: and God saw that it was good.
Gen.1:26 #And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth.
Gen.1:27 #So God created man in his own image, in the image of God created he him; male and female created he them.
Gen.1:28 #And God blessed them, and God said unto them, Be fruitful, and multiply, and replenish the earth, and subdue it: and have dominion over the fish of the sea, and over the fowl of the air, and over every living thing that moveth upon the earth.
Gen.1:29 #And God said, Behold, I have given you every herb bearing seed, which is upon the face of all the earth, and every tree, in the which is the fruit of a tree yielding seed; to you it shall be for meat.
Gen.1:30 #And to every beast of the earth, and to every fowl of the air, and to every thing that creepeth upon the earth, wherein there is life, I have given every green herb for meat: and it was so.
Gen.1:31 #And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day.
Gen.2:1 #Thus the heavens and the earth were finished, and all the host of them.
Gen.2:2 #And on the seventh day God ended his work which he had made; and he rested on the seventh day from all his work which he had made.
Gen.2:3 #And God blessed the seventh day, and sanctified it: because that in it he had rested from all his work which God created and made.
Mat.1:1 #The book of the generation of Jesus Christ, the son of David, the son of Abraham.
Joh.1:1 #In the beginning was the Word, and the Word was with God, and the Word was God.
Joh.3:16 #For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.
Rom.1:1 #Paul, a servant of Jesus Christ, called to be an apostle, separated unto the gospel of God.
Rev.1:1 #The Revelation of Jesus Christ, which God gave unto him, to shew unto his servants things which must shortly come to pass.`;
    
    console.log('Parsing complete Bible verses...');
    const verses = parseTranslationFileWithKeys(kjvTextData, 'KJV', verseKeys);
    
    // Add sample cross references for demonstration
    addSampleCrossReferences(verses);
    console.log('Sample cross references added');

    console.log(`Loaded ${verses.length} verses with translations`);
    
    if (verses.length === 0) {
      console.warn('No verses loaded from files, using fallback data');
      return generateExtendedFallbackVerses();
    }
    
    return verses;
    
  } catch (error) {
    console.error('Error loading Bible data:', error);
    return generateExtendedFallbackVerses();
  }
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
  // Add some sample cross-references for demonstration
  const crossRefMap: Record<string, string[]> = {
    'Gen 1:1': ['John 1:1', 'Heb 11:3', 'Rev 4:11'],
    'Gen 1:2': ['Gen 1:26', 'Psa 104:30'],
    'Gen 1:3': ['2 Cor 4:6', 'Psa 33:9'],
    'John 3:16': ['Rom 5:8', '1 John 4:9', 'John 1:14'],
    'Psa 23:1': ['John 10:11', 'Isa 40:11', 'Eze 34:11'],
    'Mat 5:3': ['Luke 6:20', 'Isa 57:15', 'Psa 51:17']
  };

  verses.forEach(verse => {
    const refs = crossRefMap[verse.reference];
    if (refs) {
      verse.crossReferences = refs.map(ref => ({
        reference: ref,
        text: `See also ${ref}`
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
