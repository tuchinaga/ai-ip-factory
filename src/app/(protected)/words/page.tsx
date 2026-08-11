"use client";

import { useEffect, useState, useCallback } from "react";
import { Category, WordItem } from "@/lib/types";
import { LoadingBlock, Spinner } from "@/components/ui/Spinner";

export default function WordsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [words, setWords] = useState<WordItem[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [newWord, setNewWord] = useState("");
  const [newCategory, setNewCategory] = useState({ key: "", label: "", isRequired: true });
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set());
  const [aiError, setAiError] = useState<string | null>(null);
  const [addingSuggestions, setAddingSuggestions] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/words", { cache: "no-store" });
    const data = await res.json();
    setCategories(data.categories ?? []);
    setWords(data.words ?? []);
    if (!activeCat && data.categories?.length) {
      setActiveCat(data.categories[0].id);
    }
    setInitialLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleAddWord() {
    if (!newWord.trim() || !activeCat) return;
    await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_id: activeCat, word: newWord.trim() }),
    });
    setNewWord("");
    load();
  }

  async function handleToggle(word: WordItem) {
    await fetch(`/api/words/${word.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !word.enabled }),
    });
    load();
  }

  async function handleDelete(word: WordItem) {
    await fetch(`/api/words/${word.id}`, { method: "DELETE" });
    load();
  }

  async function handleGenerateSuggestions() {
    if (!activeCat) return;
    setGenerating(true);
    setAiError(null);
    setSuggestions([]);
    setSelectedSuggestions(new Set());
    try {
      const res = await fetch("/api/words/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: activeCat, count: 10 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSuggestions(data.words ?? []);
      setSelectedSuggestions(new Set(data.words ?? []));
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "単語の生成に失敗しました");
    } finally {
      setGenerating(false);
    }
  }

  function toggleSuggestion(word: string) {
    setSelectedSuggestions((prev) => {
      const next = new Set(prev);
      if (next.has(word)) next.delete(word);
      else next.add(word);
      return next;
    });
  }

  async function handleAddSuggestions() {
    if (!activeCat || selectedSuggestions.size === 0) return;
    setAddingSuggestions(true);
    try {
      await fetch("/api/words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category_id: activeCat,
          words: Array.from(selectedSuggestions),
        }),
      });
      setSuggestions((prev) => prev.filter((w) => !selectedSuggestions.has(w)));
      setSelectedSuggestions(new Set());
      load();
    } finally {
      setAddingSuggestions(false);
    }
  }

  async function handleAddCategory() {
    if (!newCategory.key.trim() || !newCategory.label.trim()) return;
    await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newCategory: {
          key: newCategory.key.trim(),
          label: newCategory.label.trim(),
          is_required: newCategory.isRequired,
        },
      }),
    });
    setNewCategory({ key: "", label: "", isRequired: true });
    setShowNewCategory(false);
    load();
  }

  async function handleToggleRequired(cat: Category) {
    await fetch(`/api/categories/${cat.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_required: !cat.is_required }),
    });
    load();
  }

  const activeWords = words.filter((w) => w.category_id === activeCat);
  const activeCategory = categories.find((c) => c.id === activeCat) ?? null;

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-4">単語</h1>
      <p className="text-xs text-ink/40 bg-ink/5 rounded-xl px-4 py-3 mb-8 leading-relaxed">
        💡 カテゴリタブを選んでから単語を追加・無効化・削除できます。「AIで単語を提案」から候補をまとめて追加することもできます。
      </p>

      {initialLoading ? (
        <LoadingBlock label="単語を読み込み中" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-2">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCat(cat.id);
                  setSuggestions([]);
                  setSelectedSuggestions(new Set());
                  setAiError(null);
                }}
                className={`text-xs font-semibold rounded-full px-4 py-1.5 border transition ${
                  activeCat === cat.id
                    ? "bg-ink text-paper border-ink"
                    : "border-ink/20 text-ink/50 hover:border-ink/40"
                }`}
              >
                {cat.label}
                {!cat.is_required && <span className="ml-1 opacity-60">(任意)</span>}
              </button>
            ))}
            <button
              onClick={() => setShowNewCategory((s) => !s)}
              className="text-xs font-semibold rounded-full px-4 py-1.5 border border-dashed border-ink/30 text-ink/40"
            >
              + カテゴリを追加
            </button>
          </div>

          {activeCategory && (
            <div className="mb-6">
              <button
                onClick={() => handleToggleRequired(activeCategory)}
                className="text-[11px] text-ink/40 hover:text-ink/70 underline"
              >
                このカテゴリを{activeCategory.is_required ? "任意枠にする" : "必須枠にする"}
                （現在: {activeCategory.is_required ? "必須" : "任意（作成画面でON/OFF可能）"}）
              </button>
            </div>
          )}

          {showNewCategory && (
            <div className="card p-4 mb-6 space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className="input"
                  placeholder="key (例: place)"
                  value={newCategory.key}
                  onChange={(e) => setNewCategory((c) => ({ ...c, key: e.target.value }))}
                />
                <input
                  className="input"
                  placeholder="表示名 (例: 場所)"
                  value={newCategory.label}
                  onChange={(e) => setNewCategory((c) => ({ ...c, label: e.target.value }))}
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-ink/60">
                <input
                  type="checkbox"
                  checked={!newCategory.isRequired}
                  onChange={(e) =>
                    setNewCategory((c) => ({ ...c, isRequired: !e.target.checked }))
                  }
                />
                任意枠にする（作成画面でON/OFFを選べるようになります）
              </label>
              <button onClick={handleAddCategory} className="btn-secondary">
                追加
              </button>
            </div>
          )}

          <div className="flex gap-2 mb-4">
            <input
              className="input"
              placeholder="新しい単語を追加"
              value={newWord}
              onChange={(e) => setNewWord(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
            />
            <button onClick={handleAddWord} className="btn-primary shrink-0">
              追加
            </button>
          </div>

          <div className="card p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className="label">AIで単語を提案</span>
              <button
                onClick={handleGenerateSuggestions}
                disabled={generating || !activeCat}
                className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5"
              >
                {generating && <Spinner className="w-3.5 h-3.5" />}
                {generating ? "生成中..." : "10件生成する"}
              </button>
            </div>
            {aiError && <p className="text-xs text-red-600 mb-2">{aiError}</p>}
            {suggestions.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  {suggestions.map((w) => (
                    <button
                      key={w}
                      onClick={() => toggleSuggestion(w)}
                      className={`text-xs rounded-full px-3 py-1.5 border transition ${
                        selectedSuggestions.has(w)
                          ? "bg-ink text-paper border-ink"
                          : "border-ink/20 text-ink/50 hover:border-ink/40"
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleAddSuggestions}
                  disabled={addingSuggestions || selectedSuggestions.size === 0}
                  className="btn-primary text-xs px-4 py-2 inline-flex items-center gap-1.5"
                >
                  {addingSuggestions && <Spinner className="w-3.5 h-3.5" />}
                  {addingSuggestions
                    ? "追加中..."
                    : `選択した${selectedSuggestions.size}件を追加`}
                </button>
              </>
            )}
          </div>

          <div className="space-y-2">
            {activeWords.map((w) => (
              <div
                key={w.id}
                className="flex items-center justify-between card px-4 py-2.5"
              >
                <span className={w.enabled ? "" : "line-through text-ink/30"}>
                  {w.word}
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleToggle(w)}
                    className="text-xs text-ink/40 hover:text-ink/70"
                  >
                    {w.enabled ? "無効化" : "有効化"}
                  </button>
                  <button
                    onClick={() => handleDelete(w)}
                    className="text-xs text-red-400 hover:text-red-600"
                  >
                    削除
                  </button>
                </div>
              </div>
            ))}
            {activeWords.length === 0 && (
              <p className="text-sm text-ink/30">単語がありません。</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
