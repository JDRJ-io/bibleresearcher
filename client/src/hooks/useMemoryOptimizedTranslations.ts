// Memory-optimized translation loading hook
// Prevents memory crashes by limiting simultaneous translation loads

import { useState, useEffect, useCallback } from 'react';
import { useMemoryMonitor } from '@/lib/memoryManager';

interface TranslationLoadQueue {
  id: string;
  priority: number;
  timestamp: number;
}

const MAX_SIMULTANEOUS_LOADS = {
  desktop: 4,
  mobile: 2,
  lowMemory: 1
};

export function useMemoryOptimizedTranslations() {
  const [loadingQueue, setLoadingQueue] = useState<TranslationLoadQueue[]>([]);
  const [activeLoads, setActiveLoads] = useState<Set<string>>(new Set());
  const { isLowMemory, deviceCapabilities } = useMemoryMonitor('TranslationLoader');
  
  const maxLoads = isLowMemory 
    ? MAX_SIMULTANEOUS_LOADS.lowMemory
    : deviceCapabilities.isLowMemoryDevice
      ? MAX_SIMULTANEOUS_LOADS.mobile
      : MAX_SIMULTANEOUS_LOADS.desktop;

  const addToQueue = useCallback((translationId: string, priority: number = 1) => {
    setLoadingQueue(prev => {
      const exists = prev.find(item => item.id === translationId);
      if (exists) return prev;
      
      return [...prev, {
        id: translationId,
        priority,
        timestamp: Date.now()
      }].sort((a, b) => b.priority - a.priority || a.timestamp - b.timestamp);
    });
  }, []);

  const removeFromQueue = useCallback((translationId: string) => {
    setLoadingQueue(prev => prev.filter(item => item.id !== translationId));
    setActiveLoads(prev => {
      const newSet = new Set(prev);
      newSet.delete(translationId);
      return newSet;
    });
  }, []);

  // Process queue when capacity is available
  useEffect(() => {
    if (activeLoads.size >= maxLoads || loadingQueue.length === 0) return;

    const nextItem = loadingQueue[0];
    if (nextItem && !activeLoads.has(nextItem.id)) {
      setActiveLoads(prev => new Set([...Array.from(prev), nextItem.id]));
      setLoadingQueue(prev => prev.slice(1));
      
      console.log(`📚 Starting translation load: ${nextItem.id} (${activeLoads.size + 1}/${maxLoads})`);
    }
  }, [loadingQueue, activeLoads, maxLoads]);

  const canLoadTranslation = useCallback(() => {
    return activeLoads.size < maxLoads;
  }, [activeLoads.size, maxLoads]);

  const getQueuePosition = useCallback((translationId: string) => {
    return loadingQueue.findIndex(item => item.id === translationId);
  }, [loadingQueue]);

  return {
    addToQueue,
    removeFromQueue,
    canLoadTranslation,
    getQueuePosition,
    queueLength: loadingQueue.length,
    activeLoads: activeLoads.size,
    maxLoads,
    isMemoryConstrained: isLowMemory
  };
}