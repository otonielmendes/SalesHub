"use client";

import { File06, Plus } from "@untitledui/icons";
import { EmptyState } from "@/components/application/empty-states/empty-state";
import { Button } from "@/components/base/buttons/button";

/** Empty state estilo [Untitled UI — Empty states](https://www.untitledui.com/react/components/empty-states), com acento brand. */
export function HistoricoEmptyState() {
    return (
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-secondary bg-primary p-8 shadow-xs md:p-12">
            <EmptyState size="lg" className="max-w-full">
                <EmptyState.Header pattern="none">
                    <EmptyState.FeaturedIcon icon={File06} color="brand" theme="gradient" />
                </EmptyState.Header>
                <EmptyState.Content>
                    <EmptyState.Title>Nenhum backtest no histórico</EmptyState.Title>
                    <EmptyState.Description>
                        Ainda não há análises salvas. Carregue um CSV em Testagens e use Salvar para ver prospect,
                        ficheiro e métricas listados aqui.
                    </EmptyState.Description>
                </EmptyState.Content>
                <EmptyState.Footer className="w-full flex-col sm:w-auto sm:flex-row sm:justify-center">
                    <Button color="secondary" size="md" href="/">
                        Voltar ao início
                    </Button>
                    <Button color="primary" size="md" href="/backtests/testagens" iconLeading={Plus}>
                        Nova testagem
                    </Button>
                </EmptyState.Footer>
            </EmptyState>
        </div>
    );
}
