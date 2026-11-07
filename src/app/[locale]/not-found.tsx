import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("errors");
  return (
    <div className="mx-auto max-w-3xl px-5 py-24">
      <h1 className="text-4xl font-extrabold">{t("notFound")}</h1>
      <Link href="/" className="btn-quiet mt-6">{t("home")}</Link>
    </div>
  );
}
