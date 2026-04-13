"use client";

import { Plus, TrendUp01 } from "@untitledui/icons";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/application/empty-states/empty-state";
import { Button } from "@/components/base/buttons/button";

/** Empty state estilo [Untitled UI — Empty states](https://www.untitledui.com/react/components/empty-states), com acento brand. */
export function HistoricoEmptyState() {
    const t = useTranslations("backtests.empty");

    return (
        <div className="mx-auto w-full max-w-2xl rounded-2xl border border-secondary bg-primary p-8 shadow-xs ring-1 ring-secondary ring-inset md:p-12">
            <EmptyState size="lg" className="max-w-full">
                <EmptyState.Header pattern="none">
                    <EmptyState.FeaturedIcon icon={TrendUp01} color="brand" theme="gradient" />
                </EmptyState.Header>
                <EmptyState.Content>
                    <EmptyState.Title>{t("title")}</EmptyState.Title>
                    <EmptyState.Description>
                        {t("description")}
                    </EmptyState.Description>
                </EmptyState.Content>
                <EmptyState.Footer className="w-full flex-col sm:w-auto sm:flex-row sm:justify-center">
                    <Button color="primary" size="md" href="/backtests/testagens" iconLeading={Plus}>
                        {t("buttonNew")}
                    </Button>
                </EmptyState.Footer>
            </EmptyState>
        </div>
    );
}
