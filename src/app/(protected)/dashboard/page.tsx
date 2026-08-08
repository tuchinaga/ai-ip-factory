"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CharacterSeed } from "@/lib/types";
import { LoadingBlock } from "@/components/ui/Spinner";

interface DashboardData {
  totalCombinations: number;
  conceptsGenerated: number;
  characterSeeds: number;
  keep: number;
  maybe: number;
  kill: number;
  recent: CharacterSeed[];
}

const GOAL = 1000;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard", { cache: "no-store" })
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-12">
        <LoadingBlock label="ダッシュボードを読み込み中" />
      </div>
    );
  }

  const progress = Math.min(100, (data.characterSeeds / GOAL) * 100);

  const stats = [
    { label: "総組み合わせ数", value: data.totalCombinations },
    { label: "生成コンセプト数", value: data.conceptsGenerated },
    { label: "Character Seed数", value: data.characterSeeds },
    { label: "KEEP", value: data.keep },
    { label: "MAYBE", value: data.maybe },
    { label: "KILL", value: data.kill },
  ];

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight mb-4">ダッシュボード</h1>
      <p className="text-xs text-ink/40 bg-ink/5 rounded-xl px-4 py-3 mb-8 leading-relaxed">
        💡 これまでに生成・保存したCharacter Seedの状況を一覧できます。1000 SEEDSの目標に対する進捗もここで確認できます。
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="card p-5">
            <div className="label mb-2">{s.label}</div>
            <div className="text-3xl font-semibold">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="card p-6 mb-10">
        <div className="flex items-center justify-between mb-2">
          <span className="label">1000 SEEDS 目標</span>
          <span className="text-sm font-medium">
            {data.characterSeeds} / {GOAL} SEEDS
          </span>
        </div>
        <div className="h-3 rounded-full bg-ink/10 overflow-hidden">
          <div
            className="h-full bg-accent transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <h2 className="text-lg font-semibold mb-4">最近作成したCharacter</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {data.recent.map((seed) => {
          const main = seed.images?.find((i) => i.is_main) ?? seed.images?.[0];
          return (
            <Link key={seed.id} href={`/library/${seed.id}`} className="card overflow-hidden">
              <div className="aspect-square bg-ink/5 flex items-center justify-center">
                {main ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={main.image_url} alt={seed.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-ink/20 text-[10px]">画像なし</span>
                )}
              </div>
              <div className="p-2 text-xs font-medium truncate">{seed.name || "無題"}</div>
            </Link>
          );
        })}
        {data.recent.length === 0 && (
          <p className="text-sm text-ink/30 col-span-full">まだCharacter Seedがありません。</p>
        )}
      </div>
    </div>
  );
}
