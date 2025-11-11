import { useEffect, useMemo, useRef, useState, forwardRef } from "react";
import { X, Map as MapIcon, ListOrdered, ArrowLeft } from "lucide-react";

export type Testament = "OT" | "NT";

export type BookMeta = {
  tag: string;
  name: string;
  testament: Testament;
  chapters: number;
};

export type BiblePickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onBack?: () => void;
  books: BookMeta[];
  getVerseCount: (bookTag: string, chapter: number) => number;
  onSelectVerseKey: (key: string) => void;
  getPreviewText?: (key: string) => string | undefined;
  initialTab?: "map" | "scroller";
};

export default function BiblePicker({
  isOpen,
  onClose,
  onBack,
  books,
  getVerseCount,
  onSelectVerseKey,
  getPreviewText,
  initialTab = "scroller"
}: BiblePickerProps) {
  const [tab, setTab] = useState<"map" | "scroller">(initialTab);
  
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
    }
  }, [isOpen, initialTab]);
  const [bookIdx, setBookIdx] = useState(0);
  const [chapterIdx, setChapterIdx] = useState(0);
  const [verseIdx, setVerseIdx] = useState(0);

  useEffect(() => {
    const b = books[bookIdx];
    if (!b) { setBookIdx(0); setChapterIdx(0); setVerseIdx(0); return; }
    if (chapterIdx >= b.chapters) setChapterIdx(0);
    const verses = getVerseCount(b.tag, chapterIdx + 1) || 1;
    if (verseIdx >= verses) setVerseIdx(0);
  }, [books, bookIdx, chapterIdx, verseIdx, getVerseCount]);

  const currentBook = books[bookIdx];
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

  const bookRef = useRef<HTMLDivElement>(null);
  const chapterRef = useRef<HTMLDivElement>(null);
  const verseRef = useRef<HTMLDivElement>(null);


  const [mapStep, setMapStep] = useState<'book' | 'chapter' | 'verse'>('book');
  const [mapBook, setMapBook] = useState<BookMeta | null>(null);
  const [mapChapter, setMapChapter] = useState(1);
  const [mapTestament, setMapTestament] = useState<'all' | Testament>('all');
  const [mapSearch, setMapSearch] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [capturedMaxHeight, setCapturedMaxHeight] = useState<number | null>(null);
  const [initialViewportHeight, setInitialViewportHeight] = useState<number | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile || !isOpen) {
      setCapturedMaxHeight(null);
      setInitialViewportHeight(null);
      return;
    }

    const vvh = window.visualViewport?.height || window.innerHeight;
    setInitialViewportHeight(vvh);
    setCapturedMaxHeight(Math.min(vvh * 0.9, 600));

    if (!window.visualViewport) return;

    const handleViewportResize = () => {
      const currentHeight = window.visualViewport!.height;
      if (currentHeight > (initialViewportHeight || vvh)) {
        const newVvh = currentHeight;
        setInitialViewportHeight(newVvh);
        setCapturedMaxHeight(Math.min(newVvh * 0.9, 600));
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportResize);
    return () => window.visualViewport?.removeEventListener('resize', handleViewportResize);
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (isOpen && tab === 'map') {
      setMapBook(currentBook);
      setMapChapter(currentChapter);
    }
  }, [isOpen, tab, currentBook, currentChapter]);

  const filteredBooks = useMemo(() => {
    let list = books;
    if (mapTestament !== 'all') list = list.filter(b => b.testament === mapTestament);
    if (mapSearch) list = list.filter(b => b.name.toLowerCase().includes(mapSearch.toLowerCase()));
    return list;
  }, [books, mapTestament, mapSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center" data-testid="bible-picker-overlay">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onBack || onClose} />
      
      <div 
        className={`relative w-[min(720px,92vw)] overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-zinc-900 shadow-2xl ${
          !isMobile && 'max-h-[80vh]'
        }`}
        style={isMobile && capturedMaxHeight ? { maxHeight: `${capturedMaxHeight}px` } : undefined}
      >
        <header className="flex items-center gap-2 p-2 border-b border-gray-200 dark:border-gray-700">
          {onBack && (
            <button
              onClick={onBack}
              aria-label="Back to Search"
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              data-testid="button-back-picker"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            data-testid="button-close-picker"
          >
            <X className="w-4 h-4" />
          </button>
          <h3 className="text-sm font-semibold">Bible Navigation</h3>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setTab('map')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                tab === 'map' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              data-testid="button-tab-map"
            >
              <MapIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTab('scroller')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                tab === 'scroller' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
              data-testid="button-tab-scroller"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
          </div>
        </header>

        {tab === 'scroller' && (
          <div className="p-4">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <WheelPicker
                ref={bookRef}
                items={books.map((b, i) => ({ value: i, label: b.name }))}
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
              {getPreviewText && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                  {getPreviewText(debouncedKey)}
                </div>
              )}
              <button
                onClick={() => {
                  if (currentKey) {
                    onSelectVerseKey(currentKey);
                    onClose();
                  }
                }}
                className="px-5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition"
                data-testid="button-scroller-go"
              >
                Go to Verse
              </button>
            </div>
          </div>
        )}

        {tab === 'map' && (
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
                        onSelectVerseKey(key);
                        onClose();
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
      </div>
    </div>
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
