import { z } from 'zod';

export const PresetDataSchema = z.object({
  last_verse_key: z.string().optional(),
  showNotes: z.boolean().optional(),
  showCrossRefs: z.boolean().optional(),
  showProphecies: z.boolean().optional(),
  showDates: z.boolean().optional(),
  showContext: z.boolean().optional(),
  showHybrid: z.boolean().optional(),
  isChronological: z.boolean().optional(),
  unlockMode: z.boolean().optional(),
  mainTranslation: z.string().optional(),
  alternateTranslations: z.array(z.string()).optional(),
  activeLabels: z.array(z.string()).optional(),
  sizeMult: z.number().optional(),
  textSizeMult: z.number().optional(),
  externalSizeMult: z.number().optional(),
  unifiedSizing: z.boolean().optional(),
  theme: z.string().optional(),
  columnDisplayOrder: z.array(z.number()).optional(),
  alignmentLockMode: z.enum(['auto', 'centeredLocked', 'leftLocked']).optional(),
}).passthrough();

export type PresetData = z.infer<typeof PresetDataSchema>;

export function validatePresetData(data: unknown): PresetData {
  const result = PresetDataSchema.safeParse(data);
  if (!result.success) {
    console.warn('Invalid preset data, using safe defaults:', result.error);
    return {};
  }
  return result.data;
}
