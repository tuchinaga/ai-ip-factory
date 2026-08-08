import { createClient } from "@supabase/supabase-js";

// ブラウザ/クライアントコンポーネント用 (anon key)
export function createBrowserSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
