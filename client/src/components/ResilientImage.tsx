import { useEffect, useState } from "react";

function resolveImageSrc(src?: string | null): string | undefined {
  if (!src) return undefined;
  // Keep managed-storage URLs same-origin so Vercel can proxy them through
  // the current storage endpoint. The previous hard-coded Manus origin could
  // be unavailable after deployment and caused every menu image to break.
  if (src.startsWith("/manus-storage/")) return src;
  if (src.startsWith("/api/storage?path=")) return src;
  return src;
}

type ResilientImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fallback: React.ReactNode;
  loading?: "eager" | "lazy";
};

export default function ResilientImage({ src, alt, className = "", fallbackClassName = "", fallback, loading = "lazy" }: ResilientImageProps) {
  const resolvedSrc = resolveImageSrc(src);
  const [failed, setFailed] = useState(!resolvedSrc);

  useEffect(() => {
    setFailed(!resolvedSrc);
  }, [resolvedSrc]);

  if (!src || failed) {
    return <div role="img" aria-label={`${alt} — imagem indisponível`} className={`${className} ${fallbackClassName}`.trim()}>{fallback}</div>;
  }

  return <img loading={loading} src={resolvedSrc} alt={alt} className={className} onError={() => setFailed(true)} />;
}
