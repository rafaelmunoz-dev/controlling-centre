# Arquitectura

> Documento vivo — se actualiza a medida que evoluciona el proyecto.

## Qué es el proyecto

Controlling Center es la herramienta interna de reporting financiero de
LPO International, dirigida al CFO. Consolida datos automáticos de
sistemas externos (Clockodo, DATEV) por entidad/empresa, en una
estructura jerárquica de grupos, reemplazando la captura manual del
prototipo anterior.

## Diagrama de referencia

El diagrama de arquitectura (Excalidraw) vive en `docs/diagrams/`. La
carpeta está vacía por ahora — se añadirá al exportar el diagrama.

## Convención Clockodo

Registros no facturables de clientes externos deben incluir en la
descripción: razón y quien aprobó.

## Decisiones clave

- [0001 — Reconstruir desde cero, no evolucionar](decisions/0001-rebuild-not-evolve.md)
- [0002 — Infraestructura en Microsoft Azure](decisions/0002-azure-infrastructure.md)
- [0003 — Autenticación vía Microsoft Entra ID](decisions/0003-entra-id-auth.md)
- [0004 — Drizzle ORM sobre Prisma](decisions/0004-drizzle-orm.md)
- [0005 — No es un SaaS multi-cliente](decisions/0005-not-a-saas.md)
