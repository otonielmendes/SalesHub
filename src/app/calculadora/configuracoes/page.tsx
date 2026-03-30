"use client";

import { Home01 } from "@untitledui/icons";
import { Breadcrumbs } from "@/components/application/breadcrumbs/breadcrumbs";
import { Button } from "@/components/base/buttons/button";

export default function CalculadoraConfiguracoesPage() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8">
      <Breadcrumbs className="mb-4">
        <Breadcrumbs.Item href="/calculadora" icon={Home01}>
          Calculadora
        </Breadcrumbs.Item>
        <Breadcrumbs.Item>Configurações</Breadcrumbs.Item>
      </Breadcrumbs>

      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-primary">Configurações da Calculadora</h1>
        <Button color="secondary" size="md" href="/calculadora">
          Voltar ao histórico
        </Button>
      </div>

      <div className="rounded-xl border border-secondary bg-primary p-6 shadow-xs ring-1 ring-secondary ring-inset">
        <p className="text-sm text-tertiary">
          Preferências e opções específicas da Calculadora (Fraud Health Check) estarão disponíveis em breve.
        </p>
        <p className="mt-3 text-sm text-quaternary">
          Por agora, utilize o fluxo de <strong className="text-secondary">Análise</strong> para criar assessments e{" "}
          <strong className="text-secondary">Histórico</strong> para rever os registos guardados.
        </p>
        <div className="mt-6">
          <Button color="primary" size="md" href="/calculadora/new">
            Ir para Análise
          </Button>
        </div>
      </div>
    </div>
  );
}
