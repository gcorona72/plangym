# PlanGym v2

App personal de **entrenamiento + nutrición + sueño** para ectomorfo en volumen.
PWA local-first (sin servidor, sin cuenta, sin sync — todos los datos viven en tu móvil).

## 🚀 Cómo arrancarla en local

Necesitas Node.js 18+ instalado.

```bash
cd v2
npm install
npm run dev
```

Abre lo que muestre la consola (normalmente `http://localhost:5173`).

> 💡 El servidor también acepta conexiones desde tu LAN, así que puedes abrirla en el móvil con la IP de tu PC (`http://192.168.x.x:5173`) si estás en la misma WiFi.

## 📱 Instalar como app en el móvil

1. Deploya a producción (ver más abajo)
2. Abre la URL en Chrome/Safari del móvil
3. Menú → "Añadir a pantalla de inicio"
4. Listo, ya tienes la app instalada y funciona offline

## ☁️ Deploy (gratis)

### Opción A — Netlify (la más fácil)

1. Sube este proyecto a un repo de GitHub
2. Ve a [netlify.com](https://netlify.com) → "Add new site" → conecta el repo
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Deploy

### Opción B — Vercel

1. Sube a GitHub
2. [vercel.com](https://vercel.com) → "Import project"
3. Framework: Vite. El resto auto-detectado.

### Opción C — GitHub Pages

```bash
npm run build
# Sube el contenido de dist/ a la rama gh-pages
```

## 🧠 Funcionalidades

### ✅ Implementado (Fase 1)
- Onboarding completo (sexo, edad, medidas, actividad, objetivo, equipamiento del gym)
- Cálculo de macros (BMR Mifflin-St Jeor, TDEE, objetivo según meta)
- Plan de entrenamiento Upper/Lower 4 días con frecuencia 2x por grupo muscular
- **Equivalentes calistenia para cada día** (mismos músculos, sin equipamiento)
- **Filtrado por equipamiento disponible en tu gym**
- Modo gym en vivo:
  - Registro de series (kg, reps, RIR)
  - Temporizador de descanso con vibración + sonido
  - Sugerencia de peso basada en sesiones pasadas (double progression)
- Nutrición: recetas con macros, registro de comidas, progreso diario
- Sueño: registro de hora dormir/levantar, duración, calidad
- Dark mode (por defecto)
- PWA instalable + offline
- Export/Import JSON para backup
- Reset total

### 🚧 Pendiente / por mejorar
- [ ] Editor de recetas custom + añadir tus propias
- [ ] Lista de la compra agregada (con cantidades sumadas)
- [ ] Editor de programa de entrenamiento personalizado
- [ ] Gráficos de progreso (peso corporal, fuerza, sueño)
- [ ] Notificaciones push para recordatorio de dormir
- [ ] Fotos de progreso
- [ ] Animaciones de ejercicios (vídeos/gifs)
- [ ] Calculadora de 1RM
- [ ] Vista calendario de sesiones pasadas
- [ ] Iconos PWA reales (ahora hay placeholder)

## 🗃️ Arquitectura

```
v2/
├── src/
│   ├── lib/                    # Lógica pura (sin UI)
│   │   ├── types.ts            # Tipos del dominio (ÚNICA fuente de verdad)
│   │   ├── equipmentCatalog.ts # Catálogo de equipamiento
│   │   ├── nutrition/          # Cálculos de macros
│   │   ├── training/           # Filtro equipamiento + sugerencia peso
│   │   └── gym/                # Timer de descanso
│   ├── db/
│   │   ├── database.ts         # Dexie + export/import
│   │   ├── seedRunner.ts       # Carga datos iniciales (idempotente)
│   │   └── seeds/              # Ejercicios, ingredientes, recetas, programa
│   ├── stores/                 # Stores de Svelte (profile, navigation)
│   ├── components/             # Pantallas y componentes
│   ├── App.svelte              # Router por estado
│   ├── main.ts                 # Entry point
│   └── app.css                 # Tailwind + utilidades
├── public/                     # Assets estáticos
├── vite.config.ts              # Config Vite + PWA
├── tailwind.config.js          # Config Tailwind
└── tsconfig.json               # Config TypeScript
```

## 🔧 Stack

- **[Svelte 4](https://svelte.dev)** — Framework UI minimalista
- **[Vite](https://vitejs.dev)** — Bundler ultrarrápido
- **TypeScript** — Tipos estrictos en todo el dominio
- **[Tailwind CSS](https://tailwindcss.com)** — Estilos utility-first
- **[Dexie.js](https://dexie.org)** — Wrapper sobre IndexedDB
- **[vite-plugin-pwa](https://vite-pwa-org.netlify.app)** — Service worker + manifest

## 🧬 Decisiones de diseño

### ¿Por qué local-first sin sync?
- Los datos de fitness son **tuyos y privados**.
- Sin servidor = cero costes, cero mantenimiento, cero downtime.
- El móvil va contigo a todos lados → tener todo ahí basta.
- Backup manual con un botón = más simple que cualquier sync automático.

### ¿Por qué Upper/Lower 4 días?
La literatura (Schoenfeld 2016, ISSN) recomienda **frecuencia 2x por grupo muscular** para hipertrofia óptima en intermedios. El antiguo bro-split (1x semana por músculo) es subóptimo.

### ¿Por qué Mifflin-St Jeor?
Es la fórmula de BMR más precisa para población general según la ADA (Academia Nutrición & Dietética).

### Macros para ectomorfo en volumen
- **Surplus**: +400 kcal sobre TDEE (rango 300-500 recomendado)
- **Proteína**: 2.2 g/kg (rango 1.6-2.2 según ISSN para hipertrofia)
- **Grasas**: 0.9 g/kg (rango 0.7-1.0)
- **Carbos**: el resto

## 🐛 Reportar problemas

Como esto es tu propia app personal — abre el código y arregla 😄
La lógica está separada en `src/lib/` (sin UI) para que sea fácil testear y modificar.
