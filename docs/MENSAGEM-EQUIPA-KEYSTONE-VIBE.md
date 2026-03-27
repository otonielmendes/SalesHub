# Keystone Vibe — Compartir con el equipo

**Texto listo para copiar y enviar (Slack, email, etc.):**

---

## Keystone Vibe — Design system y plantilla para el equipo

**Keystone Vibe** es nuestra plantilla y design system compartido: combina el tema de colores **KEYSTONE** (paleta KOIN) con los componentes **Untitled UI** (React Aria + Tailwind). Sirve para que los proyectos nuevos partan de la misma base visual y para que todo el equipo use la misma biblioteca de componentes.

**Para qué sirve:**
- **Proyectos nuevos** — Empezar desde la plantilla y tener ya el tema KEYSTONE y los componentes instalados.
- **Consistencia** — Botones, inputs, modales, tablas, etc. salen de `@/components/` y respetan los tokens KEYSTONE.
- **Skill en Cursor** — Una skill que obliga a usar estos componentes; quien la instale tendrá a la IA sugiriendo siempre imports de `@/components/` y colores del tema.

---

### Repositorio (plantilla)

**Enlace:** [https://github.com/otomendes/keystone-vibe](https://github.com/otomendes/keystone-vibe)

Para crear un proyecto nuevo: en GitHub, "Use this template" (o clonar). El proyecto debe guardarse con el nombre **keystone-vibe** (o renombrar la carpeta según el producto).

---

### Instalar la skill en Cursor

1. Abre https://github.com/otomendes/keystone-vibe
2. Entra en la carpeta **.cursor/skills/keystone-vibe** y descarga el **SKILL.md** (o clona el repo).
3. En tu PC, crea la carpeta **~/.cursor/skills/keystone-vibe** y coloca ahí el **SKILL.md**.
4. Reinicia Cursor si hace falta.

**Ruta en Mac/Linux:** `~/.cursor/skills/keystone-vibe/SKILL.md`

Con eso, la skill **keystone-vibe** queda activa y obliga al uso de `@/components/` y de los tokens del tema KEYSTONE.

---

### Enlaces rápidos

| Qué | Enlace |
|-----|--------|
| **Repositorio Keystone Vibe (plantilla)** | [github.com/otomendes/keystone-vibe](https://github.com/otomendes/keystone-vibe) |
| **Carpeta de la skill en el repo** | [.cursor/skills/keystone-vibe](https://github.com/otomendes/keystone-vibe/tree/main/.cursor/skills/keystone-vibe) |
| **Componentes Untitled UI Pro** | [untitledui.com/react/components](https://www.untitledui.com/react/components) |

---

### Resumen para el equipo

- **Plantilla:** https://github.com/otomendes/keystone-vibe — usar "Use this template" para proyectos nuevos.
- **Skill Cursor:** Copiar `.cursor/skills/keystone-vibe` (o solo el `SKILL.md`) a `~/.cursor/skills/keystone-vibe/` para activar el uso obligatorio de los componentes y del tema KEYSTONE.

Si tienes dudas, pregunta en el canal del equipo.
