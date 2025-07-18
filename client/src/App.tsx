import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/bible/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import BiblePage from "@/pages/bible";
import AuthCallback from "@/pages/auth/callback";
import NotFound from "@/pages/not-found";
import { create } from 'zustand';

// Inlined BibleDataProvider - Bible Store
interface TranslationState {
  main: string;
  alternates: string[];
  setMain: (id: string) => void;
  toggleAlternate: (id: string) => void;
  clearAlternates: (id: string) => void;
  columnKeys: string[];
}

export const useBibleStore = create<{
  translations: Record<string, Map<number, string>>;
  actives: string[];
  translationState: TranslationState;
  setActives: (ids: string[]) => void;
  setTranslations: (id: string, data: Map<number, string>) => void;
  getAllActive: () => string[];
  crossRefs: Record<string, string[]>;
  prophecies: Record<string, any>;
  store: any;
  showCrossRefs: boolean;
  showProphecies: boolean;
  toggleCrossRefs: () => void;
  toggleProphecies: () => void;
}>((set, get) => ({
      translations: {},
      actives: ["KJV"],
      crossRefs: {},
      prophecies: {},
      store: { crossRefs: {}, prophecies: {} },
      showCrossRefs: true,  // Default ON for free users (optimal mobile display)
      showProphecies: false, // Default OFF for free users (cleaner mobile)
      toggleCrossRefs: () => set(state => ({ showCrossRefs: !state.showCrossRefs })),
      toggleProphecies: () => set(state => ({ showProphecies: !state.showProphecies })),
      translationState: {
        main: "KJV",
        alternates: [],
        setMain: (id: string) => set(state => {
          if (id === state.translationState.main) return state;
          
          const currentMain = state.translationState.main;
          const currentAlternates = state.translationState.alternates;
          const newAlts = currentAlternates.filter(t => t !== id);
          const finalAlternates = currentMain && currentMain !== id 
            ? Array.from(new Set([...newAlts, currentMain]))
            : newAlts;
          const columnKeys = Array.from(new Set([...finalAlternates, id]));
          
          return {
            translationState: {
              ...state.translationState,
              main: id,
              alternates: finalAlternates,
              columnKeys
            }
          };
        }),
        toggleAlternate: (id: string) => set(state => {
          if (id === state.translationState.main) return state;
          
          const currentAlternates = state.translationState.alternates;
          const has = currentAlternates.includes(id);
          const newAlternates = has 
            ? currentAlternates.filter(t => t !== id)
            : Array.from(new Set([...currentAlternates, id]));
          const columnKeys = Array.from(new Set([...newAlternates, state.translationState.main]));
          
          return {
            translationState: {
              ...state.translationState,
              alternates: newAlternates,
              columnKeys
            }
          };
        }),
        clearAlternates: (id: string) => set(state => {
          return {
            translationState: {
              ...state.translationState,
              alternates: [],
              columnKeys: [state.translationState.main]
            }
          };
        }),
        columnKeys: []
      },
      setActives: (ids) => set({ actives: ids }),
      setTranslations: (id, data) => {
        set(s => ({ translations: { ...s.translations, [id]: data } }));
      },
      getAllActive: () => {
        const state = get();
        return [...state.translationState.alternates, state.translationState.main];
      }
    }));

function Router() {
  return (
    <Switch>
      <Route path="/" component={BiblePage} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
