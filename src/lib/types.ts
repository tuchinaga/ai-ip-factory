export type CategoryKey = string; // 'theme' | 'trait' | 'motif' | 将来追加分

export interface Category {
  id: string;
  key: CategoryKey;
  label: string;
  sort_order: number;
}

export interface WordItem {
  id: string;
  category_id: string;
  word: string;
  enabled: boolean;
}

export type SelectionMap = Record<CategoryKey, string>; // { theme: '環境破壊', trait: '泣き虫', motif: 'ネコ' }
export type LockMap = Record<CategoryKey, boolean>;

export type SeedStatus = "KEEP" | "MAYBE" | "KILL";

export const VISUAL_STYLES = [
  "DEFAULT",
  "MINIMAL",
  "CUTE",
  "ANIME",
  "PICTURE BOOK",
  "ART TOY",
  "3D",
  "HAND DRAWN",
] as const;
export type VisualStyle = (typeof VISUAL_STYLES)[number];

export interface CharacterConcept {
  name: string;
  concept: string;
  personality: string;
  world: string;
  philosophy: string;
  story_seed: string;
  visual_keywords: string;
}

export interface CharacterSeed {
  id: string;
  name: string;
  source_words: SelectionMap;
  combination_id: string | null;
  concept: string;
  personality: string;
  world: string;
  philosophy: string;
  story_seed: string;
  visual_keywords: string;
  visual_prompt: string;
  visual_style: VisualStyle;
  status: SeedStatus;
  memo: string;
  parent_seed_id: string | null;
  created_at: string;
  updated_at: string;
  images?: CharacterImage[];
}

export interface CharacterImage {
  id: string;
  seed_id: string;
  image_url: string;
  is_main: boolean;
  created_at: string;
}
