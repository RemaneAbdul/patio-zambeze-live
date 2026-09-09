import { useEffect, useState } from "react";

const MANAGED_STORAGE_ORIGIN = "https://menudigital-8xuhohcp.manus.space";

function resolveImageSrc(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (src.startsWith("/manus-storage/")) return `${MANAGED_STORAGE_ORIGIN}${src}`;
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
  }, [src]);

  if (!src || failed) {
    return <div role="img" aria-label={`${alt} — imagem indisponível`} className={`${className} ${fallbackClassName}`.trim()}>{fallback}</div>;
  }

  return <img loading={loading} src={resolvedSrc} alt={alt} className={className} onError={() => setFailed(true)} />;
}
