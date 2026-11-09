import Image from "next/image";

/** Car photo or a neutral silhouette when the model has no image yet. */
export function CarImage({ src, alt, sizes, priority }: { src?: string | null; alt: string; sizes: string; priority?: boolean }) {
  if (src) return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-contain" />;
  return (
    <div className="flex size-full items-center justify-center bg-aegean-wash" role="img" aria-label={alt}>
      <svg viewBox="0 0 120 48" className="w-2/3 text-ink/25" aria-hidden>
        <path fill="currentColor" d="M8 34c0-5 3-8 8-9l12-2 14-10c3-2 6-3 10-3h20c5 0 8 2 11 5l9 9 12 2c5 1 8 4 8 9v4H8z" />
        <circle cx="32" cy="38" r="8" fill="var(--color-aegean-wash)" stroke="currentColor" strokeWidth="5" />
        <circle cx="90" cy="38" r="8" fill="var(--color-aegean-wash)" stroke="currentColor" strokeWidth="5" />
      </svg>
    </div>
  );
}
