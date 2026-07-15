# La aplicación no es un SaaS multi-cliente

**Fecha:** 2026-07-15
**Estado:** Aceptada

## Contexto

El modelo de datos soporta multi-entidad (grupos/empresas con jerarquía,
ver `entities` en `src/db/schema/entities.ts`). Hay que decidir si eso
implica construir un producto SaaS multi-tenant o una app interna.

## Decisión

La aplicación es interna, exclusiva para LPO International y sus
subsidiarias. No se ofrece como SaaS multi-cliente por ahora. La
arquitectura mantiene el modelo multi-entidad por si en el futuro se
decide vender el producto, pero no se implementa aislamiento
multi-tenant real ni autoservicio de registro de cuentas nuevas.

## Alternativas consideradas

- **Construir aislamiento multi-tenant completo desde ya** (row-level
  security por tenant, autoservicio de altas, facturación por cliente):
  descartada por ahora — sobre-ingeniería para un MVP de uso interno sin
  necesidad actual de vender el producto.

## Consecuencias

- El modelo `entities` con jerarquía de grupos queda disponible para una
  futura oferta multi-tenant, sin coste adicional de rediseño si se
  decide dar ese paso.
- No hay flujo de autoservicio de registro: las entidades y usuarios se
  dan de alta manualmente / vía Entra ID (ver [[0003-entra-id-auth]]).
- No hay aislamiento estricto multi-tenant (RLS, particionado por
  cliente); si en el futuro se vende el producto, esto habrá que
  añadirlo explícitamente.
