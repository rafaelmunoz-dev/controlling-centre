# Design System

## Responsive

Todo componente/pagina nueva debe funcionar en mobile (grid de 1 columna,
tablas con scroll horizontal, sidebar colapsable) desde el momento en que se
construye — no se agrega responsive despues.

Reglas concretas:

- **Grids de tarjetas KPI**: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (o
  equivalente) — nunca un numero fijo de columnas.
- **Tablas**: siempre envueltas en un contenedor `overflow-x-auto` (no dejar
  que la tabla desborde el layout de la pagina).
- **Formularios**: campos apilados verticalmente por defecto
  (`flex flex-col gap-*`); usar columnas solo a partir de `sm:`/`md:` si el
  formulario lo justifica.
- **Sidebar**: usa el componente `Sidebar` de shadcn (`src/components/ui/sidebar.tsx`),
  que ya colapsa a un drawer (`Sheet`) por debajo del breakpoint `md`. No
  reimplementar este comportamiento.
- **Topbar**: los controles (selector de entidad, selector de periodo, acciones)
  deben poder apilarse (`flex flex-wrap`) en pantallas chicas en vez de
  desbordar horizontalmente.
