"use client";

import { useState } from "react";

/**
 * 通常のimgタグのラッパー。読み込みに失敗した場合(Storageの権限設定ミス等)、
 * 壊れた画像アイコンの代わりに分かりやすいメッセージを表示する。
 */
export function SafeImage({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center bg-ink/5 text-ink/30 text-[10px] text-center px-2 ${className}`}
      >
        画像を読み込めませんでした
        <br />
        (Storageの公開設定をご確認ください)
      </div>
    );
  }

  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
