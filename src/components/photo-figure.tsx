import Image from "next/image";
import { LICENSE_URL, photo, type PhotoKey } from "@/content/photos";

/** A captioned photo with its licence attribution (author · licence · source), as CC licences require. */
export function PhotoFigure({
  k,
  caption,
  priority,
  sizes = "(min-width: 768px) 720px, 100vw",
  className = "",
  imgClassName = "rounded-panel",
}: {
  k: PhotoKey;
  caption?: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
  imgClassName?: string;
}) {
  const p = photo(k);
  return (
    <figure className={className}>
      <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes={sizes} priority={priority} className={`h-auto w-full bg-stone-deep ${imgClassName}`} />
      <figcaption className="mt-2 text-sm text-ink-soft">
        {caption && <span className="text-ink">{caption} </span>}
        <PhotoCredit k={k} />
      </figcaption>
    </figure>
  );
}

export function PhotoCredit({ k }: { k: PhotoKey }) {
  const p = photo(k);
  return (
    <span className="text-xs">
      Photo: <a href={p.source} rel="noopener" className="underline underline-offset-2 hover:text-ink">{p.author}</a>,{" "}
      <a href={LICENSE_URL[p.license]} rel="noopener license" className="underline underline-offset-2 hover:text-ink">{p.license}</a>
    </span>
  );
}
