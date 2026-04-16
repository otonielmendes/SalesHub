"use client";

import type { ComponentType, SVGProps } from "react";
import { WizardProgressCard } from "@/components/application/wizard/wizard-progress-card";

interface ProgressCardProps {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  completedCount: number;
  totalCount: number;
  isMandatory: boolean;
  isActive: boolean;
  onClick: () => void;
}

export function ProgressCard({
  icon: Icon,
  title,
  description,
  completedCount,
  totalCount,
  isMandatory,
  isActive,
  onClick,
}: ProgressCardProps) {
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const isComplete = completedCount === totalCount;

  return (
    <WizardProgressCard
      icon={Icon}
      title={title}
      description={description}
      meta={`${completedCount} de ${totalCount} campos`}
      progress={pct}
      state={isComplete ? "complete" : isActive ? "active" : "pending"}
      badgeLabel={isMandatory ? "Obrigatório" : "Desejável"}
      badgeTone={isMandatory ? "required" : "optional"}
      onClick={onClick}
    />
  );
}
