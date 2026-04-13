import type { ReactNode } from "react";
import { KoinHeader } from "@/components/backtest/KoinHeader";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F2F4F6]">
      <KoinHeader />
      <main className="mx-auto w-full max-w-container px-4 py-6 md:px-8">{children}</main>
    </div>
  );
}
