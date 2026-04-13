import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, loadMessages } from "@/lib/i18n/locale";
import "./globals.css";

export const metadata: Metadata = {
  title: "Koin Sales Hub",
  description: "Portal interno do time comercial da Koin Antifraude",
  icons: {
    icon: [{ url: "/koin-logomark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/koin-logomark.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await loadMessages(locale);

  return (
    <html lang={locale}>
      <body className="antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
