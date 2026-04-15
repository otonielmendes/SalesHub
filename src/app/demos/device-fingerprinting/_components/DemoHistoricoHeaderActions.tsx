"use client";

import { Plus } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";

export function DemoHistoricoHeaderActions({ label }: { label: string }) {
  return (
    <Button
      size="md"
      iconLeading={Plus}
      href="/demos/device-fingerprinting/nova"
      className="shrink-0 bg-[#10181B] text-white hover:bg-[#182225] [&_[data-icon=leading]]:text-white"
    >
      {label}
    </Button>
  );
}
