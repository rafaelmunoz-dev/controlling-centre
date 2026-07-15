# Autenticación vía Microsoft Entra ID directo

**Fecha:** 2026-07-15
**Estado:** Aceptada

## Contexto

El proyecto anterior usaba Clerk con email+password para autenticación.
La empresa ya tiene un tenant corporativo Microsoft (`akhtar.eu`) con
Entra ID gestionando identidad para Outlook/Teams/M365.

## Decisión

La autenticación se hace vía Microsoft Entra ID directo, usando el
tenant corporativo existente.

## Alternativas consideradas

- **Clerk** (usado en el proyecto anterior): dependencia de terceros
  innecesaria cuando Entra ID ya está disponible nativamente para toda
  la organización. Descartada.
- **Email + password propio**: implica gestión propia de contraseñas,
  recuperación de cuentas, y una identidad desacoplada de la corporativa.
  Descartada — duplica lo que Entra ID ya resuelve.

## Consecuencias

- Login idéntico al de Outlook/Teams: una sola identidad corporativa.
- Sin gestión de contraseñas propia (reset, hashing, políticas) en la
  aplicación.
- Acoplamiento al tenant Microsoft — coherente con la decisión de
  infraestructura en Azure (ver [[0002-azure-infrastructure]]).
- Altas/bajas de usuarios se gestionan en Entra ID, no en la app.
