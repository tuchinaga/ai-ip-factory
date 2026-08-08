import { CharacterConcept, SelectionMap, VisualStyle } from "@/lib/types";
import { callClaude, parseJsonFromModelOutput } from "@/lib/ai/anthropic";
import {
  conceptGenerationPrompt,
  visualPromptGenerationPrompt,
  mutationGenerationPrompt,
  wordGenerationPrompt,
  NameStyle,
} from "@/lib/ai/prompts";

// AI Provider抽象化レイヤー。
// 現在はAnthropic Claudeを直接呼び出しているが、
// 将来OpenAI/Gemini等に差し替える場合はこのファイルの実装のみを変更すればよい。

export async function generateConcepts(
  selection: SelectionMap,
  nameStyle: NameStyle = "international"
): Promise<CharacterConcept[]> {
  const prompt = conceptGenerationPrompt(selection, nameStyle);
  const raw = await callClaude(prompt);
  return parseJsonFromModelOutput<CharacterConcept[]>(raw);
}

export async function generateVisualPrompt(params: {
  name: string;
  concept: string;
  personality: string;
  world: string;
  visualKeywords: string;
  style: VisualStyle;
}): Promise<string> {
  const prompt = visualPromptGenerationPrompt(params);
  const raw = await callClaude(prompt);
  return raw.trim();
}

export async function generateMutationCombinations(params: {
  lockedSelection: Partial<SelectionMap>;
  freeCategoryKeys: string[];
  wordPool: Record<string, string[]>;
  count?: number;
}): Promise<SelectionMap[]> {
  const prompt = mutationGenerationPrompt({
    lockedSelection: params.lockedSelection,
    freeCategoryKeys: params.freeCategoryKeys,
    wordPool: params.wordPool,
    count: params.count ?? 3,
  });
  const raw = await callClaude(prompt);
  return parseJsonFromModelOutput<SelectionMap[]>(raw);
}

export async function generateWords(params: {
  categoryLabel: string;
  existingWords: string[];
  count?: number;
}): Promise<string[]> {
  const prompt = wordGenerationPrompt({
    categoryLabel: params.categoryLabel,
    existingWords: params.existingWords,
    count: params.count ?? 10,
  });
  const raw = await callClaude(prompt);
  const words = parseJsonFromModelOutput<string[]>(raw);
  const existingSet = new Set(params.existingWords);
  // 念のためAI側で重複が混じっていた場合に備え、既存単語を除外
  return words.filter((w) => w && !existingSet.has(w));
}
