// Tutorial system types
export type Side = 'right' | 'left' | 'bottom' | 'top' | 'center';

export type TargetSpec = {
  // Either a selector string, or a map of media query → selector, or a custom finder.
  selector?: string | Record<string, string>;
  find?: () => HTMLElement | null;
  waitMs?: number;               // wait for element to appear (SPA/async UIs)
  optional?: boolean;            // if not found, still show step (centered)
  scroll?: 'none' | 'center' | 'nearest';
};

export type Step = {
  id: string;
  title: string;
  bullets?: string[];            // shown as slide bullets between < ... >
  html?: string;                 // if you want rich content instead of bullets
  target: TargetSpec;
  prefer?: Side[];               // placement order
  when?: () => boolean;          // conditional step
  advanceOn?: { selector: string; event: string }[]; // auto-advance triggers
};

export type Tutorial = {
  id: string;
  version: number;               // bump to invalidate old completions
  steps: Step[];
  onComplete?: () => void;
};