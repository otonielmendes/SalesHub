# Keystone Vibe

Template **Keystone Vibe** com tema KEYSTONE e componentes [Untitled UI](https://www.untitledui.com/react) (React Aria + Tailwind CSS). O projeto deve ser sempre guardado e referido com o nome **`keystone-vibe`** (display: "Keystone Vibe").

## O que inclui

- **Tema KEYSTONE** em `src/styles/theme.css` (cores, tokens, dark mode)
- **Componentes Untitled UI** em `src/components/` organizados pela [classificação do site Pro](https://www.untitledui.com/react/components):
  - `base/` — buttons, button-groups, badges, inputs, select, checkboxes, avatars, tooltips, etc.
  - `application/` — modals, tables, tabs, breadcrumbs, pagination, alerts, date-pickers, calendars, etc.
  - `foundations/` — featured-icon, payment-icons, logo
  - `shared-assets/` — illustrations, background-patterns
- **Skill Cursor** para a equipa obrigar o uso da biblioteca (ver abaixo)

## Criar um novo projeto

1. No GitHub: **Use this template** a partir deste repositório (ou clona o repo).
2. Guarda o projeto com o nome **`keystone-vibe`** (pasta e `package.json`).
3. Instala dependências e corre o projeto:

```bash
npm install
npm run dev
```

## Instalar a skill no Cursor (equipa)

Para que a IA e a equipa usem sempre os componentes e o tema KEYSTONE:

1. Copia a pasta **`.cursor/skills/keystone-vibe`** deste repositório para o teu Cursor:
   - Destino: **`~/.cursor/skills/keystone-vibe`**
   - Ou seja: coloca o ficheiro `SKILL.md` dentro de `~/.cursor/skills/keystone-vibe/`.
2. Reinicia o Cursor se for necessário.

**Alternativa:** Se só tiveres o ficheiro `SKILL.md`, cria a pasta `~/.cursor/skills/keystone-vibe` e coloca lá o `SKILL.md`.

Depois disso, a skill **keystone-vibe** fica ativa e obriga ao uso de `@/components/` e dos tokens do tema.

## Estrutura e classificação Untitled Pro

Os nomes das pastas em `src/components/` seguem os **slugs do site Untitled UI Pro**. Ao adicionar mais componentes com o CLI (`npx untitledui@latest add ...`), mantém os ficheiros nestas categorias. Referência: [Untitled UI React — Components](https://www.untitledui.com/react/components).

## Scripts

| Comando   | Descrição        |
|----------|------------------|
| `npm run dev`   | Servidor de desenvolvimento |
| `npm run build` | Build de produção           |
| `npm run start` | Servidor de produção        |
| `npm run lint`  | ESLint                      |
