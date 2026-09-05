import { useEffect, useState } from "react";

type ResilientImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
  fallback: React.ReactNode;
  loading?: "eager" | "lazy";
};

export default function ResilientImage({ src, alt, className = "", fallbackClassName = "", fallback, loading = "lazy" }: ResilientImageProps) {
  const [failed, setFailed] = useState(!src);

  useEffect(() => {
    setFailed(!src);
  }, [src]);

  if (!src || failed) {
    return <div role="img" aria-label={`${alt} — imagem indisponível`} className={`${className} ${fallbackClassName}`.trim()}>{fallback}</div>;
  }

  return <img loading={loading} src={src} alt={alt} className={className} onError={() => setFailed(true)} />;
}
