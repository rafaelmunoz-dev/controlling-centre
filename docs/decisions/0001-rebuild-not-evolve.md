# Reconstruir desde cero en vez de evolucionar el Controlling Center anterior

**Fecha:** 2026-07-15
**Estado:** Aceptada

## Contexto

Existe un Controlling Center previo (React + Express + Clerk) usado como
prototipo interno. Ahora hay un requisito claro y concreto: el MVP real
para Richard (CFO), centrado en datos financieros que llegan de forma
automática vía API (Clockodo, DATEV), no en captura manual.

El modelo de datos del proyecto anterior se basaba en un campo `jsonb`
genérico pensado para captura manual flexible. Ese modelo no encaja con
el nuevo requisito central: ingesta automática y estructurada desde
sistemas externos.

## Decisión

Se descarta continuar el Controlling Center anterior. Se reconstruye
limpio (Next.js 16 + TypeScript + Drizzle) para el MVP real. El proyecto
anterior queda archivado como referencia visual y de diseño (UI/UX),
no como base de código.

## Alternativas consideradas

- **Evolucionar el proyecto anterior**: migrar el `jsonb` genérico a un
  esquema tipado por entidad. Descartada — el coste de desmontar el
  modelo de datos y las dependencias (Express, Clerk) era mayor que
  empezar limpio, y el resultado final habría sido indistinguible de
  una reconstrucción.

## Consecuencias

- El proyecto anterior se conserva solo como referencia (diseño visual).
- El nuevo modelo de datos se diseña desde cero alrededor de entidades
  financieras estructuradas, no de un blob genérico.
- Se pierde el trabajo de UI ya hecho como código reutilizable, pero se
  reutiliza como referencia de diseño.
