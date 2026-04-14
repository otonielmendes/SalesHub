import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Koin Sales Hub",
};

export default async function ConfiguracoesPage() {
  const t = await getTranslations("backtests.configuracoes");

  return (
    <div className="mx-auto max-w-container px-6 py-8 lg:px-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-display-xs font-semibold text-primary">{t("title")}</h1>
          <p className="mt-1 text-md text-tertiary">{t("description")}</p>
        </div>
        <div className="rounded-xl border border-secondary bg-primary p-8 text-center">
          <p className="text-md text-tertiary">{t("comingSoon")}</p>
        </div>
      </div>
    </div>
  );
}
