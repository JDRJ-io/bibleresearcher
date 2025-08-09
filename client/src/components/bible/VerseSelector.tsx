import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useWindowSize } from 'react-use';


interface VerseSelectorProps {
  onNavigate: (reference: string) => void;
}

// Bible book data with chapter counts
const BIBLE_BOOKS = [
  // Old Testament
  { name: 'Genesis', abbrev: 'Gen', chapters: 50 },
  { name: 'Exodus', abbrev: 'Exo', chapters: 40 },
  { name: 'Leviticus', abbrev: 'Lev', chapters: 27 },
  { name: 'Numbers', abbrev: 'Num', chapters: 36 },
  { name: 'Deuteronomy', abbrev: 'Deu', chapters: 34 },
  { name: 'Joshua', abbrev: 'Jos', chapters: 24 },
  { name: 'Judges', abbrev: 'Jdg', chapters: 21 },
  { name: 'Ruth', abbrev: 'Rut', chapters: 4 },
  { name: '1 Samuel', abbrev: '1Sa', chapters: 31 },
  { name: '2 Samuel', abbrev: '2Sa', chapters: 24 },
  { name: '1 Kings', abbrev: '1Ki', chapters: 22 },
  { name: '2 Kings', abbrev: '2Ki', chapters: 25 },
  { name: '1 Chronicles', abbrev: '1Ch', chapters: 29 },
  { name: '2 Chronicles', abbrev: '2Ch', chapters: 36 },
  { name: 'Ezra', abbrev: 'Ezr', chapters: 10 },
  { name: 'Nehemiah', abbrev: 'Neh', chapters: 13 },
  { name: 'Esther', abbrev: 'Est', chapters: 10 },
  { name: 'Job', abbrev: 'Job', chapters: 42 },
  { name: 'Psalms', abbrev: 'Psa', chapters: 150 },
  { name: 'Proverbs', abbrev: 'Pro', chapters: 31 },
  { name: 'Ecclesiastes', abbrev: 'Ecc', chapters: 12 },
  { name: 'Song of Solomon', abbrev: 'Son', chapters: 8 },
  { name: 'Isaiah', abbrev: 'Isa', chapters: 66 },
  { name: 'Jeremiah', abbrev: 'Jer', chapters: 52 },
  { name: 'Lamentations', abbrev: 'Lam', chapters: 5 },
  { name: 'Ezekiel', abbrev: 'Eze', chapters: 48 },
  { name: 'Daniel', abbrev: 'Dan', chapters: 12 },
  { name: 'Hosea', abbrev: 'Hos', chapters: 14 },
  { name: 'Joel', abbrev: 'Joe', chapters: 3 },
  { name: 'Amos', abbrev: 'Amo', chapters: 9 },
  { name: 'Obadiah', abbrev: 'Oba', chapters: 1 },
  { name: 'Jonah', abbrev: 'Jon', chapters: 4 },
  { name: 'Micah', abbrev: 'Mic', chapters: 7 },
  { name: 'Nahum', abbrev: 'Nah', chapters: 3 },
  { name: 'Habakkuk', abbrev: 'Hab', chapters: 3 },
  { name: 'Zephaniah', abbrev: 'Zep', chapters: 3 },
  { name: 'Haggai', abbrev: 'Hag', chapters: 2 },
  { name: 'Zechariah', abbrev: 'Zec', chapters: 14 },
  { name: 'Malachi', abbrev: 'Mal', chapters: 4 },
  // New Testament
  { name: 'Matthew', abbrev: 'Mat', chapters: 28 },
  { name: 'Mark', abbrev: 'Mar', chapters: 16 },
  { name: 'Luke', abbrev: 'Luk', chapters: 24 },
  { name: 'John', abbrev: 'Joh', chapters: 21 },
  { name: 'Acts', abbrev: 'Act', chapters: 28 },
  { name: 'Romans', abbrev: 'Rom', chapters: 16 },
  { name: '1 Corinthians', abbrev: '1Co', chapters: 16 },
  { name: '2 Corinthians', abbrev: '2Co', chapters: 13 },
  { name: 'Galatians', abbrev: 'Gal', chapters: 6 },
  { name: 'Ephesians', abbrev: 'Eph', chapters: 6 },
  { name: 'Philippians', abbrev: 'Phi', chapters: 4 },
  { name: 'Colossians', abbrev: 'Col', chapters: 4 },
  { name: '1 Thessalonians', abbrev: '1Th', chapters: 5 },
  { name: '2 Thessalonians', abbrev: '2Th', chapters: 3 },
  { name: '1 Timothy', abbrev: '1Ti', chapters: 6 },
  { name: '2 Timothy', abbrev: '2Ti', chapters: 4 },
  { name: 'Titus', abbrev: 'Tit', chapters: 3 },
  { name: 'Philemon', abbrev: 'Phm', chapters: 1 },
  { name: 'Hebrews', abbrev: 'Heb', chapters: 13 },
  { name: 'James', abbrev: 'Jas', chapters: 5 },
  { name: '1 Peter', abbrev: '1Pe', chapters: 5 },
  { name: '2 Peter', abbrev: '2Pe', chapters: 3 },
  { name: '1 John', abbrev: '1Jo', chapters: 5 },
  { name: '2 John', abbrev: '2Jo', chapters: 1 },
  { name: '3 John', abbrev: '3Jo', chapters: 1 },
  { name: 'Jude', abbrev: 'Jud', chapters: 1 },
  { name: 'Revelation', abbrev: 'Rev', chapters: 22 }
];

// Verse counts per chapter for Genesis (example - would need full data for all books)
const VERSE_COUNTS: Record<string, number[]> = {
  'Gen': [31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38, 18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23, 23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26],
  'Exo': [22, 25, 22, 31, 23, 30, 25, 32, 35, 29, 10, 51, 22, 31, 27, 36, 16, 27, 25, 26, 36, 31, 33, 18, 40, 37, 21, 43, 46, 38, 18, 35, 23, 35, 35, 38, 29, 31, 43, 38],
  // Add more books as needed
};

export function VerseSelector({ onNavigate }: VerseSelectorProps) {
  const [selectedBook, setSelectedBook] = useState<string>('Gen');
  const [selectedChapter, setSelectedChapter] = useState<string>('1');
  const [selectedVerse, setSelectedVerse] = useState<string>('1');
  const [isOpen, setIsOpen] = useState(false);
  const { user, loading } = useAuth();
  const { width } = useWindowSize();
  const isMobile = width <= 640;

  const selectedBookData = BIBLE_BOOKS.find(book => book.abbrev === selectedBook);
  const maxChapter = selectedBookData?.chapters || 1;
  const maxVerse = VERSE_COUNTS[selectedBook]?.[parseInt(selectedChapter) - 1] || 50;

  const handleNavigate = () => {
    const reference = `${selectedBook} ${selectedChapter}:${selectedVerse}`;
    onNavigate(reference);
    setIsOpen(false);
  };

  const handleQuickNavigate = (ref: string) => {
    onNavigate(ref);
    setIsOpen(false);
  };

  // Curated verses list from user request
  const curatedVerses = [
    '1Sam 17:1', 'Isa 61:1', 'Ps 91:1', 'Rom 8:1', 'John 13:1',
    'Eph 1:17', 'Matt 5:1', 'Ps 23:1', 'Ps 139:1', 'Mal 1:1',
    'Rev 1:1', 'Rev 19:1', 'Dan 3:1', 'Exod 34:1', 'Prov 21:1',
    'Job 38:1', 'Rom 12:1', 'Acts 2:1', 'John 18:1', '2Pet 1:1'
  ];

  const getRandomCuratedVerses = () => {
    const shuffled = [...curatedVerses].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  };

  const [randomVerses, setRandomVerses] = useState(() => getRandomCuratedVerses());

  if (!isOpen) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="text-xs px-2 py-1 h-7"
        >
          <span className="mr-1">📖</span>
          Go to
          <ChevronDown className="h-3 w-3 ml-1" />
        </Button>
        
        {/* Authentication buttons or Quick navigation buttons */}
        {!isMobile && (
          <div className="flex gap-1">
            {loading ? (
              <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent"></div>
                <span className="text-xs">Loading...</span>
              </div>
            ) : user ? (
              // Logged in: Show original Bible shortcuts
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickNavigate('Gen 1:1')}
                  className="text-xs px-2 py-1 h-7 hover:bg-muted"
                >
                  Gen 1:1
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickNavigate('Psa 23:1')}
                  className="text-xs px-2 py-1 h-7 hover:bg-muted"
                >
                  Psa 23
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleQuickNavigate('John 3:16')}
                  className="text-xs px-2 py-1 h-7 hover:bg-muted"
                >
                  John 3:16
                </Button>
              </>
            ) : (
              // Logged out: Show 3 random curated Bible verse shortcuts
              <>
                {randomVerses.map((verse, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleQuickNavigate(verse)}
                    className="text-xs px-2 py-1 h-7 hover:bg-muted"
                  >
                    {verse}
                  </Button>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
        {/* Book Selector */}
        <Select value={selectedBook} onValueChange={setSelectedBook}>
          <SelectTrigger className="w-32 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {BIBLE_BOOKS.map((book) => (
              <SelectItem key={book.abbrev} value={book.abbrev}>
                {book.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Chapter Selector */}
        <Select value={selectedChapter} onValueChange={setSelectedChapter}>
          <SelectTrigger className="w-16 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {Array.from({ length: maxChapter }, (_, i) => i + 1).map((chapter) => (
              <SelectItem key={chapter} value={chapter.toString()}>
                {chapter}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground">:</span>

        {/* Verse Selector */}
        <Select value={selectedVerse} onValueChange={setSelectedVerse}>
          <SelectTrigger className="w-16 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-60 overflow-y-auto">
            {Array.from({ length: maxVerse }, (_, i) => i + 1).map((verse) => (
              <SelectItem key={verse} value={verse.toString()}>
                {verse}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Action Buttons */}
        <Button
          onClick={handleNavigate}
          size="sm"
          className="h-8 px-3 text-xs"
        >
          Go
        </Button>
        
        <Button
          variant="ghost"
          onClick={() => setIsOpen(false)}
          size="sm"
          className="h-8 px-2 text-xs"
        >
          ✕
        </Button>
      </div>

    </>
  );
}