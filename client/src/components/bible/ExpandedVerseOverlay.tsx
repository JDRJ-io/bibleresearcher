import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Languages, Link } from "lucide-react";
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { useBodyClass } from '@/hooks/useBodyClass';
import type { BibleVerse } from "@/types/bible";

interface ExpandedVerseOverlayProps {
  verse: BibleVerse | null;
  mainTranslation: string;
  onClose: () => void;
  onStrongsClick: (word: any) => void;
}

export function ExpandedVerseOverlay({
  verse,
  mainTranslation,
  onClose,
  onStrongsClick,
}: ExpandedVerseOverlayProps) {
  // Task 3.3: Add useBodyClass('overlay-open') toggle to lock background scroll
  useBodyClass('overlay-open', !!verse);

  if (!verse) return null;

  // Task 3.1: Wrap overlay component in createPortal(document.body)
  return createPortal(
    <motion.div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="rounded-2xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto"
        style={{ backgroundColor: "var(--header-bg)" }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.8, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="p-8 space-y-6">
          {/* Verse Header */}
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h2
                className="text-2xl font-bold"
                style={{ color: "var(--accent-color)" }}
              >
                {verse.reference}
              </h2>
              <p className="text-sm opacity-75 mt-1">{mainTranslation}</p>
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

          {/* Expanded Verse Text */}
          <div
            className="text-lg leading-relaxed"
            style={{ color: "var(--text-color)" }}
          >
            {verse.text[mainTranslation]}
          </div>

          {/* Strong's Words Section */}
          {verse.strongsWords && verse.strongsWords.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Languages
                  className="w-5 h-5 mr-2"
                  style={{ color: "var(--accent-color)" }}
                />
                Original Language Words
              </h3>

              <ScrollArea className="w-full">
                <div className="flex space-x-2 pb-2">
                  {verse.strongsWords.map((word, index) => (
                    <div
                      key={index}
                      className="flex-shrink-0 p-3 rounded-lg border cursor-pointer transition-all duration-200 hover:scale-105"
                      style={{
                        backgroundColor: "var(--column-bg)",
                        borderColor: "var(--border-color)",
                      }}
                      onClick={() => onStrongsClick(word)}
                    >
                      <div className="text-center space-y-1">
                        <div className="font-hebrew text-lg">
                          {word.original}
                        </div>
                        <div className="text-xs font-mono">{word.strongs}</div>
                        <div className="text-xs">{word.transliteration}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}

          {/* Cross References in Expanded View */}
          {verse.crossReferences && verse.crossReferences.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Link
                  className="w-5 h-5 mr-2"
                  style={{ color: "var(--accent-color)" }}
                />
                Cross References
              </h3>
              <div className="space-y-3">
                {verse.crossReferences.map((ref, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: "var(--column-bg)" }}
                  >
                    <div
                      className="font-medium text-sm mb-1"
                      style={{ color: "var(--accent-color)" }}
                    >
                      {ref.reference}
                    </div>
                    <div className="text-sm leading-relaxed">{ref.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
