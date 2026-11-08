import { Link } from "@/i18n/navigation";
import { JsonLd } from "./json-ld";
import { SITE } from "@/lib/site";

export function Breadcrumbs({ items, locale = "en" }: { items: { name: string; href: string }[]; locale?: string }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={it.href} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden>›</span>}
            {i < items.length - 1 ? <Link href={it.href} className="inline-block py-1.5 hover:text-ink">{it.name}</Link> : <span aria-current="page" className="text-ink">{it.name}</span>}
          </li>
        ))}
      </ol>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: `${SITE.url}/${locale}${it.href === "/" ? "" : it.href}` })) }} />
    </nav>
  );
}
