"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Category,
  CharacterConcept,
  LockMap,
  SelectionMap,
  WordItem,
} from "@/lib/types";
import { NameStyle } from "@/lib/ai/prompts";
import { Spinner } from "@/components/ui/Spinner";

export default function CreatePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [words, setWords] = useState<WordItem[]>([]);
  const [selection, setSelection] = useState<SelectionMap>({});
  const [locked, setLocked] = useState<LockMap>({});
  const [combinationId, setCombinationId] = useState<string | null>(null);

  const [loadingShuffle, setLoadingShuffle] = useState(false);
  const [loadingConcepts, setLoadingConcepts] = useState(false);
  const [concepts, setConcepts] = useState<CharacterConcept[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savingIndex, setSavingIndex] = useState<number | null>(null);
  const [nameStyle, setNameStyle] = useState<NameStyle>("international");
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    fetch("/api/words", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        setCategories(data.categories ?? []);
        setWords(data.words ?? []);
      })
      .finally(() => setInitialLoading(false));
  }, []);

  async function handleShuffle() {
    setError(null);
    setLoadingShuffle(true);
    setConcepts(null);
    try {
      const lockedSelection: Partial<SelectionMap> = {};
      for (const cat of categories) {
        if (locked[cat.key] && selection[cat.key]) {
          lockedSelection[cat.key] = selection[cat.key];
        }
      }
      const res = await fetch("/api/combinations/shuffle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locked: lockedSelection }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSelection(data.combination.selection);
      setCombinationId(data.combination.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "シャッフルに失敗しました");
    } finally {
      setLoadingShuffle(false);
    }
  }

  async function handleGenerateConcepts() {
    setError(null);
    setLoadingConcepts(true);
    try {
      const res = await fetch("/api/concepts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selection, nameStyle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setConcepts(data.concepts);
    } catch (e) {
      setError(e instanceof Error ? e.message : "コンセプト生成に失敗しました");
    } finally {
      setLoadingConcepts(false);
    }
  }

  async function handleSelect(concept: CharacterConcept, index: number) {
    setSavingIndex(index);
    setError(null);
    try {
      const res = await fetch("/api/seeds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: concept.name,
          source_words: selection,
          combination_id: combinationId,
          concept: concept.concept,
          personality: concept.personality,
          world: concept.world,
          philosophy: concept.philosophy,
          story_seed: concept.story_seed,
          visual_keywords: concept.visual_keywords,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      router.push(`/library/${data.seed.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
      setSavingIndex(null);
    }
  }

  const hasSelection =
    !initialLoading &&
    categories.length > 0 &&
    categories.every((c) => !!selection[c.key]);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-1">作成</h1>
      <p className="text-ink/50 mb-4">
        ランダムな組み合わせから、キャラクター/IPの原石を発見する
      </p>
      <p className="text-xs text-ink/40 bg-ink/5 rounded-xl px-4 py-3 mb-10 leading-relaxed">
        💡 SHUFFLEでランダムに単語を表示 → 気に入った単語はLOCKして固定 →
        GENERATE CONCEPTSでAIが3案生成 → 気に入った案をSELECTで保存できます。
      </p>

      {initialLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card p-5 flex flex-col items-center gap-3 animate-pulse">
              <div className="h-3 w-16 bg-ink/10 rounded" />
              <div className="h-6 w-20 bg-ink/10 rounded" />
              <div className="h-6 w-16 bg-ink/10 rounded-full" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {categories.map((cat) => (
            <div key={cat.id} className="card p-5 flex flex-col items-center gap-3">
              <span className="label">{cat.label}</span>
              <span className="text-xl font-semibold text-center min-h-[1.75rem]">
                {selection[cat.key] || "—"}
              </span>
              <button
                onClick={() =>
                  setLocked((prev) => ({ ...prev, [cat.key]: !prev[cat.key] }))
                }
                className={`text-xs rounded-full px-3 py-1 border transition ${
                  locked[cat.key]
                    ? "bg-ink text-paper border-ink"
                    : "border-ink/20 text-ink/50 hover:border-ink/40"
                }`}
                disabled={!selection[cat.key]}
              >
                {locked[cat.key] ? "🔒 ロック中" : "ロック"}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-center mb-10">
        <button
          onClick={handleShuffle}
          disabled={loadingShuffle || initialLoading}
          className="btn-accent inline-flex items-center gap-2"
        >
          {loadingShuffle && <Spinner className="w-4 h-4" />}
          {loadingShuffle ? "シャッフル中..." : "SHUFFLE"}
        </button>
      </div>

      {error && (
        <p className="text-center text-sm text-red-600 mb-6">{error}</p>
      )}

      {hasSelection && (
        <div className="flex flex-col items-center gap-3 mb-10">
          <div className="flex items-center gap-1 rounded-full border border-ink/15 p-1">
            <button
              onClick={() => setNameStyle("international")}
              className={`text-xs font-medium rounded-full px-3 py-1.5 transition ${
                nameStyle === "international"
                  ? "bg-ink text-paper"
                  : "text-ink/50"
              }`}
            >
              国際的な名前
            </button>
            <button
              onClick={() => setNameStyle("japanese")}
              className={`text-xs font-medium rounded-full px-3 py-1.5 transition ${
                nameStyle === "japanese" ? "bg-ink text-paper" : "text-ink/50"
              }`}
            >
              日本語の名前
            </button>
          </div>
          <button
            onClick={handleGenerateConcepts}
            disabled={loadingConcepts}
            className="btn-primary inline-flex items-center gap-2"
          >
            {loadingConcepts && <Spinner className="w-4 h-4" />}
            {loadingConcepts ? "生成中..." : "コンセプトを生成"}
          </button>
        </div>
      )}

      {loadingConcepts && (
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card p-5 space-y-3 animate-pulse">
              <div className="h-4 bg-ink/10 rounded w-1/2" />
              <div className="h-3 bg-ink/10 rounded w-full" />
              <div className="h-3 bg-ink/10 rounded w-full" />
              <div className="h-3 bg-ink/10 rounded w-2/3" />
            </div>
          ))}
        </div>
      )}

      {concepts && (
        <div className="grid gap-4 sm:grid-cols-3">
          {concepts.map((c, i) => (
            <div key={i} className="card p-5 flex flex-col">
              <div className="text-xs text-ink/40 mb-1">{`0${i + 1}`}</div>
              <h3 className="text-lg font-semibold mb-2">{c.name}</h3>
              <p className="text-sm mb-3">{c.concept}</p>
              <dl className="text-xs text-ink/60 space-y-1 mb-4">
                <div><span className="font-medium text-ink/80">性格: </span>{c.personality}</div>
                <div><span className="font-medium text-ink/80">世界観: </span>{c.world}</div>
                <div><span className="font-medium text-ink/80">哲学: </span>{c.philosophy}</div>
              </dl>
              <button
                onClick={() => handleSelect(c, i)}
                disabled={savingIndex !== null}
                className="btn-secondary mt-auto inline-flex items-center justify-center gap-2"
              >
                {savingIndex === i && <Spinner className="w-3.5 h-3.5" />}
                {savingIndex === i ? "保存中..." : "選択"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
