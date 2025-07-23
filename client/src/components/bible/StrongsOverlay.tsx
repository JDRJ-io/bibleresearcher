import { useState, useEffect } from 'react';
import type { BibleVerse, StrongsWord } from '@/types/bible';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { strongsService, type StrongsOccurrence, type InterlinearCell } from '@/lib/strongsService';
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Languages, Search, ExternalLink } from "lucide-react";
import { useStrongsWorker } from "@/hooks/useStrongsWorker";

interface StrongsOverlayProps {
  verse: BibleVerse | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToVerse?: (reference: string) => void;
}

export function StrongsOverlay({ verse, isOpen, onClose, onNavigateToVerse }: StrongsOverlayProps) {
  const [strongsWords, setStrongsWords] = useState<StrongsWord[]>([]);
  const [selectedWord, setSelectedWord] = useState<StrongsWord | null>(null);
  const [loading, setLoading] = useState(false);

  // New state for Range request data
  const [interlinearCells, setInterlinearCells] = useState<InterlinearCell[]>([]);
  const [selectedOccurrences, setSelectedOccurrences] = useState<StrongsOccurrence[]>([]);

  const loadStrongsData = async (verse: BibleVerse) => {
    setLoading(true);
    try {
      // Use new Range request system exclusively
      console.log(`🔍 Loading Strong's data via new Range system for ${verse.reference}`);
      
      // Try different reference formats that might exist in the offset files
      const referenceFormats = [
        verse.reference,                    // Original format
        verse.reference.replace(/\s/g, '.'), // "Gen 1:3" -> "Gen.1:3"
        verse.reference.replace(/\./g, ' '), // "Gen.1:3" -> "Gen 1:3"
        verse.reference.replace(/\s+/g, '.'), // Handle multiple spaces
        // Also try with book abbreviations
        verse.reference.replace('Genesis', 'Gen').replace(/\s/g, '.'),
        verse.reference.replace('Gen ', 'Gen.'),
      ];
      
      let verseData = null;
      for (const refFormat of referenceFormats) {
        verseData = await strongsService.getVerseStrongsData(refFormat);
        if (verseData && verseData.words.length > 0) {
          console.log(`✅ Found Strong's data using format: ${refFormat}`);
          break;
        }
      }

      if (verseData && verseData.words.length > 0) {
        setStrongsWords(verseData.words);
        setInterlinearCells(verseData.interlinearCells);
        console.log(`✅ Loaded ${verseData.words.length} Strong's words for ${verse.reference}`);
      } else {
        console.log(`❌ No Strong's data found for ${verse.reference} in any format`);
        setStrongsWords([]);
        setInterlinearCells([]);
      }
    } catch (error) {
      console.error('Error loading Strong\'s data:', error);
      setStrongsWords([]);
      setInterlinearCells([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (verse) {
      loadStrongsData(verse);
    }
  }, [verse]);

  const handleWordClick = async (word: StrongsWord) => {
    const isCurrentlySelected = selectedWord?.strongs === word.strongs;
    setSelectedWord(isCurrentlySelected ? null : word);

    if (!isCurrentlySelected) {
      // Load all occurrences for this Strong's number
      try {
        console.log(`🔍 Loading occurrences for Strong's ${word.strongs}`);
        const occurrences = await strongsService.getStrongsOccurrences(word.strongs);
        setSelectedOccurrences(occurrences);
        console.log(`✅ Loaded ${occurrences.length} occurrences for Strong's ${word.strongs}`);
      } catch (error) {
        console.error(`❌ Error loading occurrences for ${word.strongs}:`, error);
        setSelectedOccurrences([]);
      }
    } else {
      setSelectedOccurrences([]);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 w-1/2">
              <h2 className="text-lg font-semibold mb-4">
                Strong's Concordance
              </h2>
              {loading ? (
                <div>Loading...</div>
              ) : (
                <div className="flex-1">
                  {/* Interlinear cells grid */}
                  {interlinearCells.length > 0 && (
                    <div className="mb-6">
                      <h3 className="text-sm font-medium mb-3">Hebrew/Greek Interlinear</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mb-4">
                        {interlinearCells.map((cell, index) => (
                          <div
                            key={index}
                            className="p-2 border rounded text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                            onClick={async () => {
                              const word: StrongsWord = {
                                original: cell.original,
                                strongs: cell.strongsKey,
                                transliteration: cell.transliteration,
                                definition: cell.gloss,
                                instances: [],
                                morphology: cell.morphology
                              };
                              await handleWordClick(word);
                            }}
                          >
                            <div className="font-semibold text-lg">{cell.original}</div>
                            <div className="text-xs text-muted-foreground italic">{cell.transliteration}</div>
                            <div className="text-xs">{cell.gloss}</div>
                            <Badge variant="outline" className="text-xs mt-1">
                              {cell.strongsKey}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      <Separator />
                    </div>
                  )}

                  {/* Strong's words list */}
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-4">
                      {strongsWords.map((word, index) => (
                        <div
                          key={`${word.strongs}-${index}`}
                          className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                            selectedWord?.strongs === word.strongs
                              ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => handleWordClick(word)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {word.strongs}
                            </Badge>
                            <span className="font-semibold text-lg">{word.original}</span>
                            <span className="text-muted-foreground italic">{word.transliteration}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{word.definition}</p>
                          {word.instances && word.instances.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              Appears in {word.instances.length} verse{word.instances.length !== 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
            {selectedWord && (
              <>
                <Separator orientation="vertical" className="mx-4" />
                <div className="flex-1">
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="font-mono">{selectedWord.strongs}</Badge>
                      <h3 className="text-lg font-semibold">{selectedWord.original}</h3>
                    </div>
                    <p className="text-muted-foreground italic mb-2">{selectedWord.transliteration}</p>
                    <p className="text-sm">{selectedWord.definition}</p>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <h4 className="text-sm font-medium mb-3">
                      Occurrences ({selectedOccurrences.length})
                    </h4>
                    <ScrollArea className="h-[300px]">
                      <div className="space-y-2">
                        {selectedOccurrences.length > 0 ? (
                          selectedOccurrences.map((occurrence, index) => (
                            <button
                              key={`${occurrence.reference}-${index}`}
                              onClick={() => onNavigateToVerse?.(occurrence.reference)}
                              className="block w-full text-left p-3 text-sm hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors border"
                            >
                              <div className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                {occurrence.reference}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {occurrence.original} • {occurrence.transliteration} • {occurrence.gloss}
                              </div>
                              {occurrence.context && (
                                <div className="text-xs text-muted-foreground mt-1 truncate">
                                  {occurrence.context}
                                </div>
                              )}
                            </button>
                          ))
                        ) : selectedWord ? (
                          <p className="text-sm text-muted-foreground italic">Loading occurrences...</p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">Select a word to see occurrences</p>
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}