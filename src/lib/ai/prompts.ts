import { SelectionMap, VisualStyle } from "@/lib/types";

const PHILOSOPHY = `
キャラクターを説明過多にしすぎないこと。世界観や設定を作り込みすぎず、
人間が想像を追加できる余白を残すこと。以下を重視する:
・シンプル ・一言で説明できる ・感情移入できる ・世界展開しやすい
・視覚的特徴を作りやすい ・哲学やテーマが奥に存在する
・子どもにも理解できるが、大人にも意味がある
キャラクター名は短く、国際的に発音しやすい候補を優先する。
`.trim();

export function conceptGenerationPrompt(selection: SelectionMap): string {
  const words = Object.entries(selection)
    .map(([key, word]) => `${key}: ${word}`)
    .join(" / ");

  return `
あなたはキャラクターIP開発のクリエイティブディレクターです。
以下のランダムな単語の組み合わせから、キャラクター/IPの原石となるコンセプトを3案作ってください。

# 組み合わせ
${words}

# 生成方針
${PHILOSOPHY}

# 出力形式
以下のJSON配列のみを出力してください（説明文・コードブロック記法は不要）。
[
  {
    "name": "短い名前",
    "concept": "一言コンセプト(1〜2文)",
    "personality": "性格の説明(1〜2文)",
    "world": "世界観の説明(1〜2文)",
    "philosophy": "背後にあるテーマ・哲学(1文)",
    "story_seed": "物語の種になる一文",
    "visual_keywords": "視覚的特徴を表す単語をカンマ区切りで5〜8個"
  }
]
`.trim();
}

export function visualPromptGenerationPrompt(params: {
  name: string;
  concept: string;
  personality: string;
  world: string;
  visualKeywords: string;
  style: VisualStyle;
}): string {
  const { name, concept, personality, world, visualKeywords, style } = params;

  return `
以下のキャラクター情報から、画像生成AI(ChatGPT/Gemini/Midjourneyなど)に
そのままコピーして使える英語の画像生成プロンプトを1つ作成してください。

# キャラクター情報
Name: ${name}
Concept: ${concept}
Personality: ${personality}
World: ${world}
Visual Keywords: ${visualKeywords}

# 画風指定
Style: ${style}

# 制約
- 特定の画像生成AI固有の記法(--ar, --v等のパラメータ)には依存しない汎用的な英文にする
- シンプルなシルエット、character design sheet styleのニュアンスを含める
- "No text, clean background" のようなノイズを避ける指示を含める
- 出力は英語のプロンプト本文のみ。前置き・説明・引用符・コードブロックは付けない
`.trim();
}

export function mutationGenerationPrompt(params: {
  lockedSelection: Partial<SelectionMap>;
  freeCategoryKeys: string[];
  wordPool: Record<string, string[]>;
  count: number;
}): string {
  const { lockedSelection, freeCategoryKeys, wordPool, count } = params;

  const lockedText = Object.entries(lockedSelection)
    .map(([k, v]) => `${k}: ${v} (固定)`)
    .join(" / ");

  const poolText = freeCategoryKeys
    .map((k) => `${k}の候補: ${(wordPool[k] || []).join(", ")}`)
    .join("\n");

  return `
以下は既存キャラクターの一部要素を固定し、残りをランダムに変化させた
新しい組み合わせ候補を作るタスクです。

# 固定要素
${lockedText}

# 変化させる要素の候補プール
${poolText}

# 指示
候補プールの中から実在する単語のみを使い、固定要素と組み合わせて
新しい組み合わせを${count}個作成してください。同じ組み合わせを重複させないこと。

# 出力形式
以下のJSON配列のみを出力してください。
[
  { ${freeCategoryKeys.map((k) => `"${k}": "..."`).join(", ")} }
]
`.trim();
}

export function wordGenerationPrompt(params: {
  categoryLabel: string;
  existingWords: string[];
  count: number;
}): string {
  const { categoryLabel, existingWords, count } = params;

  return `
あなたはキャラクターIP開発のクリエイティブディレクターです。
「${categoryLabel}」カテゴリーに追加する新しい単語を${count}個考えてください。

# 既存の単語(重複させないこと)
${existingWords.join(", ") || "(まだ登録されていません)"}

# 方針
- 1〜4文字程度の短い日本語の単語・熟語にする(説明文にしない)
- 既存の単語と系統は合わせつつ、意外性のある新しい単語も混ぜる
- キャラクター/IP開発のランダム掛け合わせに使うため、抽象的すぎず具体的すぎない言葉にする

# 出力形式
以下のJSON配列のみを出力してください(説明文・コードブロック記法は不要)。
["単語1", "単語2", ...]
`.trim();
}
