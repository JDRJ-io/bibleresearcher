
import type { LabelName } from './labelsCache';

export function debugLabelMatching(
  text: string,
  labelData: Record<LabelName, string[]>,
  activeLabels: LabelName[]
): void {
  console.log('🏷️ Debug Label Matching:');
  console.log('Text:', text);
  console.log('Active labels:', activeLabels);
  
  activeLabels.forEach(label => {
    const phrases = labelData[label] || [];
    console.log(`\n${label}:`, phrases);
    
    phrases.forEach(phrase => {
      if (!phrase) return;
      
      const esc = phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\W+');
      const re = new RegExp(esc, 'gi');
      let m: RegExpExecArray | null;
      const matches: { start: number; end: number; match: string }[] = [];
      
      while ((m = re.exec(text))) {
        matches.push({
          start: m.index,
          end: m.index + m[0].length,
          match: m[0]
        });
      }
      
      if (matches.length > 0) {
        console.log(`  "${phrase}" matches:`, matches);
      }
    });
  });
}
