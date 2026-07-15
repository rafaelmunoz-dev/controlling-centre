# Infraestructura en Microsoft Azure (región UE)

**Fecha:** 2026-07-15
**Estado:** Aceptada

## Contexto

La empresa ya opera en el ecosistema Microsoft: tenant `akhtar.eu`, M365,
Teams, y el IT interno (MVS/MVT) administra esa infraestructura. Hay que
elegir dónde alojar la aplicación y la base de datos.

## Decisión

La infraestructura se despliega en Microsoft Azure, en región UE.

## Alternativas consideradas

- **Hetzner + Coolify**: opción más barata y con más control directo,
  pero fuera del ecosistema Microsoft ya existente. Descartada — añadiría
  fricción operativa y de autenticación (habría que integrar Entra ID
  con infraestructura externa) sin beneficio claro dado que el IT interno
  ya opera en Azure/M365.

## Consecuencias

- Menor fricción operativa: mismo ecosistema que M365/Teams, gestionado
  por el mismo equipo de IT interno (MVS/MVT).
- Menor fricción de autenticación: integración nativa con Entra ID
  (ver [[0003-entra-id-auth]]).
- Cumplimiento DSGVO facilitado por regiones EU nativas de Azure.
- Azure Database for PostgreSQL como base de datos gestionada (compatible
  con Drizzle sin cambios, ver [[0004-drizzle-orm]]).
