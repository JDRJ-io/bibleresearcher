// useSmartScroll.ts - Smart scroll controller with keys-only mode and tooltip
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLoadMode } from '../contexts/LoadModeContext';
import { centerIndexFromScroll } from '../utils/centerAnchor';

interface UseSmartScrollProps {
  scrollRef: React.RefObject<HTMLDivElement>;
  trackRef: React.RefObject<HTMLDivElement>;
  thumbRef: React.RefObject<HTMLDivElement>;
  rowHeight: number;
  totalRows: number;
  indexToKey: (index: number) => string;
}

export function useSmartScroll({
  scrollRef,
  trackRef,
  thumbRef,
  rowHeight,
  totalRows,
  indexToKey,
}: UseSmartScrollProps) {
  const { setMode } = useLoadMode();
  const [dragging, setDragging] = useState(false);
  const [centerKey, setCenterKey] = useState<string>('');
  const [tooltipY, setTooltipY] = useState<number>(0);
  
  const idleTimer = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  // Switch to KeysOnly mode while user is actively scrolling/dragging
  const enterKeysOnly = useCallback(() => {
    setMode('KeysOnly');
    setDragging(true);
    if (idleTimer.current) {
      window.clearTimeout(idleTimer.current);
      idleTimer.current = null;
    }
  }, [setMode]);

  // Schedule exit from KeysOnly mode with debounce
  const scheduleExit = useCallback(() => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    idleTimer.current = window.setTimeout(() => {
      setDragging(false);
      setMode('Full');
    }, 180); // Small grace period to avoid flapping
  }, [setMode]);

  // Handle pointer events on custom scrollbar track/thumb
  useEffect(() => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;

    const onPointerDown = () => enterKeysOnly();
    const onPointerUp = () => scheduleExit();

    track.addEventListener('pointerdown', onPointerDown);
    thumb.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      track.removeEventListener('pointerdown', onPointerDown);
      thumb.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [trackRef, thumbRef, enterKeysOnly, scheduleExit]);

  // Handle scroll events - compute center index and tooltip position
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onScroll = () => {
      enterKeysOnly(); // Any active scroll kicks into keys-only briefly
      
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        const centerIndex = centerIndexFromScroll({
          scrollTop: el.scrollTop,
          viewportHeight: el.clientHeight,
          rowHeight,
          totalRows,
        });
        
        setCenterKey(indexToKey(centerIndex));
        
        // Position tooltip near viewport center
        const rect = el.getBoundingClientRect();
        const centerY = rect.top + rect.height / 2;
        setTooltipY(centerY);
        
        scheduleExit();
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [scrollRef, rowHeight, totalRows, indexToKey, enterKeysOnly, scheduleExit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { dragging, centerKey, tooltipY };
}