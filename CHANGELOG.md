# Changelog

AI IP Factoryの変更履歴。バージョンは `src/lib/version.ts` の `APP_VERSION` と一致させています。

## v1.1.2 (2026-08-08)

- **[調査中の不具合対応]** Seed詳細画面で、スマホなど狭い画面かつCharacter名が長い場合に削除ボタンがKEEP/MAYBE/KILLボタンと共に画面外へはみ出し、タップしても反応しないように見える可能性のあるレイアウト崩れを修正（名前とボタン群を縦積みに、ボタン群を折り返し表示に変更）

## v1.1.1 (2026-08-08)

- **[不具合修正]** CREATE画面読み込み直後、カテゴリ取得が完了する前に一瞬「コンセプトを生成」ボタン等が表示されてしまう不具合を修正（空配列に対する`Array.every()`が常にtrueを返す仕様が原因）

## v1.1.0 (2026-08-08)

- 各ページの読み込み中・AI生成中にスピナー/スケルトン表示を追加し、「固まってる感」を解消
- CREATE画面にキャラクター名のスタイル切り替え（国際的な名前 / 日本語の名前）を追加
- 各ページにシンプルな使い方のヒントを追加
- 単語画面に「AIで単語を提案」機能を追加（Claude APIがカテゴリごとに新しい単語候補を生成）
- Character Seedの削除機能を追加（詳細画面・Library一覧のクイック削除）
- **[重要な不具合修正]** Edge Runtimeが `crypto`（Node.js標準モジュール）に非対応なため認証処理がエラーになっていた問題を修正。Web標準のSubtleCrypto APIに置き換え
- **[重要な不具合修正]** `middleware.ts` の配置ミスによりパスワード認証が一切機能していなかった問題を修正（`src/`ディレクトリ構成では`src/middleware.ts`に置く必要がある）
- 全体の日本語UI化（ナビゲーション、ボタン、ラベル等）

## v1.0.0 (2026-08-08)

- Phase 1 MVP初回リリース
  - パスワード認証 + noindex/robots.txtによる非公開化
  - CREATE: THEME/TRAIT/MOTIFのランダム組み合わせ、LOCK機能、AIコンセプト生成
  - Character Seedの保存・編集
  - Visual Prompt生成（8スタイル対応）、COPY PROMPT
  - 画像アップロード（複数枚、Main Image設定）
  - LIBRARY: カード一覧、KEEP/MAYBE/KILLフィルター、検索
  - MUTATE: 要素固定からの派生組み合わせ生成
  - WORDS: 単語DB管理
  - DASHBOARD: 集計値 + 1000 SEEDS進捗バー
  - Supabase(PostgreSQL + Storage) + Netlifyへのデプロイ
