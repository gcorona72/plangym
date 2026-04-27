# Plan Comida

PWA local-first para planificación de comidas altas en proteína, pensada para ectomorfos y con ingredientes fáciles de encontrar en supermercados españoles.

## Qué incluye

- Onboarding inicial con perfil, actividad y preferencias.
- Plan diario con 3 comidas principales y opciones para intercambiar.
- Biblioteca de recetas filtrable por ingredientes y categoría.
- Vista de progreso con gráficos locales.
- Lista de la compra por secciones de supermercado.
- Ajustes persistentes en IndexedDB.
- Soporte offline con `service worker`.

## Ejecutar en local

```bash
npm install
npm start
```

## Build de producción

```bash
npm run build
```

## Notas técnicas

Este proyecto se ha implementado en Vanilla JavaScript con Webpack para funcionar ya en el workspace actual, manteniendo la arquitectura local-first y una base fácil de ampliar.

### Nueva base de arquitectura

- `main.js` actúa como bootstrap principal.
- `src/utils/helpers.js` concentra utilidades puras compartidas.
- `src/data/` guarda la metadata estática.
- `src/services/` separa lógica de negocio y acceso a APIs.
- `src/db/` encapsula IndexedDB con fallback en memoria.
- `src/store/` expone un store singleton con pub/sub.
- `src/components/` prepara la división futura de vistas.

El monolito actual sigue vivo detrás del bootstrap para no romper el comportamiento mientras se sigue migrando por fases.

