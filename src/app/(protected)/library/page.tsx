"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { CharacterSeed, SeedStatus } from "@/lib/types";

const FILTERS: (SeedStatus | "ALL")[] = ["ALL", "KEEP", "MAYBE", "KILL"];
const FILTER_LABELS: Record<SeedStatus | "ALL", string> = {
  ALL: "すべて",
  KEEP: "KEEP",
  MAYBE: "MAYBE",
  KILL: "KILL",
};

export default function LibraryPage() {
  const [seeds, setSeeds] = useState<CharacterSeed[]>([]);
  const [status, setStatus] = useState<SeedStatus | "ALL">("ALL");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status !== "ALL") params.set("status", status);
    if (q) params.set("q", q);
    const res = await fetch(`/api/seeds?${params.toString()}`, { cache: "no-store" });
    const data = await res.json();
    setSeeds(data.seeds ?? []);
    setLoading(false);
  }, [status, q]);

  useEffect(() => {
    const t = setTimeout(load, 200); // 検索の簡易デバウンス
    return () => clearTimeout(t);
  }, [load]);

  async function handleDelete(e: React.MouseEvent, seed: CharacterSeed) {
    e.preventDefault();
    e.stopPropagation();
    const ok = window.confirm(
      `「${seed.name || "無題"}」を削除します。この操作は取り消せません。よろしいですか？`
    );
    if (!ok) return;
    await fetch(`/api/seeds/${seed.id}`, { method: "DELETE" });
    setSeeds((prev) => prev.filter((s) => s.id !== seed.id));
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-3xl font-semibold tracking-tight">ライブラリ</h1>
        <input
          className="input max-w-xs"
          placeholder="名前・テーマ・性格・モチーフ・メモで検索"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <p className="text-xs text-ink/40 bg-ink/5 rounded-xl px-4 py-3 mb-8 leading-relaxed">
        💡 カードをクリックすると詳細編集画面へ移動します。カードにカーソルを合わせると削除ボタンが表示されます。
      </p>

      <div className="flex gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setStatus(f)}
            className={`text-xs font-semibold rounded-full px-4 py-1.5 border transition ${
              status === f
                ? "bg-ink text-paper border-ink"
                : "border-ink/20 text-ink/50 hover:border-ink/40"
            }`}
          >
            {FILTER_LABELS[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card aspect-[3/4] animate-pulse" />
          ))}
        </div>
      ) : seeds.length === 0 ? (
        <p className="text-ink/40 text-sm">まだCharacter Seedがありません。</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {seeds.map((seed) => {
            const main =
              seed.images?.find((i) => i.is_main) ?? seed.images?.[0];
            return (
              <Link
                key={seed.id}
                href={`/library/${seed.id}`}
                className="card overflow-hidden group relative"
              >
                <button
                  onClick={(e) => handleDelete(e, seed)}
                  className="absolute top-2 right-2 z-10 text-[10px] font-semibold rounded-full px-2 py-1 bg-white/90 text-red-500 opacity-0 group-hover:opacity-100 transition shadow-sm hover:bg-red-50"
                >
                  削除
                </button>
                <div className="aspect-square bg-ink/5 flex items-center justify-center overflow-hidden">
                  {main ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={main.image_url}
                      alt={seed.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                  ) : (
                    <span className="text-ink/20 text-xs">画像なし</span>
                  )}
                </div>
                <div className="p-3">
                  <div className="font-semibold text-sm truncate">{seed.name || "無題"}</div>
                  <div className="text-[11px] text-ink/40 truncate">
                    {Object.values(seed.source_words || {}).join(" × ")}
                  </div>
                  <span
                    className={`inline-block mt-2 text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                      seed.status === "KEEP"
                        ? "bg-green-100 text-green-700"
                        : seed.status === "KILL"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {seed.status}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
