"use client";

import { useEffect, useState, useCallback } from "react";
import { Category, WordItem } from "@/lib/types";

export default function WordsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [words, setWords] = useState<WordItem[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [newWord, setNewWord] = useState("");
  const [newCategory, setNewCategory] = useState({ key: "", label: "" });
  const [showNewCategory, setShowNewCategory] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/words");
    const data = await res.json();
    setCategories(data.categories ?? []);
    setWords(data.words ?? []);
    if (!activeCat && data.categories?.length) {
      setActiveCat(data.categories[0].id);
    }
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

  async function handleAddCategory() {
    if (!newCategory.key.trim() || !newCategory.label.trim()) return;
    await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        newCategory: { key: newCategory.key.trim(), label: newCategory.label.trim() },
      }),
    });
    setNewCategory({ key: "", label: "" });
    setShowNewCategory(false);
    load();
  }

  const activeWords = words.filter((w) => w.category_id === activeCat);

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-8">Words</h1>

      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCat(cat.id)}
            className={`text-xs font-semibold rounded-full px-4 py-1.5 border transition ${
              activeCat === cat.id
                ? "bg-ink text-paper border-ink"
                : "border-ink/20 text-ink/50 hover:border-ink/40"
            }`}
          >
            {cat.label}
          </button>
        ))}
        <button
          onClick={() => setShowNewCategory((s) => !s)}
          className="text-xs font-semibold rounded-full px-4 py-1.5 border border-dashed border-ink/30 text-ink/40"
        >
          + Category
        </button>
      </div>

      {showNewCategory && (
        <div className="card p-4 mb-6 flex gap-2">
          <input
            className="input"
            placeholder="key (例: place)"
            value={newCategory.key}
            onChange={(e) => setNewCategory((c) => ({ ...c, key: e.target.value }))}
          />
          <input
            className="input"
            placeholder="表示名 (例: PLACE)"
            value={newCategory.label}
            onChange={(e) => setNewCategory((c) => ({ ...c, label: e.target.value }))}
          />
          <button onClick={handleAddCategory} className="btn-secondary shrink-0">
            Add
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <input
          className="input"
          placeholder="新しい単語を追加"
          value={newWord}
          onChange={(e) => setNewWord(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddWord()}
        />
        <button onClick={handleAddWord} className="btn-primary shrink-0">
          Add
        </button>
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
                {w.enabled ? "Disable" : "Enable"}
              </button>
              <button
                onClick={() => handleDelete(w)}
                className="text-xs text-red-400 hover:text-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {activeWords.length === 0 && (
          <p className="text-sm text-ink/30">単語がありません。</p>
        )}
      </div>
    </div>
  );
}
