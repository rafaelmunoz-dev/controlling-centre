# Design System Reference — Navy & Gold Glass

> Origen: **LPO Controlling Center** (proyecto anterior, archivado). Valores extraídos directamente de `index.css`. Punto de partida reutilizable para mantener identidad visual consistente en el proyecto nuevo (`controlling-centre`).

---

## Stack

- **Tailwind CSS v4** — sin `tailwind.config.*`. Tokens vía CSS custom properties, importados con `@import "tailwindcss"` en el CSS global.
- **shadcn/ui** como librería base de componentes.
- Formato de color: **HSL** (canales sin unidad, sintaxis Tailwind/shadcn: `hsl(var(--token))`).

---

## Colores — Light mode (`:root`)

```css
--background: 0 0% 100%;
--foreground: 214 52% 24%;
--border: 214 20% 90%;

--card: 0 0% 100%;
--card-foreground: 214 52% 24%;
--card-border: 214 20% 90%;

--sidebar: 0 0% 100%;
--sidebar-foreground: 214 52% 24%;
--sidebar-border: 214 20% 90%;
--sidebar-primary: 214 52% 24%;
--sidebar-primary-foreground: 0 0% 100%;
--sidebar-accent: 214 20% 96%;
--sidebar-accent-foreground: 214 52% 24%;
--sidebar-ring: 214 52% 24%;

--popover: 0 0% 100%;
--popover-foreground: 214 52% 24%;
--popover-border: 214 20% 90%;

--primary: 214 52% 24%;
--primary-foreground: 0 0% 100%;

--secondary: 214 20% 96%;
--secondary-foreground: 214 52% 24%;

--muted: 214 20% 96%;
--muted-foreground: 214 20% 50%;

--accent: 43 65% 56%;
--accent-foreground: 214 52% 24%;

--destructive: 0 84% 60%;
--destructive-foreground: 0 0% 100%;

--input: 214 20% 90%;
--ring: 214 52% 24%;

--brass: 43 65% 56%;

--chart-1: 214 52% 24%;
--chart-2: 43 65% 56%;
--chart-3: 160 60% 45%;
--chart-4: 280 65% 60%;
--chart-5: 340 75% 55%;
```

## Colores — Dark mode (`.dark`)

```css
--background: 214 52% 9%;
--foreground: 210 20% 98%;
--border: 214 30% 18%;

--card: 214 48% 12%;
--card-foreground: 210 20% 98%;
--card-border: 214 30% 18%;

--sidebar: 214 48% 12%;
--sidebar-foreground: 210 20% 98%;
--sidebar-border: 214 30% 18%;
--sidebar-primary: 43 65% 56%;
--sidebar-primary-foreground: 214 52% 12%;
--sidebar-accent: 214 30% 18%;
--sidebar-accent-foreground: 210 20% 98%;
--sidebar-ring: 43 65% 56%;

--popover: 214 48% 12%;
--popover-foreground: 210 20% 98%;
--popover-border: 214 30% 18%;

--primary: 210 60% 72%;
--primary-foreground: 214 52% 12%;

--secondary: 214 30% 18%;
--secondary-foreground: 210 20% 98%;

--muted: 214 30% 18%;
--muted-foreground: 215 20% 65%;

--accent: 43 65% 56%;
--accent-foreground: 214 52% 12%;

--destructive: 0 62% 50%;
--destructive-foreground: 210 20% 98%;

--input: 214 30% 18%;
--ring: 43 65% 56%;

--brass: 43 70% 60%;

--chart-1: 210 60% 72%;
--chart-2: 43 70% 60%;
--chart-3: 160 60% 50%;
--chart-4: 280 65% 68%;
--chart-5: 340 75% 65%;
```

## Colores primarios de referencia rápida

- **Navy** (primary): `#1E3A5F` — HSL `214 52% 24%`
- **Gold** (accent/brass): `#D4A94A` — HSL `43 65% 56%`

---

## Tipografía

- Fuente principal: **Plus Jakarta Sans**, vía variable `--app-font-sans`.

## Radios (border-radius)

- Escala centralizada: `--radius-sm` → `--radius-3xl`.
- Base: `0.75rem`.

## Sombras

- 7 niveles, con tinte navy, centralizados como tokens (nombres a confirmar al implementar — no se extrajeron valores exactos en la sesión anterior).

---

## Utilities custom reutilizables

- `.glass-card`
- `.glass-panel`
- `.app-header`
- `.app-pill`
- `.brass-gradient`

Patrón de composición habitual: `<Card className="glass-card">` envolviendo componentes shadcn/ui estándar.

---

## Componentes shadcn/ui confirmados en uso (40+)

accordion, alert, avatar, badge, button, calendar, card, carousel, chart, checkbox, dialog, input, label, popover, progress, radio-group, scroll-area, select, separator, sheet, sidebar, skeleton, slider, sonner, switch, table, tabs, textarea, toast, toggle, tooltip.

---

## Regla de uso

Nunca usar colores Tailwind crudos (`bg-blue-600`, etc.) — siempre los tokens semánticos (`bg-primary`, `text-accent-foreground`, etc.). El proyecto anterior tenía 53 usos de colores hardcodeados fuera del sistema — no repetir ese error en el proyecto nuevo.
