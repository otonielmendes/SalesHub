# Como adicionar componentes Untitled UI ao projeto

Este guia segue a abordagem recomendada: identificar os componentes necessários para as interfaces do projeto e adicioná-los via CLI. O código fica no nosso repositório; ícones continuam via pacote npm.

---

## 1. Referência — Classificação Untitled UI Pro

Lista oficial: [untitledui.com/react/components](https://www.untitledui.com/react/components)

| Categoria | Exemplos de componentes (slug para o CLI) |
|-----------|--------------------------------------------|
| **Base** | `buttons`, `button-groups`, `badges`, `tags`, `dropdowns`, `select`, `inputs`, `textareas`, `toggles`, `checkboxes`, `radio-buttons`, `avatars`, `tooltips`, `progress-indicators`, `sliders`, `featured-icon` |
| **Application** | `page-headers`, `section-headers`, `section-footers`, `header-navigations`, `sidebar-navigations`, `modals`, `command-menus`, `metrics`, `slideout-menus`, `pagination`, `progress-steps`, `activity-feeds`, `messaging`, `tabs`, `tables`, `breadcrumbs`, `alerts`, `notifications`, `date-pickers`, `calendars`, `content-dividers`, `loading-indicators`, `empty-states`, `code-snippets`, `charts-base` |
| **Marketing** | `header-navigations`, `header-sections`, `footers`, `pricing-sections`, `cta-sections`, etc. |

Já temos no projeto a maior parte dos listados acima. Para **novos** componentes, usar os comandos abaixo.

---

## 2. Comando para adicionar um componente

Com o projeto na pasta atual e com login Untitled UI feito (`npx untitledui@latest login`):

```bash
npx untitledui@latest add <nome-do-componente> --yes
```

Exemplos:

```bash
npx untitledui@latest add sidebar-navigation --yes
npx untitledui@latest add page-header carousel --yes
```

Os ficheiros são criados em `src/components/` (base, application, etc.) conforme o `components.json`. Depois: `git add` e commit.

---

## 3. Comando para adicionar um template de página

Para páginas completas (dashboard, settings, etc.):

```bash
npx untitledui@latest example <nome-do-example> --yes --include-all-components
```

Exemplos de nomes: `dashboards-01`, `dashboards-01/05`, `settings-pages-01`, `informational-pages-02`, `informational-pages-02/02`.

---

## 4. Checklist antes de adicionar

1. **Interfaces** — Listar ecrãs/fluxos que vais construir (ex.: lista de chargebacks, detalhe, formulário, dashboard).
2. **Componentes** — Para cada ecrã, anotar o que precisas (tabela, filtros, modal, breadcrumb, botões, etc.).
3. **Consultar** — Ver na [documentação Untitled UI](https://www.untitledui.com/react/components) o nome exato do componente (slug).
4. **Adicionar** — Correr `npx untitledui@latest add <slug> --yes` (ou `example` para páginas).
5. **Commit** — Incluir os novos ficheiros no repo.

---

## 5. Ícones

- Continuam a vir do pacote **`@untitledui/icons`** (e do pacote PRO, se tiverem licença).
- Não é preciso copiar ícones para o repo. No código: `import { NomeDoIcone } from "@untitledui/icons"`.
- Catálogo e nomes: [untitledui.com/icons](https://www.untitledui.com/icons).

---

## 6. Resumo

| Objetivo | Ação |
|----------|------|
| Novo componente (ex.: carousel) | `npx untitledui@latest add carousel --yes` |
| Vários de uma vez | `npx untitledui@latest add page-header carousel --yes` |
| Página completa (ex.: dashboard) | `npx untitledui@latest example dashboards-01/05 --yes --include-all-components` |
| Ver o que já existe no projeto | Pastas em `src/components/base/` e `src/components/application/` |

Depois de cada adição, conferir em `src/components/` e fazer commit. Assim o projeto e o GitHub ficam com só o que é necessário para as vossas interfaces.
