"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CharacterSeed, SeedStatus, VISUAL_STYLES, VisualStyle } from "@/lib/types";

const TEXT_FIELDS: { key: keyof CharacterSeed; label: string; multiline?: boolean }[] = [
  { key: "name", label: "Name" },
  { key: "concept", label: "One Line Concept", multiline: true },
  { key: "personality", label: "Personality", multiline: true },
  { key: "world", label: "World", multiline: true },
  { key: "philosophy", label: "Philosophy / Message", multiline: true },
  { key: "story_seed", label: "Story Seed", multiline: true },
  { key: "visual_keywords", label: "Visual Keywords", multiline: true },
  { key: "memo", label: "Memo", multiline: true },
];

export default function SeedDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [seed, setSeed] = useState<CharacterSeed | null>(null);
  const [draft, setDraft] = useState<Partial<CharacterSeed>>({});
  const [saving, setSaving] = useState(false);
  const [style, setStyle] = useState<VisualStyle>("DEFAULT");
  const [generatingPrompt, setGeneratingPrompt] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mutating, setMutating] = useState(false);
  const [mutationOptions, setMutationOptions] = useState<Record<string, string>[] | null>(null);
  const [lockedKeys, setLockedKeys] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/seeds/${id}`);
    const data = await res.json();
    setSeed(data.seed);
    setDraft(data.seed);
    setStyle(data.seed?.visual_style || "DEFAULT");
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveField(key: keyof CharacterSeed, value: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/seeds/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: value }),
      });
      const data = await res.json();
      setSeed(data.seed);
    } finally {
      setSaving(false);
    }
  }

  async function handleStatusChange(status: SeedStatus) {
    setDraft((d) => ({ ...d, status }));
    await saveField("status", status);
  }

  async function handleGeneratePrompt() {
    setGeneratingPrompt(true);
    setError(null);
    try {
      const res = await fetch("/api/visual-prompt/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed_id: id, style }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSeed(data.seed);
      setDraft(data.seed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Visual Prompt生成に失敗しました");
    } finally {
      setGeneratingPrompt(false);
    }
  }

  async function handleCopyPrompt() {
    if (!seed?.visual_prompt) return;
    await navigator.clipboard.writeText(seed.visual_prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("seed_id", id);
      formData.append("is_main", String(!seed?.images?.length));
      const res = await fetch("/api/images/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "画像アップロードに失敗しました");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSetMain(imageId: string) {
    await fetch(`/api/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_main: true }),
    });
    await load();
  }

  async function handleDeleteImage(imageId: string) {
    await fetch(`/api/images/${imageId}`, { method: "DELETE" });
    await load();
  }

  function toggleLock(key: string) {
    setLockedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleMutate() {
    setMutating(true);
    setError(null);
    setMutationOptions(null);
    try {
      const res = await fetch("/api/mutation/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed_id: id, locked_keys: Array.from(lockedKeys) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMutationOptions(data.combinations);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mutationに失敗しました");
    } finally {
      setMutating(false);
    }
  }

  async function handleCreateFromMutation(selection: Record<string, string>) {
    const res = await fetch("/api/concepts/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selection }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error);
      return;
    }
    const concept = data.concepts[0];
    const createRes = await fetch("/api/seeds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: concept.name,
        source_words: selection,
        concept: concept.concept,
        personality: concept.personality,
        world: concept.world,
        philosophy: concept.philosophy,
        story_seed: concept.story_seed,
        visual_keywords: concept.visual_keywords,
        parent_seed_id: id,
      }),
    });
    const createData = await createRes.json();
    if (!createRes.ok) {
      setError(createData.error);
      return;
    }
    router.push(`/library/${createData.seed.id}`);
  }

  if (!seed) {
    return <div className="max-w-4xl mx-auto px-6 py-12 text-ink/40">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <Link href="/library" className="text-sm text-ink/40 hover:text-ink/70">
        ← Library
      </Link>

      <div className="flex items-center justify-between mt-4 mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">
          {draft.name || "無題"}
        </h1>
        <div className="flex gap-2">
          {(["KEEP", "MAYBE", "KILL"] as SeedStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              className={`text-xs font-semibold rounded-full px-4 py-1.5 border transition ${
                draft.status === s
                  ? s === "KEEP"
                    ? "bg-green-600 text-white border-green-600"
                    : s === "KILL"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-amber-500 text-white border-amber-500"
                  : "border-ink/20 text-ink/50 hover:border-ink/40"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="grid md:grid-cols-2 gap-10">
        {/* 左: テキスト情報編集 */}
        <div className="space-y-5">
          <div>
            <span className="label">Source Words</span>
            <p className="text-sm mt-1">
              {Object.entries(seed.source_words || {})
                .map(([k, v]) => `${k}: ${v}`)
                .join(" / ")}
            </p>
          </div>

          {TEXT_FIELDS.map((f) => (
            <div key={String(f.key)}>
              <label className="label mb-1 block">{f.label}</label>
              {f.multiline ? (
                <textarea
                  className="input min-h-[70px]"
                  value={(draft[f.key] as string) ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                  onBlur={(e) => saveField(f.key, e.target.value)}
                />
              ) : (
                <input
                  className="input"
                  value={(draft[f.key] as string) ?? ""}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, [f.key]: e.target.value }))
                  }
                  onBlur={(e) => saveField(f.key, e.target.value)}
                />
              )}
            </div>
          ))}
          {saving && <p className="text-xs text-ink/30">Saving...</p>}
        </div>

        {/* 右: Visual Prompt / 画像 / Mutation */}
        <div className="space-y-8">
          <div className="card p-5">
            <span className="label mb-3 block">Visual Prompt</span>
            <select
              className="input mb-3"
              value={style}
              onChange={(e) => setStyle(e.target.value as VisualStyle)}
            >
              {VISUAL_STYLES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <button
              onClick={handleGeneratePrompt}
              disabled={generatingPrompt}
              className="btn-primary w-full mb-3"
            >
              {generatingPrompt ? "GENERATING..." : "GENERATE VISUAL PROMPT"}
            </button>
            {seed.visual_prompt && (
              <div>
                <textarea
                  readOnly
                  className="input min-h-[120px] text-xs"
                  value={seed.visual_prompt}
                />
                <button onClick={handleCopyPrompt} className="btn-secondary w-full mt-2">
                  {copied ? "COPIED!" : "COPY PROMPT"}
                </button>
              </div>
            )}
          </div>

          <div className="card p-5">
            <span className="label mb-3 block">Character Images</span>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {seed.images?.map((img) => (
                <div key={img.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.image_url}
                    alt=""
                    className={`aspect-square object-cover rounded-lg w-full ${
                      img.is_main ? "ring-2 ring-accent" : ""
                    }`}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex flex-col items-center justify-center gap-1">
                    {!img.is_main && (
                      <button
                        onClick={() => handleSetMain(img.id)}
                        className="text-[10px] text-white underline"
                      >
                        Set Main
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteImage(img.id)}
                      className="text-[10px] text-white/80 underline"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelected}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="btn-secondary w-full"
            >
              {uploading ? "UPLOADING..." : "+ Upload Image"}
            </button>
          </div>

          <div className="card p-5">
            <span className="label mb-3 block">Mutate</span>
            <p className="text-xs text-ink/50 mb-3">
              固定したい要素をLOCKしてからMUTATEすると、残りの要素だけ変化した新しい組み合わせを提案します。
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(seed.source_words || {}).map(([key, value]) => (
                <button
                  key={key}
                  onClick={() => toggleLock(key)}
                  className={`text-xs rounded-full px-3 py-1 border transition ${
                    lockedKeys.has(key)
                      ? "bg-ink text-paper border-ink"
                      : "border-ink/20 text-ink/50"
                  }`}
                >
                  {key}: {value} {lockedKeys.has(key) ? "🔒" : ""}
                </button>
              ))}
            </div>
            <button onClick={handleMutate} disabled={mutating} className="btn-primary w-full">
              {mutating ? "MUTATING..." : "MUTATE"}
            </button>

            {mutationOptions && (
              <div className="mt-4 space-y-2">
                {mutationOptions.map((opt, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between text-sm border border-ink/10 rounded-lg px-3 py-2"
                  >
                    <span>{Object.values(opt).join(" × ")}</span>
                    <button
                      onClick={() => handleCreateFromMutation(opt)}
                      className="text-xs underline text-accent"
                    >
                      Create Seed
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
