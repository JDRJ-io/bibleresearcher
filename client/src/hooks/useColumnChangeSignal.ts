
import { useEffect, useCallback } from 'react';

// Custom event for column changes
const COLUMN_CHANGE_EVENT = 'columnLayoutChanged';

// Global event dispatcher for column changes
class ColumnChangeSignal {
  private static instance: ColumnChangeSignal;
  private eventTarget: EventTarget;

  private constructor() {
    this.eventTarget = new EventTarget();
  }

  static getInstance(): ColumnChangeSignal {
    if (!ColumnChangeSignal.instance) {
      ColumnChangeSignal.instance = new ColumnChangeSignal();
    }
    return ColumnChangeSignal.instance;
  }

  // Emit column change signal
  emit(changeType: 'width' | 'visibility' | 'order' | 'multiplier', data?: any) {
    this.eventTarget.dispatchEvent(new CustomEvent(COLUMN_CHANGE_EVENT, {
      detail: { changeType, data, timestamp: Date.now() }
    }));
  }

  // Listen to column changes
  listen(callback: (detail: any) => void): () => void {
    const handler = (event: Event) => {
      const customEvent = event as CustomEvent;
      callback(customEvent.detail);
    };

    this.eventTarget.addEventListener(COLUMN_CHANGE_EVENT, handler);
    
    // Return cleanup function
    return () => {
      this.eventTarget.removeEventListener(COLUMN_CHANGE_EVENT, handler);
    };
  }
}

// Hook for listening to column changes
export function useColumnChangeSignal(callback: (detail: any) => void) {
  const signal = ColumnChangeSignal.getInstance();

  useEffect(() => {
    const cleanup = signal.listen(callback);
    return cleanup;
  }, [callback]);
}

// Hook for emitting column changes
export function useColumnChangeEmitter() {
  const signal = ColumnChangeSignal.getInstance();

  return useCallback((changeType: 'width' | 'visibility' | 'order' | 'multiplier', data?: any) => {
    signal.emit(changeType, data);
  }, [signal]);
}
