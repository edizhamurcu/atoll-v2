import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export type TravelSectionKey = "north" | "south" | "driving" | "posts";

const ITEMS: { key: TravelSectionKey; href: string }[] = [
  { key: "north", href: "/north-cyprus-guide" },
  { key: "south", href: "/south-cyprus-guide" },
  { key: "driving", href: "/driving-in-south-cyprus" },
  { key: "posts", href: "/blog#posts" },
];

/** The four travel headings (North Cyprus travel, South Cyprus travel, driving in the South, blog posts), shared by the blog and the guides. */
export async function TravelNav({ active, className = "" }: { active: TravelSectionKey; className?: string }) {
  const t = await getTranslations("travel");
  return (
    <nav aria-label={t("navLabel")} className={className}>
      <ul className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
        {ITEMS.map((i) => {
          const on = i.key === active;
          return (
            <li key={i.key} className="shrink-0">
              <Link
                href={i.href}
                aria-current={on ? "page" : undefined}
                className={`inline-flex min-h-11 items-center whitespace-nowrap rounded-full border px-4 text-sm font-semibold transition-colors ${on ? "border-ink bg-ink text-white" : "border-ink/15 bg-paper text-ink hover:border-ink/40"}`}
              >
                {t(i.key)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
