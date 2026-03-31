import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Koin Sales Hub",
  description: "Portal interno do time comercial da Koin Antifraude",
  icons: {
    icon: [{ url: "/koin-logomark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/koin-logomark.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
