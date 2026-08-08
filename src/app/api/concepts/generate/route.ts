export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { generateConcepts } from "@/lib/ai/provider";
import { SelectionMap } from "@/lib/types";
import { NameStyle } from "@/lib/ai/prompts";

// POST { selection: SelectionMap, nameStyle? } -> AIで3案のコンセプトを生成
export async function POST(req: NextRequest) {
  const { selection, nameStyle } = (await req.json()) as {
    selection: SelectionMap;
    nameStyle?: NameStyle;
  };
  if (!selection) {
    return NextResponse.json({ error: "selection は必須です" }, { status: 400 });
  }

  try {
    const concepts = await generateConcepts(selection, nameStyle ?? "international");
    return NextResponse.json({ concepts });
  } catch (e) {
    const message = e instanceof Error ? e.message : "コンセプト生成に失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
