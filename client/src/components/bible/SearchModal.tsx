import React, { useState, useEffect, useMemo, useRef, forwardRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter, ArrowUp, ArrowDown, History, Clock, Zap, Target, Shuffle, Keyboard, BookOpen, ChevronRight, Map as MapIcon, ListOrdered } from 'lucide-react';
import { useBibleStore } from '@/App';
import { LoadingWheel } from '@/components/LoadingWheel';
import { BibleSearchEngine, type SearchResult } from '@/lib/bibleSearchEngine';
import { useTranslationMaps } from '@/hooks/useTranslationMaps';
import { parseCandidates } from '@/lib/bible-reference-parser';
import { getVerseCount } from '@/lib/bibleVerseCountHelper';
import { useKeyboardViewport } from '@/hooks/useKeyboardViewport';
import { getEngineOnce } from '@/lib/searchEngineSingletons';
import { loadTranslationOnce } from '@/lib/translationLoader';

type Testament = "OT" | "NT";

type BookMeta = {
  tag: string;
  name: string;
  testament: Testament;
  chapters: number;
};

const BIBLE_BOOKS: BookMeta[] = [
  { tag: 'Gen', name: 'Genesis', testament: 'OT', chapters: 50 },
  { tag: 'Exod', name: 'Exodus', testament: 'OT', chapters: 40 },
  { tag: 'Lev', name: 'Leviticus', testament: 'OT', chapters: 27 },
  { tag: 'Num', name: 'Numbers', testament: 'OT', chapters: 36 },
  { tag: 'Deut', name: 'Deuteronomy', testament: 'OT', chapters: 34 },
  { tag: 'Josh', name: 'Joshua', testament: 'OT', chapters: 24 },
  { tag: 'Judg', name: 'Judges', testament: 'OT', chapters: 21 },
  { tag: 'Ruth', name: 'Ruth', testament: 'OT', chapters: 4 },
  { tag: '1Sam', name: '1 Samuel', testament: 'OT', chapters: 31 },
  { tag: '2Sam', name: '2 Samuel', testament: 'OT', chapters: 24 },
  { tag: '1Kgs', name: '1 Kings', testament: 'OT', chapters: 22 },
  { tag: '2Kgs', name: '2 Kings', testament: 'OT', chapters: 25 },
  { tag: '1Chr', name: '1 Chronicles', testament: 'OT', chapters: 29 },
  { tag: '2Chr', name: '2 Chronicles', testament: 'OT', chapters: 36 },
  { tag: 'Ezra', name: 'Ezra', testament: 'OT', chapters: 10 },
  { tag: 'Neh', name: 'Nehemiah', testament: 'OT', chapters: 13 },
  { tag: 'Esth', name: 'Esther', testament: 'OT', chapters: 10 },
  { tag: 'Job', name: 'Job', testament: 'OT', chapters: 42 },
  { tag: 'Ps', name: 'Psalms', testament: 'OT', chapters: 150 },
  { tag: 'Prov', name: 'Proverbs', testament: 'OT', chapters: 31 },
  { tag: 'Eccl', name: 'Ecclesiastes', testament: 'OT', chapters: 12 },
  { tag: 'Song', name: 'Song', testament: 'OT', chapters: 8 },
  { tag: 'Isa', name: 'Isaiah', testament: 'OT', chapters: 66 },
  { tag: 'Jer', name: 'Jeremiah', testament: 'OT', chapters: 52 },
  { tag: 'Lam', name: 'Lamentations', testament: 'OT', chapters: 5 },
  { tag: 'Ezek', name: 'Ezekiel', testament: 'OT', chapters: 48 },
  { tag: 'Dan', name: 'Daniel', testament: 'OT', chapters: 12 },
  { tag: 'Hos', name: 'Hosea', testament: 'OT', chapters: 14 },
  { tag: 'Joel', name: 'Joel', testament: 'OT', chapters: 3 },
  { tag: 'Amos', name: 'Amos', testament: 'OT', chapters: 9 },
  { tag: 'Obad', name: 'Obadiah', testament: 'OT', chapters: 1 },
  { tag: 'Jonah', name: 'Jonah', testament: 'OT', chapters: 4 },
  { tag: 'Mic', name: 'Micah', testament: 'OT', chapters: 7 },
  { tag: 'Nah', name: 'Nahum', testament: 'OT', chapters: 3 },
  { tag: 'Hab', name: 'Habakkuk', testament: 'OT', chapters: 3 },
  { tag: 'Zeph', name: 'Zephaniah', testament: 'OT', chapters: 3 },
  { tag: 'Hag', name: 'Haggai', testament: 'OT', chapters: 2 },
  { tag: 'Zech', name: 'Zechariah', testament: 'OT', chapters: 14 },
  { tag: 'Mal', name: 'Malachi', testament: 'OT', chapters: 4 },
  { tag: 'Matt', name: 'Matthew', testament: 'NT', chapters: 28 },
  { tag: 'Mark', name: 'Mark', testament: 'NT', chapters: 16 },
  { tag: 'Luke', name: 'Luke', testament: 'NT', chapters: 24 },
  { tag: 'John', name: 'John', testament: 'NT', chapters: 21 },
  { tag: 'Acts', name: 'Acts', testament: 'NT', chapters: 28 },
  { tag: 'Rom', name: 'Romans', testament: 'NT', chapters: 16 },
  { tag: '1Cor', name: '1 Corinthians', testament: 'NT', chapters: 16 },
  { tag: '2Cor', name: '2 Corinthians', testament: 'NT', chapters: 13 },
  { tag: 'Gal', name: 'Galatians', testament: 'NT', chapters: 6 },
  { tag: 'Eph', name: 'Ephesians', testament: 'NT', chapters: 6 },
  { tag: 'Phil', name: 'Philippians', testament: 'NT', chapters: 4 },
  { tag: 'Col', name: 'Colossians', testament: 'NT', chapters: 4 },
  { tag: '1Thess', name: '1 Thessalonians', testament: 'NT', chapters: 5 },
  { tag: '2Thess', name: '2 Thessalonians', testament: 'NT', chapters: 3 },
  { tag: '1Tim', name: '1 Timothy', testament: 'NT', chapters: 6 },
  { tag: '2Tim', name: '2 Timothy', testament: 'NT', chapters: 4 },
  { tag: 'Titus', name: 'Titus', testament: 'NT', chapters: 3 },
  { tag: 'Phlm', name: 'Philemon', testament: 'NT', chapters: 1 },
  { tag: 'Heb', name: 'Hebrews', testament: 'NT', chapters: 13 },
  { tag: 'Jas', name: 'James', testament: 'NT', chapters: 5 },
  { tag: '1Pet', name: '1 Peter', testament: 'NT', chapters: 5 },
  { tag: '2Pet', name: '2 Peter', testament: 'NT', chapters: 3 },
  { tag: '1John', name: '1 John', testament: 'NT', chapters: 5 },
  { tag: '2John', name: '2 John', testament: 'NT', chapters: 1 },
  { tag: '3John', name: '3 John', testament: 'NT', chapters: 1 },
  { tag: 'Jude', name: 'Jude', testament: 'NT', chapters: 1 },
  { tag: 'Rev', name: 'Revelation', testament: 'NT', chapters: 22 }
];

const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);
  
  return isMobile;
};

const useDebounced = (value: string, ms: number) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVerse: (verseReference: string) => void;
  onSwitchTranslation?: (translationCode: string) => void;
  verses?: any[];
}

export function SearchModal({ isOpen, onClose, onNavigateToVerse, onSwitchTranslation, verses = [] }: SearchModalProps) {
  const [view, setView] = useState<"search" | "map" | "scroller">("search");
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTranslation, setSelectedTranslation] = useState<'KJV' | 'BSB' | 'WEB' | 'YLT'>('KJV');
  const [activeSearchTr, setActiveSearchTr] = useState<'KJV' | 'BSB' | 'WEB' | 'YLT'>('KJV');
  const [searchAllTranslations, setSearchAllTranslations] = useState(true);
  const [activeGroup, setActiveGroup] = useState<'reference' | 'text'>('reference');
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const didInit = useRef(false);
  
  const [bookIdx, setBookIdx] = useState(0);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [verseIdx, setVerseIdx] = useState(0);
  
  const [mapStep, setMapStep] = useState<'book' | 'chapter' | 'verse'>('book');
  const [mapBook, setMapBook] = useState<BookMeta | null>(null);
  const [mapChapter, setMapChapter] = useState(1);
  const [mapTestament, setMapTestament] = useState<'all' | Testament>('all');
  const [mapSearch, setMapSearch] = useState('');
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const bookRef = useRef<HTMLDivElement>(null);
  const chapterRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const { mainTranslation: activeTranslation, getVerseText } = useTranslationMaps();
  const [loadedTranslations, setLoadedTranslations] = useState<Map<string, Map<string, string>>>(new Map());
  const [refTexts, setRefTexts] = useState<Record<string, string>>({});
  const { kbHeight, isTouch } = useKeyboardViewport(isOpen);
  const [searchEngine, setSearchEngine] = useState<BibleSearchEngine | null>(null);

  const loadTranslationForSearch = async (translationCode: string): Promise<Map<string, string> | null> => {
    if (loadedTranslations.has(translationCode)) {
      return loadedTranslations.get(translationCode)!;
    }

    try {
      const { loadTranslationOnce } = await import('@/lib/translationLoader');
      const translationMap = await loadTranslationOnce(translationCode);
      
      if (translationMap && translationMap.size > 0) {
        setLoadedTranslations(prev => new Map(prev).set(translationCode, translationMap));
        return translationMap;
      }
    } catch (error) {
      console.error('Translation loading error:', error);
    }
    
    return null;
  };

  useEffect(() => {
    if (!isOpen) return;
    if (didInit.current && searchEngine) return;
    didInit.current = true;

    getEngineOnce(activeSearchTr).then(setSearchEngine);
  }, [isOpen, activeSearchTr]);

  useEffect(() => {
    if (!isOpen) return;
    
    const idle = (window as any).requestIdleCallback ?? ((cb: any) => setTimeout(cb, 500));
    const handle = idle(async () => {
      for (const code of ['KJV', 'BSB', 'WEB', 'YLT'].filter(c => c !== activeSearchTr)) {
        void loadTranslationOnce(code);
      }
    });
    return () => (window as any).cancelIdleCallback?.(handle);
  }, [isOpen, activeSearchTr]);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      setActiveIndex(0);
      setShowHistory(false);
      setView('search');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && view === 'search' && searchInputRef.current && !isTouch) {
      searchInputRef.current.focus();
    }
  }, [isOpen, view, isTouch]);

  useEffect(() => {
    const b = BIBLE_BOOKS[bookIdx];
    if (!b) { setBookIdx(0); setChapterIdx(0); setVerseIdx(0); return; }
    if (chapterIdx >= b.chapters) setChapterIdx(0);
    const verses = getVerseCount(b.tag, chapterIdx + 1) || 1;
    if (verseIdx >= verses) setVerseIdx(0);
  }, [bookIdx, chapterIdx, verseIdx]);

  useEffect(() => {
    if (isOpen && view === 'map') {
      setMapBook(BIBLE_BOOKS[bookIdx]);
      setMapChapter(chapterIdx + 1);
    }
  }, [isOpen, view, bookIdx, chapterIdx]);

  const currentBook = BIBLE_BOOKS[bookIdx];
  const currentChapter = chapterIdx + 1;
  const currentVerse = verseIdx + 1;
  const currentKey = currentBook ? `${currentBook.tag}.${currentChapter}:${currentVerse}` : "";

  const [debouncedKey, setDebouncedKey] = useState(currentKey);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKey(currentKey);
    }, 300);
    return () => clearTimeout(timer);
  }, [currentKey]);

  const filteredBooks = useMemo(() => {
    let list = BIBLE_BOOKS;
    if (mapTestament !== 'all') list = list.filter(b => b.testament === mapTestament);
    if (mapSearch) list = list.filter(b => b.name.toLowerCase().includes(mapSearch.toLowerCase()));
    return list;
  }, [mapTestament, mapSearch]);

  const candidates = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return [];
    return parseCandidates(searchQuery.trim());
  }, [searchQuery]);

  const parsedKeys = useMemo(() => {
    return candidates.map(c => c.key);
  }, [candidates]);

  const debouncedQuery = useDebounced(searchQuery.toLowerCase().trim(), 180);
  
  const [textResults, setTextResults] = useState<SearchResult[]>([]);
  
  useEffect(() => {
    let cancelled = false;
    
    (async () => {
      if (!debouncedQuery || !searchEngine) {
        setTextResults([]);
        return;
      }
      
      const translationsToSearch = searchAllTranslations ? 
        ['KJV', 'BSB', 'WEB', 'YLT'] : 
        [selectedTranslation];

      const allResults: SearchResult[] = [];
      for (const trans of translationsToSearch) {
        const engine = await getEngineOnce(trans);
        const results = engine.search(debouncedQuery, trans, 1000, false);
        allResults.push(...results);
      }

      if (!cancelled) {
        setTextResults(allResults.sort((a, b) => b.confidence - a.confidence));
      }
    })();
    
    return () => { cancelled = true; };
  }, [debouncedQuery, selectedTranslation, searchAllTranslations, searchEngine]);

  const refPreview = useMemo(() => parsedKeys, [parsedKeys]);

  useEffect(() => {
    if (candidates.length === 0) {
      setRefTexts({});
      return;
    }
    
    const texts: Record<string, string> = {};
    candidates.forEach(candidate => {
      const text = getVerseText?.(candidate.key, selectedTranslation);
      if (text) {
        texts[candidate.key] = text.trim();
      }
    });
    setRefTexts(texts);
  }, [candidates, selectedTranslation, getVerseText]);

  const items = useMemo(() => {
    const refItems = refPreview.map(k => ({ kind: 'ref' as const, key: k }));
    const txtItems = textResults.map(r => ({ kind: 'text' as const, res: r }));
    return activeGroup === 'reference' ? [...refItems, ...txtItems] : [...txtItems, ...refItems];
  }, [refPreview, textResults, activeGroup]);

  useEffect(() => {
    setActiveIndex(i => Math.min(Math.max(i, 0), Math.max(items.length - 1, 0)));
  }, [items.length]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      setActiveGroup(g => g === 'reference' ? 'text' : 'reference');
      setActiveIndex(0);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items.length === 0) return;
      
      const item = items[activeIndex];
      if (item.kind === 'ref') {
        if (searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
          setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 9)]);
        }
        onNavigateToVerse(item.key);
      } else {
        if (searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
          setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 9)]);
        }
        if (item.res.translationCode && item.res.translationCode !== activeTranslation && onSwitchTranslation) {
          onSwitchTranslation(item.res.translationCode);
        }
        onNavigateToVerse(item.res.reference);
      }
      onClose();
    } else if (e.key === 'Escape') {
      onClose();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
      e.preventDefault();
      setShowHistory(!showHistory);
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
      e.preventDefault();
      getRandomVerse();
    }
  };

  const getRandomVerse = () => {
    if (verses.length === 0) return;
    const randomIndex = Math.floor(Math.random() * verses.length);
    const randomVerse = verses[randomIndex];
    onNavigateToVerse(randomVerse.reference);
    onClose();
  };

  const handleHistoryClick = (query: string) => {
    setSearchQuery(query);
    setShowHistory(false);
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    setShowHistory(false);
  };

  const handleScrollerGo = () => {
    if (currentKey) {
      onNavigateToVerse(currentKey);
      onClose();
    }
  };

  const handleMapVerseSelect = (key: string) => {
    onNavigateToVerse(key);
    onClose();
  };

  const maxHeightStyle = {
    maxHeight: `calc(var(--vvh, 85vh) - 16px)`
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={`flex flex-col bg-white/80 dark:bg-black/80 backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-2xl ${
          isMobile 
            ? 'max-w-sm w-[95vw] mx-2' 
            : view === 'search' ? 'max-w-2xl' : 'max-w-4xl'
        }`}
        style={maxHeightStyle}
        onInteractOutside={onClose}
        onEscapeKeyDown={onClose}
      >
        <DialogHeader className="pr-8">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              <span className="font-semibold">{view === 'search' ? 'Bible Search' : 'Bible Navigation'}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant={view === 'search' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('search')}
                data-testid="button-view-search"
              >
                <Search className="w-4 h-4" />
              </Button>
              <Button
                variant={view === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('map')}
                data-testid="button-view-map"
              >
                <MapIcon className="w-4 h-4" />
              </Button>
              <Button
                variant={view === 'scroller' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setView('scroller')}
                data-testid="button-view-scroller"
              >
                <ListOrdered className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        {view === 'search' && (
          <div className="space-y-3 mt-3 sm:mt-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
            <Input
              ref={searchInputRef}
              placeholder={isMobile ? "Try: jn316, Jon 1:1, or 'love'" : "Try: 'jn316', '1th517', 'Jon 1:1–3', or 'love your enemies'"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={onKeyDown}
              className="flex-1 focus-visible:ring-offset-0 focus-visible:border-blue-500"
              data-testid="input-search"
            />
            <div className="flex items-center gap-2 flex-shrink-0">
              <Select
                value={selectedTranslation}
                onValueChange={(v) => {
                  setSelectedTranslation(v as any);
                  setActiveSearchTr(v as any);
                  getEngineOnce(v as any).then(setSearchEngine);
                }}
                disabled={searchAllTranslations}
              >
                <SelectTrigger className="h-10 px-2 text-sm w-20" data-testid="select-translation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['KJV', 'BSB', 'WEB', 'YLT'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={searchAllTranslations}
                  onChange={() => setSearchAllTranslations(v => !v)}
                  className="rounded"
                  data-testid="checkbox-all-translations"
                />
                All
              </label>
              <Button 
                variant="outline" 
                onClick={getRandomVerse}
                title="Random Verse"
                data-testid="button-random"
                className="flex-shrink-0"
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              <Button
                variant={showHistory ? 'default' : 'outline'}
                onClick={() => setShowHistory(!showHistory)}
                title="Search History"
                disabled={searchHistory.length === 0}
                data-testid="button-history"
                className="flex-shrink-0"
              >
                <History className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {parsedKeys.length > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-300 flex-shrink-0">
              Interpreted as:{" "}
              <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 font-mono">
                {parsedKeys.slice(0, 3).join(", ")}{parsedKeys.length > 3 ? " …" : ""}
              </span>
            </div>
          )}

          {showHistory && searchHistory.length > 0 && (
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border flex-shrink-0 max-h-32 flex flex-col">
              <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Recent Searches</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSearchHistory}
                  className="h-6 px-2 text-xs text-gray-500"
                  data-testid="button-clear-history"
                >
                  Clear
                </Button>
              </div>
              <div className="flex flex-wrap gap-1 overflow-y-auto flex-1 min-h-0">
                {searchHistory.map((query, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => handleHistoryClick(query)}
                    className="h-7 px-2 text-xs hover:bg-blue-50 dark:hover:bg-blue-900"
                    data-testid={`button-history-${index}`}
                  >
                    {query}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex-1 overflow-hidden flex flex-col">
            <section aria-label="Search results" className="flex flex-col overflow-hidden flex-1">
              <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-y-auto flex-1 min-h-[300px]">
                {candidates.length === 0 && textResults.length === 0 && !searchQuery.trim() && (
                  <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    Start typing to search for verse references or text
                  </div>
                )}
                
                {candidates.length === 0 && textResults.length === 0 && searchQuery.trim() && (
                  <div className="p-6 text-center text-sm text-gray-500 dark:text-gray-400">
                    No results found
                  </div>
                )}

                <div className="space-y-3 p-3">
                  {candidates.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-2 py-1">
                        <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                          References
                        </h4>
                      </div>
                      
                      <div
                        className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-950 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors"
                        onMouseDown={() => {
                          if (searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
                            setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 9)]);
                          }
                          onNavigateToVerse(candidates[0].key);
                          onClose();
                        }}
                        data-testid="result-ref-primary"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-sm font-semibold">{candidates[0].key}</span>
                          <Badge variant="default" className="text-xs">Exact match</Badge>
                        </div>
                        {refTexts[candidates[0].key] ? (
                          <div className="text-sm opacity-90">
                            {refTexts[candidates[0].key].slice(0, 120)}
                            {refTexts[candidates[0].key].length > 120 && '...'}
                          </div>
                        ) : (
                          <div className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                        )}
                      </div>
                      
                      {candidates.length > 1 && (
                        <div className="pl-4 space-y-2">
                          <div className="text-xs font-semibold opacity-70">Also interpreted as:</div>
                          {candidates.slice(1).map((candidate, idx) => (
                            <div
                              key={candidate.key}
                              className="p-2 border rounded bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              onMouseDown={() => {
                                if (searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
                                  setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 9)]);
                                }
                                onNavigateToVerse(candidate.key);
                                onClose();
                              }}
                              data-testid={`result-ref-alternate-${idx}`}
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono text-xs">{candidate.key}</span>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {candidate.reason.replace(/-/g, ' ')}
                                </Badge>
                              </div>
                              {refTexts[candidate.key] ? (
                                <div className="text-xs opacity-80">
                                  {refTexts[candidate.key].slice(0, 100)}
                                  {refTexts[candidate.key].length > 100 && '...'}
                                </div>
                              ) : (
                                <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {textResults.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 px-2 py-1">
                        <Search className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <h4 className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                          Text Results
                        </h4>
                      </div>
                      
                      <div className="space-y-1">
                        {textResults.map((r, i) => (
                          <div
                            key={`${r.reference}-${r.translationCode}-${i}`}
                            className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                            onMouseDown={() => {
                              if (searchQuery.trim() && !searchHistory.includes(searchQuery.trim())) {
                                setSearchHistory(prev => [searchQuery.trim(), ...prev.slice(0, 9)]);
                              }
                              if (r.translationCode && r.translationCode !== activeTranslation && onSwitchTranslation) {
                                onSwitchTranslation(r.translationCode);
                              }
                              onNavigateToVerse(r.reference);
                              onClose();
                            }}
                            data-testid={`result-text-${i}`}
                          >
                            <div className="flex items-center gap-2 text-xs opacity-70 mb-1">
                              <span className="font-mono">{r.reference}</span>
                              {r.translationCode && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                  {r.translationCode}
                                </span>
                              )}
                              <span className="ml-auto">{(r.confidence * 100).toFixed(0)}%</span>
                            </div>
                            <div className="text-sm" dangerouslySetInnerHTML={{ __html: r.highlightedText }} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          </div>
        )}

        {view === 'scroller' && (
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <WheelPicker
                ref={bookRef}
                items={BIBLE_BOOKS.map((b, i) => ({ value: i, label: b.name }))}
                selectedIdx={bookIdx}
                onSelect={setBookIdx}
                label="Book"
                data-testid="wheel-book"
              />
              <WheelPicker
                ref={chapterRef}
                items={Array.from({ length: currentBook?.chapters || 1 }, (_, i) => ({
                  value: i,
                  label: String(i + 1)
                }))}
                selectedIdx={chapterIdx}
                onSelect={(idx) => { setChapterIdx(idx); setVerseIdx(0); }}
                label="Chapter"
                data-testid="wheel-chapter"
              />
              <WheelPicker
                ref={verseRef}
                items={Array.from({ length: getVerseCount(currentBook?.tag || 'Gen', currentChapter) || 1 }, (_, i) => ({
                  value: i,
                  label: String(i + 1)
                }))}
                selectedIdx={verseIdx}
                onSelect={setVerseIdx}
                label="Verse"
                data-testid="wheel-verse"
              />
            </div>

            <div className="text-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-base font-mono font-semibold mb-2">{currentKey}</div>
              {getVerseText && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {getVerseText(debouncedKey, 'KJV')}
                </div>
              )}
              <button
                onClick={handleScrollerGo}
                className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                data-testid="button-scroller-go"
              >
                Go to Verse
              </button>
            </div>
          </div>
        )}

        {view === 'map' && (
          <div className="p-4">
            {mapStep === 'book' && (
              <>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Search books..."
                    value={mapSearch}
                    onChange={(e) => setMapSearch(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                    data-testid="input-map-search"
                  />
                  <select
                    value={mapTestament}
                    onChange={(e) => setMapTestament(e.target.value as any)}
                    className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm"
                    data-testid="select-testament"
                  >
                    <option value="all">All</option>
                    <option value="OT">OT</option>
                    <option value="NT">NT</option>
                  </select>
                </div>
                <div className="max-h-[50vh] overflow-y-auto overflow-x-hidden bg-gradient-to-b from-neutral-50/50 to-neutral-100/30 dark:from-neutral-900/50 dark:to-neutral-800/30 rounded-xl p-3 -mx-1">
                  {(mapTestament === 'all' || mapTestament === 'OT') && (
                    <>
                      <div className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2 px-1">
                        Old Testament
                      </div>
                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-11 gap-2 mb-4 w-full">
                        {filteredBooks.filter(b => b.testament === 'OT').map((book) => {
                          const isActive = mapBook?.tag === book.tag;
                          return (
                            <button
                              key={book.tag}
                              onClick={() => { setMapBook(book); setMapStep('chapter'); }}
                              className={`w-full h-10 rounded-2xl shadow-sm transition-all duration-150 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                isActive
                                  ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-400/30 hover:bg-blue-100 dark:hover:bg-blue-500/20'
                                  : 'bg-white/80 dark:bg-neutral-800/80 ring-1 ring-black/5 dark:ring-white/10 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 text-neutral-700 dark:text-neutral-200 focus:ring-blue-200 dark:focus:ring-blue-500/40'
                              }`}
                              data-testid={`button-map-book-${book.tag}`}
                            >
                              <span className="drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] dark:drop-shadow-[0_1px_0_rgba(0,0,0,0.3)]">
                                {book.tag}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                  {(mapTestament === 'all' || mapTestament === 'NT') && (
                    <>
                      <div className="text-[11px] uppercase tracking-wide text-neutral-500 dark:text-neutral-400 mb-2 px-1">
                        New Testament
                      </div>
                      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-11 gap-2 w-full">
                        {filteredBooks.filter(b => b.testament === 'NT').map((book) => {
                          const isActive = mapBook?.tag === book.tag;
                          return (
                            <button
                              key={book.tag}
                              onClick={() => { setMapBook(book); setMapStep('chapter'); }}
                              className={`w-full h-10 rounded-2xl shadow-sm transition-all duration-150 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                isActive
                                  ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-400/30 hover:bg-blue-100 dark:hover:bg-blue-500/20'
                                  : 'bg-white/80 dark:bg-neutral-800/80 ring-1 ring-black/5 dark:ring-white/10 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 text-neutral-700 dark:text-neutral-200 focus:ring-blue-200 dark:focus:ring-blue-500/40'
                              }`}
                              data-testid={`button-map-book-${book.tag}`}
                            >
                              <span className="drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] dark:drop-shadow-[0_1px_0_rgba(0,0,0,0.3)]">
                                {book.tag}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </>
            )}

            {mapStep === 'chapter' && mapBook && (
              <>
                <button
                  onClick={() => setMapStep('book')}
                  className="mb-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  data-testid="button-back-to-books"
                >
                  ← Back to books
                </button>
                <h4 className="text-sm font-semibold mb-3">{mapBook.name} - Select Chapter</h4>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[50vh] overflow-y-auto overflow-x-hidden pb-2 w-full">
                  {Array.from({ length: mapBook.chapters }, (_, i) => i + 1).map((ch) => {
                    const isActive = mapChapter === ch;
                    return (
                      <button
                        key={ch}
                        onClick={() => { setMapChapter(ch); setMapStep('verse'); }}
                        className={`w-full h-10 rounded-2xl shadow-sm transition-all duration-150 text-[13px] font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          isActive
                            ? 'bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 ring-1 ring-blue-200 dark:ring-blue-400/30 hover:bg-blue-100 dark:hover:bg-blue-500/20'
                            : 'bg-white/80 dark:bg-neutral-800/80 ring-1 ring-black/5 dark:ring-white/10 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 text-neutral-700 dark:text-neutral-200 focus:ring-blue-200 dark:focus:ring-blue-500/40'
                        }`}
                        data-testid={`button-map-chapter-${ch}`}
                      >
                        <span className="drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] dark:drop-shadow-[0_1px_0_rgba(0,0,0,0.3)]">
                          {ch}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {mapStep === 'verse' && mapBook && (
              <>
                <button
                  onClick={() => setMapStep('chapter')}
                  className="mb-2 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                  data-testid="button-back-to-chapters"
                >
                  ← Back to chapters
                </button>
                <h4 className="text-sm font-semibold mb-3">{mapBook.name} {mapChapter} - Select Verse</h4>
                <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2 max-h-[50vh] overflow-y-auto overflow-x-hidden pb-2 w-full">
                  {Array.from({ length: getVerseCount(mapBook.tag, mapChapter) || 1 }, (_, i) => i + 1).map((v) => (
                    <button
                      key={v}
                      onClick={() => {
                        const key = `${mapBook.tag}.${mapChapter}:${v}`;
                        handleMapVerseSelect(key);
                      }}
                      className="w-full h-10 rounded-2xl bg-white/80 dark:bg-neutral-800/80 shadow-sm ring-1 ring-black/5 dark:ring-white/10 hover:bg-white dark:hover:bg-neutral-800 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all duration-150 text-[13px] font-medium text-neutral-700 dark:text-neutral-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-200 dark:focus:ring-blue-500/40"
                      data-testid={`button-map-verse-${v}`}
                    >
                      <span className="drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] dark:drop-shadow-[0_1px_0_rgba(0,0,0,0.3)]">
                        {v}
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

type WheelPickerProps = {
  items: Array<{ value: number; label: string }>;
  selectedIdx: number;
  onSelect: (idx: number) => void;
  label: string;
  'data-testid'?: string;
};

const WheelPicker = forwardRef<HTMLDivElement, WheelPickerProps>(
  ({ items, selectedIdx, onSelect, label, 'data-testid': testId }, ref) => {
    const scrollTimeoutRef = useRef<number | null>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = e.currentTarget.scrollTop;
      const itemHeight = 40;
      const newIdx = Math.round(scrollTop / itemHeight);
      
      if (newIdx !== selectedIdx && newIdx >= 0 && newIdx < items.length) {
        onSelect(newIdx);
      }

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = window.setTimeout(() => {
        if (ref && 'current' in ref && ref.current) {
          const finalIdx = Math.round(ref.current.scrollTop / itemHeight);
          ref.current.scrollTo({ top: finalIdx * itemHeight, behavior: 'smooth' });
        }
      }, 150);
    };

    return (
      <div className="flex flex-col">
        <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 text-center">{label}</label>
        <div className="relative h-[160px] overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
          <div className="absolute inset-x-0 top-[60px] h-[40px] border-y-2 border-blue-500 pointer-events-none z-10" />
          <div
            ref={ref}
            onScroll={handleScroll}
            className="h-full overflow-y-scroll scrollbar-hide"
            style={{ scrollbarWidth: 'none' }}
            data-testid={testId}
          >
            <div className="h-[60px]" />
            {items.map((item, idx) => (
              <div
                key={item.value}
                onClick={() => {
                  onSelect(idx);
                  if (ref && 'current' in ref && ref.current) {
                    ref.current.scrollTo({ top: idx * 40, behavior: 'smooth' });
                  }
                }}
                className={`h-[40px] flex items-center justify-center text-sm font-medium cursor-pointer transition ${
                  idx === selectedIdx
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-gray-600 dark:text-gray-400'
                }`}
                data-testid={`${testId}-item-${item.value}`}
              >
                {item.label}
              </div>
            ))}
            <div className="h-[60px]" />
          </div>
        </div>
      </div>
    );
  }
);

WheelPicker.displayName = 'WheelPicker';
