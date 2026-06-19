# Tournament-Director

Timer / reloj de torneos de poker para directores de torneo. Pantalla a pantalla completa
que muestra el nivel actual, las ciegas (blinds), el ante, una cuenta regresiva con anillo de
progreso, avisos sonoros y mensajes configurables por nivel. Incluye un editor visual para
crear torneos e importar/exportar su configuración en CSV.

- **Repositorio:** https://github.com/SanticreideARG/Tournament-Director
- **Ruta local (dev principal):** `E:\www\Tournament-Director`
- **Bocetos originales (HTML):** `C:\Users\screide\Downloads\Poker director` (Login / Menu / Poker Timer)

---

## 1. Stack técnico

| Área | Elección | Notas |
|---|---|---|
| Build / framework | **Vite + React 19 + TypeScript** | |
| Estado + persistencia | **Zustand** con middleware `persist` → `localStorage` | |
| Routing | **React Router** (`HashRouter`) | HashRouter para que funcione abriendo el `index.html` empaquetado (Electron/file://) |
| Importar/Exportar CSV | **PapaParse** (export) + **tokenizador propio** (`src/lib/csv.ts`) | El CSV del usuario usa **comillas simples** y comas dentro de los mensajes; PapaParse solo no alcanza |
| Animaciones UI | **Framer Motion** | transiciones, banners, overlays |
| Internacionalización | **i18next + react-i18next** | ES / EN / PT |
| Audio | **Web Audio API** (sin librerías ni archivos) | tonos sintetizados con `OscillatorNode` |
| Fondo principal | **WebGL** (shader de "agua" con cáusticas doradas) | portado de los bocetos |

### Requisitos de entorno
- Node 24+, npm 11+ (probado con Node 24.14.1 / npm 11.11.0).
- Dev server configurado como `td-dev` en `C:\.claude\launch.json`, **puerto 5181**
  (el 5173 lo ocupa otro proyecto del usuario — Grimorio).

### Comandos
```bash
npm install        # instalar dependencias
npm run dev        # servidor de desarrollo (Vite)
npm run build      # tsc -b && vite build  → dist/
npm run preview    # previsualizar el build
npm run lint       # eslint
```

---

## 2. Estructura del proyecto

```
src/
  main.tsx                  # entrypoint: importa i18n + global.css, monta <App>
  App.tsx                   # HashRouter, rutas, aplica data-theme al <html>, AppBackground
  types/
    tournament.ts           # Level, Tournament, ThemeName, LanguageCode, Wallpaper
  lib/
    csv.ts                  # parseTournamentCsv (tokenizador) + tournamentToCsv + uid
    time.ts                 # parseDuration, formatClock, formatDuration, formatBlind
    audio.ts                # unlockAudio, playWarning, playLevelChange
  i18n/
    index.ts                # init i18next + setLanguage()
    locales/ es.json en.json pt.json
  store/
    useSettingsStore.ts     # theme, language, wallpaper, soundEnabled, warnSeconds (persist)
    useTournamentStore.ts   # tournaments[] + upsert/remove/duplicate (persist) + makeLevel/makeTournament
    useTimerStore.ts        # runtime del reloj (NO se persiste): nivel actual, remaining, running...
  components/
    ScaledStage.tsx         # lienzo fijo 1920×1080 escalado al viewport (transform: scale)
    WaterShader.tsx         # fondo WebGL (acepta prop light 0..1 para tema claro)
    FloatingCards.tsx       # cartas de poker decorativas (CSS)
    AppBackground.tsx       # decide qué fondo renderizar según settings.wallpaper
  screens/
    MenuScreen.tsx(.css)    # menú principal (3 opciones)
    StartScreen.tsx(.css)   # elegir torneo guardado → carga timer
    TimerScreen.tsx(.css)   # PANTALLA PRINCIPAL del reloj
    ConfigScreen.tsx(.css)  # editor visual de torneos + import/export CSV
    SettingsScreen.tsx(.css)# tema, idioma, fondo, sonido, segundos de aviso
  styles/
    global.css              # tokens de tema (CSS variables), estilos base, cartas, botones
```

### Convenciones
- **Estilo:** CSS plano + variables CSS por componente (no Tailwind). Paleta y tema viven en
  `global.css` bajo `:root[data-theme='...']`.
- **Estética:** oro `#f0d080` sobre navy `#03060f`, serif Palatino/Georgia para títulos,
  Helvetica Neue para texto. Lienzo de diseño 1920×1080 escalado.

---

## 3. Modelo de datos

```ts
interface Level {
  id: string;
  name: string;            // "Nivel 1", "Break"...
  isBreak: boolean;        // true → no muestra blinds; fondo/estilo distinto
  durationSeconds: number;
  smallBlind: number | null;
  bigBlind: number | null;
  ante: number | null;
  startMessage: string;    // banner al entrar al nivel
  endMessage: string;      // banner al disparar el aviso de fin
}

interface Tournament {
  id: string;
  name: string;            // mostrado en la barra superior del timer
  createdAt: number;
  updatedAt: number;
  levels: Level[];
}
```

### Formato CSV soportado (importación)
Columnas: `Nivel, Time, Small Blind, Big Blind, Ante, Starting message, Ending Message`.
El parser tolera: **comillas simples o dobles**, **comas dentro de campos entrecomillados**,
espacios alrededor de las comas, coma final sobrante y fila de cabecera opcional.
`isBreak` se infiere si el nombre contiene "break/descanso/pausa/intervalo" o si no hay blinds.
La exportación usa CSV estándar con comillas dobles (y el importador lo vuelve a leer igual —
round-trip verificado).

### Claves de `localStorage`
- `td-settings` — ajustes de la app.
- `td-tournaments` — lista de torneos.
- `td-timer` — estado del reloj en curso (torneo activo, nivel, `levelEndsAt`,
  `pausedRemaining`, running/finished). Permite reanudar tras navegar o recargar.

---

## 4. Pantalla del Timer — comportamiento

- Anillo SVG de progreso (oro → naranja → rojo a medida que baja el tiempo).
- Blinds y ante del nivel actual; preview del "Siguiente".
- **Aviso de fin** (por defecto 10s antes, configurable): tono ascendente + timer en rojo
  con pulso + banner con el `endMessage`.
- **Cambio de nivel:** tono de acorde + banner con el `startMessage` + **tinte de fondo
  distinto por nivel** (HSL en función del índice; azul para breaks).
- **Atajos:** `Espacio` pausa/reanuda · `← →` cambia de nivel · `Esc` vuelve al menú.
  Click en el overlay también pausa/reanuda.
- **Persistencia / reanudación:** el reloj es **basado en timestamp** (`levelEndsAt`),
  no un contador que decrementa. El estado se persiste en `localStorage` (`td-timer`).
  Mientras la app está abierta sigue corriendo en **tiempo real** aunque salgas a menú/opciones
  (un intervalo global avanza de nivel); al **recargar o reabrir** retoma **en pausa** donde
  quedó. El menú muestra **"Reanudar Torneo"** si hay uno en curso. `TimerScreen` solo deriva
  los segundos del timestamp para mostrarlos (no gobierna el tiempo).

---

## 5. Estado actual — V1 (COMPLETA y verificada)

- [x] Menú principal (shader, cartas flotantes, marca).
- [x] Selección de torneo guardado → inicio del reloj.
- [x] Pantalla del Timer completa (ver §4).
- [x] Editor visual de torneos: crear/editar/borrar/reordenar niveles y breaks,
      múltiples torneos en localStorage, import/export CSV.
- [x] Ajustes: tema claro/oscuro, idioma (ES/EN/PT), fondo (shader o imagen propia),
      sonido on/off, segundos de aviso.
- [x] i18n en 3 idiomas.
- [x] Build de producción sin errores; verificado en navegador.
- [x] **Sistema de 6 temas** (`src/lib/themes.ts` + `global.css`): royal/crimson/emerald
      (oscuros) e ivory/platinum/champagne (claros). Selector con swatches en Ajustes.
- [x] **Fondos animados** (`src/components/backgrounds/`): shader, fireflies, snow, starfield,
      aurora (toma colores del tema), bokeh, none, imagen propia. Despacho en `AppBackground`.
- [x] **Responsive / mobile**: `ScaledStage` es dual — lienzo 1920×1080 escalado en desktop y
      layout FLUIDO en mobile (`useIsMobile`, breakpoint 820px, clase `.stage-screen.fluid`).
      Overrides mobile centralizados en `src/styles/mobile.css`.
- [x] **Cartas animadas en el timer** (toggle `showTimerCards` en Ajustes): a los lados en
      desktop, arriba/abajo en mobile (`FloatingCards` con prop `layout` y posiciones en %).
- [x] **Pie de página editable** (`footerText` en Ajustes) mostrado en el timer.

---

## 6. Hoja de ruta

### Próximo — web (V1.x), priorizado por el usuario
1. [x] **Controles táctiles + barra de control del director** — botones (anterior/pausa-play/
   siguiente/salir) en `TimerScreen`; siempre visible en mobile, auto-oculta en desktop.
2. **PWA instalable + offline** — manifest + service worker (p. ej. `vite-plugin-pwa`) para
   instalar la web como app y que funcione sin conexión. Paso previo útil al Electron 2.0.
3. **Marca personalizable** — subir el logo del club/torneo (a localStorage/dataURL) y mostrarlo
   en el timer junto al nombre.
4. **Reloj + hora estimada de fin** — [x] hora actual + fin proyectado (suma de duraciones
   restantes), con toggle `showClock` en Ajustes. Pendiente: **chip color-up** (aviso de
   retirar/cambiar fichas por nivel).

### Fase Supabase/OAuth (docs listas en `docs/`)
- **Autenticación Google (OAuth) + Supabase** — guardar torneos en el perfil del usuario,
  offline-first. Manual del usuario y plan para agente en `docs/SUPABASE_OAUTH_*`. Arrancar
  cuando el usuario complete el setup de la nube.

### V2.0
- **Empaquetado Electron portable** — ejecutable offline para la pantalla del torneo
  (mismo enfoque que el proyecto Grimorio). HashRouter ya lo facilita. Ver gotcha de OAuth en
  Electron en `docs/SUPABASE_OAUTH_PLAN.md`.
- **Jugadores y mesas en vivo** — paneles de jugadores/mesas restantes, rebuys, eliminaciones,
  stack promedio y balanceo de mesas (estaban en los bocetos).
- **Generador automático de estructura de blinds** — por buy-in, stack inicial, jugadores y
  duración objetivo.
- **Premios / Payouts** — pozo de premios y estructura de pagos por puesto.
- Pantalla secundaria / modo multi-viewport.

---

## 7. Fondos animados — catálogo previsto

| ID | Nombre | Técnica | Tema ideal | Estado |
|---|---|---|---|---|
| `shader` | Agua (cáusticas doradas) | WebGL | ambos | ✅ |
| `fireflies` | Luciérnagas | CSS keyframes (gen. en JS) | oscuro | ✅ |
| `snow` | Nieve | Canvas 2D | claro/oscuro | ✅ |
| `starfield` | Cielo estrellado (+ estrellas fugaces) | Canvas 2D | oscuro | ✅ |
| `aurora` | Aurora / gradiente vivo | CSS (blur + keyframes) | ambos (toma color del tema) | ✅ |
| `bokeh` | Bokeh dorado (orbes) | CSS | ambos | ✅ |
| `none` | Color sólido del tema | — | ambos | ✅ |

(El componente de cada fondo se monta/desmonta y debe pausar su loop al desmontarse.)

---

## 8. Notas de continuidad (para otra sesión / dispositivo)

- Clonar el repo, `npm install`, `npm run dev`.
- En otra máquina, el dev server no necesita el `launch.json` del usuario; usar `npm run dev`
  (Vite elegirá 5173 por defecto).
- El parser de CSV es la pieza más delicada: cualquier cambio debe mantener el round-trip
  import → export → import (ver test manual en el historial: mensajes con comas, breaks sin
  blinds, ante opcional).
- El estado del timer se persiste (`td-timer`) y es **basado en timestamp**; ver §4. Si se
  cambia la lógica del reloj, mantener: tiempo real mientras la app está abierta, y reanudar
  en pausa tras un arranque en frío.
