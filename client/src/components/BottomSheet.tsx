import React, { useEffect, useRef } from "react";

type BottomSheetProps = {
  isOpen: boolean;
  title?: string;
  onClose: () => void;
  children: React.ReactNode;
};

export default function BottomSheet({ isOpen, title, onClose, children }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number | null>(null);
  const currentY = useRef<number>(0);

  // lock background scroll
  useEffect(() => {
    if (!isOpen) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [isOpen]);

  // esc to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  // simple drag-to-close
  const onTouchStart: React.TouchEventHandler = (e) => { startY.current = e.touches[0].clientY; };
  const onTouchMove: React.TouchEventHandler = (e) => {
    if (startY.current == null || !sheetRef.current) return;
    currentY.current = Math.max(0, e.touches[0].clientY - startY.current);
    sheetRef.current.style.transform = `translateY(${currentY.current}px)`;
  };
  const onTouchEnd: React.TouchEventHandler = () => {
    if (!sheetRef.current) return;
    const shouldClose = currentY.current > 80;
    sheetRef.current.style.transform = "";
    startY.current = null;
    currentY.current = 0;
    if (shouldClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div aria-modal="true" role="dialog" className="bs-overlay" onClick={onClose}>
      <div
        ref={sheetRef}
        className="bs-sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="bs-grabber" aria-hidden />
        {title && <h3 className="bs-title">{title}</h3>}
        <div className="bs-content menu-scrollable">{children}</div>
      </div>
    </div>
  );
}