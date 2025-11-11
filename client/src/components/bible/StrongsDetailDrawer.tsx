import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X, Languages, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';

interface StrongsWord {
  original: string;
  transliteration: string;
  strongs: string;
  definition: string;
  pronunciation: string;
}

interface StrongsDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedWord: StrongsWord | null;
  onNavigateToVerse: (verseRef: string) => void;
  relatedVerses: string[];
}

export function StrongsDetailDrawer({
  isOpen,
  onClose,
  selectedWord,
  onNavigateToVerse,
  relatedVerses
}: StrongsDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<'definition' | 'verses'>('definition');

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Languages className="w-6 h-6 text-blue-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedWord?.original || 'Strong\'s Concordance'}
                  </h2>
                  {selectedWord && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {selectedWord.strongs} • {selectedWord.transliteration}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 rounded-full p-0"
                onClick={onClose}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {selectedWord && (
              <>
                {/* Tab Navigation */}
                <div className="flex border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveTab('definition')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'definition'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Definition
                  </button>
                  <button
                    onClick={() => setActiveTab('verses')}
                    className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
                      activeTab === 'verses'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    Related Verses ({relatedVerses.length})
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'definition' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-6"
                    >
                      {/* Original Word Display */}
                      <div className="text-center p-6 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="text-3xl font-hebrew mb-2 text-gray-900 dark:text-white">
                          {selectedWord.original}
                        </div>
                        <div className="text-lg text-gray-600 dark:text-gray-300 mb-1">
                          {selectedWord.transliteration}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Pronunciation: {selectedWord.pronunciation}
                        </div>
                        <Badge variant="outline" className="mt-2">
                          {selectedWord.strongs}
                        </Badge>
                      </div>

                      {/* Definition */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-white">
                          Definition
                        </h3>
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {selectedWord.definition}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'verses' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Verses containing "{selectedWord.strongs}"
                      </h3>
                      <ScrollArea className="h-64">
                        <div className="space-y-2">
                          {relatedVerses.map((verseRef, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                onNavigateToVerse(verseRef);
                                onClose();
                              }}
                              className="w-full text-left p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-blue-600 dark:text-blue-400">
                                  {verseRef}
                                </span>
                                <ExternalLink className="w-4 h-4 text-gray-400" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}