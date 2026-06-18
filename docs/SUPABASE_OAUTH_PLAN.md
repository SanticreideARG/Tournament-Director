# Plan de implementación: Supabase + Google OAuth (para el agente)

> **Para un agente Claude Opus que retoma la Fase 2 en otra sesión.**
> Objetivo: agregar login con Google (Supabase Auth) y sincronización de torneos en la nube,
> **sin romper** el funcionamiento offline actual (localStorage). Leé también `../PROJECT.md`.
> **Este archivo es temporal**: cuando la feature esté integrada, se puede borrar del repo.

---

## 0. Precondiciones (las hace el usuario, NO el agente)

El usuario ya configuró la nube siguiendo `SUPABASE_OAUTH_MANUAL.md`:
- Proyecto Supabase + provider Google activado.
- Tabla `public.tournaments` con RLS (esquema más abajo, §Esquema DB).
- Archivo `.env.local` en la raíz con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

**Antes de empezar**, verificá que `.env.local` exista y tenga ambas variables. Si no están,
pará y pedíselas al usuario; no inventes claves ni hardcodees credenciales.

---

## 1. Contexto del proyecto (estado actual)

- **Stack:** Vite + React 19 + TypeScript + Zustand (`persist`), React Router **HashRouter**,
  i18next (ES/EN/PT), Framer Motion, PapaParse. Sin backend hoy: todo en `localStorage`.
- **Archivos clave:**
  - `src/types/tournament.ts` → `Tournament { id, name, createdAt, updatedAt, levels: Level[] }`,
    `Level { id, name, isBreak, durationSeconds, smallBlind, bigBlind, ante, startMessage, endMessage }`.
  - `src/store/useTournamentStore.ts` → `tournaments[]`, `upsert(t)`, `remove(id)`, `duplicate(id)`,
    `get(id)`. Persist key `td-tournaments`. Ids vía `uid()` (= `crypto.randomUUID()`).
  - `src/store/useSettingsStore.ts` → ajustes (persist `td-settings`).
  - `src/store/useTimerStore.ts` → reloj en curso (persist `td-timer`).
  - `src/screens/` → `MenuScreen`, `StartScreen`, `ConfigScreen`, `SettingsScreen`, `TimerScreen`.
  - `src/App.tsx` → `HashRouter` + rutas + `data-theme`.
- **Bocetos de referencia (no en el repo):** `C:\Users\screide\Downloads\Poker director\Login.html`
  y `Menu.html` (el badge de usuario con dropdown del Menu.html es la guía visual del login/perfil).
- **Convenciones:** CSS plano + variables (sin Tailwind); comentarios y textos en español; cada
  pantalla con su `.css`. Estética oro `#f0d080`. Verificar con `npm run build` + `preview_eval`
  (el capturador de screenshots del preview falla en este entorno; ver `PROJECT.md` §8).

---

## 2. Estrategia: offline-first

Mantener Zustand+localStorage como **fuente local/caché** y Supabase como **espejo en la nube**.

- **Sin sesión:** todo funciona como hoy (solo local). Nada cambia para el usuario no logueado.
- **Con sesión:** al hacer `upsert`/`remove` también se sincroniza con Supabase. Al loguear, se
  hace un **merge** local↔remoto por `id`, ganando el `updatedAt` más reciente.
- **El `id` local = `id` remoto** (ambos uuid de `crypto.randomUUID()`), así el upsert no duplica.

No reescribir el flujo del timer ni el editor; solo agregar la capa de auth + sync.

---

## 3. Dependencias

```bash
npm install @supabase/supabase-js
```

(No agregar nada más; el resto ya está.)

---

## 4. Pasos de implementación (en orden)

### 4.1 Cliente Supabase — `src/lib/supabase.ts`
- Crear el cliente con las env de Vite y **flujo PKCE** (clave por el HashRouter, ver §Gotchas).
```ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

/** true si hay credenciales; permite que la app corra sin nube (modo solo-local). */
export const supabaseEnabled = Boolean(url && anon);

export const supabase = supabaseEnabled
  ? createClient(url, anon, {
      auth: {
        flowType: 'pkce',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
```
- Importante: si `supabase` es `null` (sin env), TODA la feature debe degradar a solo-local sin
  romper. Chequear `supabaseEnabled`/`supabase` antes de usarlo.

### 4.2 Store de autenticación — `src/store/useAuthStore.ts`
- Estado: `user: { id, email, name, avatarUrl } | null`, `status: 'loading' | 'in' | 'out'`.
- Acciones: `signInWithGoogle()`, `signOut()`, `init()` (lee sesión actual + `onAuthStateChange`).
```ts
// signInWithGoogle:
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: window.location.origin }, // sin hash; PKCE vuelve con ?code=
});
```
- En `init()`: `supabase.auth.getSession()` + suscribirse a `supabase.auth.onAuthStateChange`.
  Al cambiar a logueado, disparar la sincronización inicial (§4.4).
- Llamar `init()` una vez al arrancar (en `App.tsx`, dentro de un `useEffect`), solo si
  `supabaseEnabled`.

### 4.3 Capa de sincronización — `src/lib/tournamentSync.ts`
- Mapeo fila↔modelo:
  - fila `{ id, user_id, name, levels, created_at, updated_at }` ↔ `Tournament`
    (`createdAt`/`updatedAt` en ms; en DB son `timestamptz` → convertir).
- Funciones:
  - `fetchRemote(): Promise<Tournament[]>` → `select *` (RLS filtra por usuario).
  - `pushTournament(t, userId)` → `upsert` con `{ ...t, user_id }` (mandar `id` y `user_id`).
  - `deleteRemote(id)` → `delete eq id`.
  - `mergeInitial(local, remote): Tournament[]` → unión por `id`, gana `updatedAt` mayor; subir a
    la nube los locales que no existían (migración) y bajar los remotos que faltan localmente.
- Convertir fechas: al leer, `new Date(row.created_at).getTime()`; al escribir, dejar que la DB
  ponga `updated_at` (trigger) o mandar ISO.

### 4.4 Integración con `useTournamentStore`
- En `upsert(t)` y `remove(id)`: además de actualizar el estado local, si hay sesión
  (`useAuthStore.getState().user`), llamar a `pushTournament` / `deleteRemote` (fire-and-forget
  con manejo de error suave; no bloquear la UI).
- Evitar import circular: `useTournamentStore` puede importar `tournamentSync` y leer el user con
  `useAuthStore.getState()` (no como hook).
- **Sync inicial al loguear** (desde `useAuthStore` o `App`): `mergeInitial(localTournaments,
  await fetchRemote())` y `set({ tournaments: merged })`.

### 4.5 UI de login y perfil
- **Pantalla / botón de login:** seguir el boceto `Login.html`. Mínimo viable: un botón
  "Iniciar sesión con Google" accesible desde el menú. Considerar ruta `/login` o un modal.
- **Badge de usuario en el menú:** replicar el `#user-badge` + dropdown de `Menu.html`
  (avatar con iniciales, nombre, email, "Cerrar sesión"). Mostrarlo solo si hay sesión; si no,
  mostrar el botón de login. Reusar variables de tema (`--gold`, `--panel`, etc.).
- **No** usar `computer-use` ni pedir credenciales: el login lo hace el usuario en el popup de Google.

### 4.6 i18n
- Agregar claves en `src/i18n/locales/{es,en,pt}.json`, p. ej.:
  `auth.signIn`, `auth.signOut`, `auth.signedInAs`, `auth.cloudSynced`, `auth.localOnly`,
  `auth.signInWithGoogle`. Mantener el estilo de las claves existentes.

### 4.7 Electron (solo dejar preparado / documentar)
- En el build **Electron portable**, `signInWithOAuth` con redirect web no funciona con `file://`.
  Opciones: abrir el login en el navegador externo (`shell.openExternal`) + **deep link**
  (protocolo `tournament-director://`) o un **loopback** `http://localhost:<puerto>` temporal que
  capture el `?code=` y lo pase a `exchangeCodeForSession`. **No implementar ahora** salvo que el
  usuario lo pida; dejar el código web funcionando y anotar esta limitación.

---

## 5. Esquema DB (referencia — ya creado por el usuario)

```sql
create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  levels jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.tournaments enable row level security;
-- policies own select/insert/update/delete (auth.uid() = user_id) + trigger updated_at
```
(Detalle completo en `SUPABASE_OAUTH_MANUAL.md` §Paso 4.)

---

## 6. Gotchas (leer antes de codear)

1. **HashRouter + tokens OAuth:** la app usa `#/` para rutear. El flujo implícito de OAuth
   devuelve el token en el **hash**, que choca con el router. **Usar PKCE** (`flowType:'pkce'`):
   vuelve con `?code=...` en query y `detectSessionInUrl` lo intercambia solo. `redirectTo` debe
   ser un origen limpio (`window.location.origin`), sin `#`.
2. **RLS:** todo `insert` debe incluir `user_id = auth.uid()`. Si una fila "no aparece", suele ser
   RLS o falta de `user_id`.
3. **Modo sin nube:** si faltan las env (`supabaseEnabled === false`), la app debe seguir
   funcionando 100% offline. No tirar errores ni romper el menú.
4. **No duplicar torneos:** usar el `id` local como `id` remoto en el `upsert`.
5. **Fechas:** DB usa `timestamptz`; el modelo usa epoch ms. Convertir en ambos sentidos.
6. **Secrets:** nunca poner la `service_role` en el front ni commitear `.env.local`. Si hace falta,
   agregar `.env` a `.gitignore` (hoy solo está `*.local` y `.claude/`).
7. **Conflicto de stores:** leer `useAuthStore`/`useTournamentStore` con `.getState()` dentro de
   `tournamentSync` para evitar imports circulares y hooks fuera de componentes.

---

## 7. Criterios de aceptación

- [ ] `npm run build` pasa sin errores de tipos.
- [ ] Sin `.env.local`: la app corre igual que hoy (solo local), sin errores en consola.
- [ ] Con sesión: login con Google funciona y queda logueado tras volver (PKCE OK).
- [ ] Crear/editar/borrar un torneo logueado se refleja en la tabla `tournaments` de Supabase.
- [ ] Al loguear con torneos locales preexistentes, se suben (migración) y no se duplican.
- [ ] Logout vuelve a modo local sin perder los torneos en caché.
- [ ] El badge de usuario aparece en el menú (estilo `Menu.html`) y "Cerrar sesión" funciona.
- [ ] Verificación hecha con `preview_eval` (no depender de screenshots).

---

## 8. Orden sugerido de commits

1. `chore: cliente supabase + dep @supabase/supabase-js`
2. `feat(auth): useAuthStore + login/logout con Google (PKCE)`
3. `feat(sync): tournamentSync + integración offline-first en useTournamentStore`
4. `feat(ui): badge de usuario en menú + pantalla de login`
5. `feat(i18n): claves de auth ES/EN/PT`
6. `docs: actualizar PROJECT.md (Fase 2 implementada)` y borrar `docs/SUPABASE_OAUTH_*`

Recordá el footer de co-autoría en cada commit y pushear al final.
