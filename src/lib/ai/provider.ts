import { CharacterConcept, SelectionMap, VisualStyle } from "@/lib/types";
import { callClaude, parseJsonFromModelOutput } from "@/lib/ai/anthropic";
import {
  conceptGenerationPrompt,
  visualPromptGenerationPrompt,
  mutationGenerationPrompt,
} from "@/lib/ai/prompts";

// AI Provider抽象化レイヤー。
// 現在はAnthropic Claudeを直接呼び出しているが、
// 将来OpenAI/Gemini等に差し替える場合はこのファイルの実装のみを変更すればよい。

export async function generateConcepts(
  selection: SelectionMap
): Promise<CharacterConcept[]> {
  const prompt = conceptGenerationPrompt(selection);
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
