"use client";

import { Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

type Props = {
  label: string;
};

export function HistoricoHeaderActions({ label }: Props) {
  return (
    <Button
      size="md"
      iconLeading={Plus}
      href="/backtests/testagens"
      className="shrink-0 bg-[#10181B] text-white hover:bg-[#182225] [&_[data-icon=leading]]:text-white"
    >
      {label}
    </Button>
  );
}
