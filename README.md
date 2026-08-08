# AI IP Factory (仮称)

Randomness × AI × Human Creativity で
キャラクター/IPの原石を大量発見するための内部クリエイティブツール。

社内少人数チーム専用。一般公開しない前提の設計です。

## 技術スタック
- Next.js 14 (App Router) / TypeScript / Tailwind CSS
- Supabase (PostgreSQL + Storage)
- Anthropic Claude API (コンセプト生成 / Visual Prompt生成 / Mutation生成)
- Netlify デプロイ想定

## セットアップ

### 1. 依存関係インストール
```bash
npm install
```

### 2. Supabaseプロジェクト作成
1. https://supabase.com でプロジェクトを新規作成
2. SQL Editorで `supabase/migrations/0001_init.sql` の内容を実行
3. Storageで `character-images` バケットを作成し、Public読み取りを許可

### 3. 環境変数設定
`.env.example` を `.env.local` にコピーし、値を埋める。

```bash
cp .env.example .env.local
```

- `APP_PASSWORD`: アプリのログインパスワード(共通パスワード)
- `SESSION_SECRET`: 32文字以上のランダム文字列(ログインセッション署名用)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabaseの Project Settings > API から取得
- `SUPABASE_SERVICE_ROLE_KEY`: 同上(Service Role Key。サーバー側のみで使用、絶対に公開しない)
- `ANTHROPIC_API_KEY`: console.anthropic.com/settings/keys で発行

### 4. 単語データの初期投入(任意)
要件に記載のTHEME/TRAIT/MOTIFのサンプル単語を投入する場合:
```bash
npm run db:migrate   # ※現状は手動でSQL Editor実行を推奨。スクリプトは今後拡張
node scripts/seed-words.mjs
```

### 5. ローカル起動
```bash
npm run dev
```
http://localhost:3000 → 自動的に `/login` へリダイレクトされます。

## デプロイ (Netlify)
1. GitHubリポジトリにpush
2. Netlifyで新規サイト作成しリポジトリを連携
3. 環境変数(上記5つ)をNetlifyのSite settings > Environment variablesに設定
4. `@netlify/plugin-nextjs` が自動適用される(`netlify.toml`に設定済み)

## 主要機能 (Phase 1 MVP)
- パスワード認証 + noindex/robots.txt によるプライベート化
- CREATE: THEME/TRAIT/MOTIFのランダム組み合わせ、LOCK機能、AIコンセプト生成(3案)
- Character Seed保存・自由編集
- Visual Prompt生成(8種類のStyle対応)、COPY PROMPT
- 画像アップロード(複数枚、Main Image設定)
- LIBRARY: カード一覧、KEEP/MAYBE/KILLフィルター、検索
- MUTATE: 要素LOCKからの派生組み合わせ生成、Parent Seed記録
- WORDS: 単語DB管理(Add/Edit/Delete/Enable/Disable)、カテゴリ追加可能
- DASHBOARD: 集計値 + 1000 SEEDS進捗バー + 最近作成分

## 今後の拡張ポイント(設計済み・未実装)
- AI Providerの切り替え(`src/lib/ai/provider.ts` を差し替えるだけでOpenAI/Gemini対応可能)
- Supabase Auth等への認証方式の変更
- 2/4/5語への組み合わせ数拡張(`categories`テーブルへの追加で対応可能な設計)
