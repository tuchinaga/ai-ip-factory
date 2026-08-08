// 単語DBに初期サンプルを投入するスクリプト
// 使い方: node scripts/seed-words.mjs  (要 .env.local に SUPABASE_URL / SERVICE_ROLE_KEY)
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { config } from "dotenv";

config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const WORDS = {
  theme: [
    "環境破壊", "孤独", "戦争", "格差", "恋愛", "家族", "老い", "仕事",
    "死", "承認欲求", "SNS疲れ", "気候変動", "友情", "自由", "記憶", "未来",
  ],
  trait: [
    "泣き虫", "がんばり屋", "臆病", "怒りん坊", "楽天家", "寂しがり", "嘘つき",
    "無口", "夢見がち", "頑固", "優等生", "忘れっぽい", "おせっかい", "好奇心旺盛",
  ],
  motif: [
    "ネコ", "クマ", "イヌ", "鳥", "魚", "ロボット", "幽霊", "植物", "花",
    "雲", "宇宙人", "キノコ", "虫", "AI",
  ],
};

async function main() {
  const { data: categories, error: catErr } = await supabase
    .from("categories")
    .select("id, key");
  if (catErr) throw catErr;

  for (const cat of categories) {
    const words = WORDS[cat.key];
    if (!words) continue;
    const rows = words.map((word) => ({ category_id: cat.id, word }));
    const { error } = await supabase.from("words").upsert(rows, {
      onConflict: "category_id,word",
      ignoreDuplicates: true,
    });
    if (error) console.error(`[${cat.key}]`, error.message);
    else console.log(`[${cat.key}] ${words.length}件投入`);
  }
}

main().then(() => {
  console.log("完了");
  process.exit(0);
}).catch((e) => {
  console.error(e);
  process.exit(1);
});
