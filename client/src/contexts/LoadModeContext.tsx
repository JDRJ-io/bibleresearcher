// LoadModeContext.tsx - Global load mode switch for performance optimization
import React, { createContext, useContext, useState } from 'react';

export type LoadMode = 'Full' | 'KeysOnly';

interface LoadModeContextType {
  mode: LoadMode;
  setMode: (mode: LoadMode) => void;
}

const LoadModeContext = createContext<LoadModeContextType>({
  mode: 'Full',
  setMode: () => {}
});

export function LoadModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<LoadMode>('Full');
  
  return (
    <LoadModeContext.Provider value={{ mode, setMode }}>
      {children}
    </LoadModeContext.Provider>
  );
}

export function useLoadMode() {
  const context = useContext(LoadModeContext);
  if (!context) {
    throw new Error('useLoadMode must be used within a LoadModeProvider');
  }
  return context;
}