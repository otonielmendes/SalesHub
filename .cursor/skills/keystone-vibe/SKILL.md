---
name: keystone-vibe
description: Use the KEYSTONE design system and Untitled UI components in this project. Apply when building UI, choosing components, or styling. Enforce use of @/components and theme tokens.
---

# Keystone Vibe — Design system e componentes

Este projeto usa o design system **Keystone Vibe** (tema KEYSTONE + componentes Untitled UI). O repositório e o projeto devem sempre usar o nome **`keystone-vibe`** (display: "Keystone Vibe").

## Quando usar esta skill

Ativar sempre que o utilizador estiver a criar ou alterar UI: páginas, formulários, listas, botões, modais, tabelas, headers, navegação, etc.

## Antes de desenhar ou implementar

**Obrigatório:** Antes de começar a desenhar ou a escrever código de UI, fazer uma **pesquisa na biblioteca** do projeto para identificar componentes que atendam à necessidade:

1. **Percorrer** `src/components/base/`, `src/components/application/`, `src/components/foundations/` e `src/components/shared-assets/` (ou usar busca no código por funcionalidade: tabela, modal, formulário, etc.).
2. **Identificar** quais componentes existem que cobrem o caso (ex.: tabela com filtros → `application/tables`; formulário → `base/inputs`, `base/select`, `base/checkboxes`; página com header → `application/page-headers` ou `application/section-headers`).
3. **Só depois** de confirmar o que está disponível (ou o que falta) é que se desenha ou implementa — reutilizando sempre o que já existir na biblioteca.

Não avançar para a implementação sem ter feito esta pesquisa. Se não houver componente que atenda, indicar o que falta e sugerir adicionar via CLI (`npx untitledui@latest add <slug> --yes`) antes de criar algo do zero.

## Regra obrigatória

- **Não criar componentes de UI do zero** quando existir um equivalente em `@/components/`.
- **Importar e usar** os componentes da biblioteca:

  | Categoria | Caminho | Exemplos (slugs Untitled Pro) |
  |-----------|---------|-------------------------------|
  | **Base components** | `@/components/base/` | `buttons`, `button-groups`, `badges`, `tags`, `dropdowns`, `select`, `inputs`, `textareas`, `toggles`, `checkboxes`, `radio-buttons`, `avatars`, `tooltips`, `progress-indicators`, `sliders`, `featured-icons`, `illustrations` |
  | **Application UI components** | `@/components/application/` | `page-headers`, `section-headers`, `section-footers`, `header-navigations`, `sidebar-navigations`, `modals`, `command-menus`, `metrics`, `slideout-menus`, `pagination`, `progress-steps`, `activity-feeds`, `messaging`, `tabs`, `tables`, `breadcrumbs`, `alerts`, `notifications`, `date-pickers`, `calendars`, `content-dividers`, `loading-indicators`, `empty-states`, `code-snippets` |
  | **Foundations** | `@/components/foundations/` | `featured-icon`, `payment-icons`, `logo` |
  | **Shared assets** | `@/components/shared-assets/` | `illustrations`, `background-patterns` |

- Usar os **nomes de pasta (slugs)** da [classificação Untitled UI Pro](https://www.untitledui.com/react/components). Se uma pasta no projeto tiver nome ligeiramente diferente (ex.: `date-picker`), importar usando o caminho real existente; ao adicionar novos componentes via CLI Untitled, manter os slugs oficiais.

## Estilo KEYSTONE

- Cores e tokens vêm de **`src/styles/theme.css`**.
- Usar **classes Tailwind com tokens do tema**: `bg-brand-500`, `text-gray-900`, `border-gray-200`, `bg-error-50`, `text-success-600`, etc.
- **Não definir cores hex/rgb diretas**; usar sempre os tokens do tema (brand, gray, error, warning, success, moss, orange-dark, purple).

## Convenções técnicas

- **React Aria** — não misturar com Radix UI para estes componentes.
- **Ícones** — preferir `@untitledui/icons`.
- **Classes condicionais** — usar `tailwind-merge` para combinar classes.

## Novos projetos

Para iniciar um novo projeto com este sistema: usar o repositório **keystone-vibe** como template no GitHub ("Use this template") ou clonar o repo. O projeto deve ser guardado/referido com o nome **`keystone-vibe`** (repo, pasta, `package.json`; display "Keystone Vibe").
