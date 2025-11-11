import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Heart, HelpCircle, Mail, Users, DollarSign, Scale, Shield, FileText, Trash2, Code, BookOpen, Bell, Lock } from 'lucide-react';
import { availableDocuments, DocumentKey } from '../utils/documentLoader';

interface DocumentMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument: (key: DocumentKey) => void;
}

export const DocumentMenu: React.FC<DocumentMenuProps> = ({
  isOpen,
  onClose,
  onSelectDocument
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handlePointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        onClose();
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        const touch = e.touches[0];
        touchStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          time: Date.now()
        };
      } else {
        touchStartRef.current = null;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        const touch = e.changedTouches[0];
        const deltaX = Math.abs(touch.clientX - touchStartRef.current.x);
        const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
        const deltaTime = Date.now() - touchStartRef.current.time;

        const wasScrollGesture = deltaX > 10 || deltaY > 10;
        const wasQuickTap = deltaTime < 500;

        if (!wasScrollGesture && wasQuickTap) {
          onClose();
        }
      }

      touchStartRef.current = null;
    };

    // Prevent body scrolling when menu is open
    document.body.style.overflow = 'hidden';

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.body.style.overflow = '';
      touchStartRef.current = null;
    };
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === backdropRef.current) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const documentCategories = {
    about: {
      title: 'About & Support',
      icon: Heart,
      docs: [
        { key: 'mission' as DocumentKey, icon: Heart },
        { key: 'contact' as DocumentKey, icon: Mail },
        { key: 'support' as DocumentKey, icon: HelpCircle },
        { key: 'patch-notes' as DocumentKey, icon: Bell },
        { key: 'acknowledgments' as DocumentKey, icon: BookOpen },
        { key: 'accessibility' as DocumentKey, icon: Users }
      ]
    },
    legal: {
      title: 'Legal & Privacy',
      icon: Shield,
      docs: [
        { key: 'tos' as DocumentKey, icon: FileText },
        { key: 'privacy' as DocumentKey, icon: Lock },
        { key: 'policies' as DocumentKey, icon: Scale },
        { key: 'cookies' as DocumentKey, icon: FileText },
        { key: 'disclaimer' as DocumentKey, icon: FileText },
        { key: 'dmca' as DocumentKey, icon: Shield },
        { key: 'safety' as DocumentKey, icon: Shield },
        { key: 'licenses' as DocumentKey, icon: Code },
        { key: 'delete-account' as DocumentKey, icon: Trash2 }
      ]
    },
    community: {
      title: 'Community & Giving',
      icon: Users,
      docs: [
        { key: 'community' as DocumentKey, icon: Users },
        { key: 'donate' as DocumentKey, icon: Heart },
        { key: 'pricing' as DocumentKey, icon: DollarSign },
        { key: 'contributor' as DocumentKey, icon: Code }
      ]
    }
  };

  return createPortal(
    <div 
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-start pb-[max(1rem,calc(env(safe-area-inset-bottom)+1rem))] pl-[max(1rem,calc(env(safe-area-inset-left)+1rem))]"
      onClick={handleBackdropClick}
      data-testid="menu-backdrop"
    >
      <div 
        ref={menuRef}
        className="w-80 max-w-[calc(100vw-2rem)] bg-white/80 dark:bg-black/80 backdrop-blur-xl backdrop-saturate-150 border border-white/20 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] rounded-t-lg overflow-hidden animate-in slide-in-from-bottom-4 duration-300 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
        data-testid="document-menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-border bg-card/50 flex-shrink-0">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">All Documents</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="button-close-document-menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-3 sm:p-4 menu-scrollable document-menu-landscape flex-1">
          <div className="space-y-5">
            {Object.entries(documentCategories).map(([categoryKey, category]) => {
              const CategoryIcon = category.icon;
              return (
                <div key={categoryKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <CategoryIcon className="w-4 h-4 text-foreground/60" />
                    <h4 className="text-sm font-semibold text-foreground">{category.title}</h4>
                  </div>
                  <div className="space-y-1.5 pl-6">
                    {category.docs.map(({ key, icon }) => {
                      const doc = availableDocuments[key];
                      if (!doc) return null;
                      
                      const DocIcon = icon;
                      
                      return (
                        <button
                          key={key}
                          onClick={() => {
                            onSelectDocument(key);
                            onClose();
                          }}
                          className="flex items-center gap-2.5 w-full p-2 rounded-md hover:bg-accent/50 transition-colors text-left group"
                        >
                          <DocIcon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
                          <span className="text-sm text-foreground/80 group-hover:text-foreground transition-colors">{doc.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-border bg-card/30 flex-shrink-0">
          <p className="text-xs text-muted-foreground text-center">
            Click any document to read it, or press Escape to close
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};