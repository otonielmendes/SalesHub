import { getRequestConfig } from "next-intl/server";
import { getLocale, loadMessages } from "@/lib/i18n/locale";

export default getRequestConfig(async () => {
  const locale = await getLocale();
  const messages = await loadMessages(locale);

  return {
    locale,
    messages,
  };
});
