import { createClient } from "@supabase/supabase-js";

// サーバー(API Route/Server Component)用。Service Role Keyを使い、
// アプリ側のパスワード認証(middleware)でアクセス制御する前提。
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
