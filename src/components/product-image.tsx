"use client";

import Image, { ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * next/image with graceful degradation: if the source fails (e.g. the
 * WooCommerce media library is unreachable or a URL has rotted), fall back
 * to the blueprint placeholder instead of a broken image.
 *
 * onError alone misses images that errored before hydration, so we also
 * inspect the rendered <img> after mount (complete + naturalWidth === 0
 * means the browser already gave up on it).
 */
export function ProductImage({ src, alt, ...rest }: ImageProps) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) setFailed(true);
  }, []);

  return (
    <Image
      {...rest}
      ref={ref}
      alt={alt}
      src={failed ? "/products/engines-components.svg" : src}
      unoptimized={failed}
      onError={() => setFailed(true)}
    />
  );
}
