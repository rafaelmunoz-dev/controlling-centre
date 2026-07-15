# Drizzle ORM sobre Prisma

**Fecha:** 2026-07-15
**Estado:** Aceptada

## Contexto

Hay que elegir ORM para el acceso a PostgreSQL. El proyecto anterior ya
se migró a Drizzle, y las queries previstas para el MVP son en buena
parte agregaciones financieras (sumas, agrupaciones, joins).

## Decisión

Se usa Drizzle ORM.

## Alternativas consideradas

- **Prisma**: más popular, mejor DX de alto nivel, pero motor de query
  propio menos transparente y curva de aprendizaje adicional para el
  equipo. Descartada.

## Consecuencias

- Cero curva de aprendizaje: ya se domina de la migración del proyecto
  anterior.
- Más liviano y más cercano a SQL, favorable para queries de agregación
  financiera.
- Migraciones versionadas con `drizzle-kit` (ver `drizzle.config.ts` y
  `drizzle/`).
- Compatible con Azure Database for PostgreSQL sin cambios (ver
  [[0002-azure-infrastructure]]).
