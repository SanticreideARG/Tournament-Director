# Manual: Supabase + Google OAuth (para Santi)

> Ayuda-memoria para configurar la nube del proyecto **Tournament-Director**.
> Hacé estos pasos en las consolas web (Supabase + Google Cloud). El código lo implementa
> el agente siguiendo `SUPABASE_OAUTH_PLAN.md`. **Este archivo es temporal**: borralo del repo
> cuando termines.

Resultado esperado: poder iniciar sesión con Google y que los torneos se guarden en tu perfil
(tabla `tournaments` en Supabase), manteniendo el funcionamiento offline con localStorage.

---

## Paso 1 — Crear el proyecto en Supabase

1. Entrá a https://supabase.com → **New project**.
2. Nombre: `tournament-director`. Elegí región cercana (ej. *South America (São Paulo)*).
3. Generá y **guardá la contraseña** de la base de datos (la pide al crear; no la necesitás para
   el front, pero anotala).
4. Cuando termine de provisionar, andá a **Project Settings → API** y copiá:
   - **Project URL** → será `VITE_SUPABASE_URL`
   - **anon public key** → será `VITE_SUPABASE_ANON_KEY`
   - (la `service_role` NO se usa en el front, no la pongas en el cliente)
5. Anotá también el **Project Ref** (la parte `xxxxxxxx` de `https://xxxxxxxx.supabase.co`).

---

## Paso 2 — Crear las credenciales OAuth en Google Cloud

1. Entrá a https://console.cloud.google.com → creá/seleccioná un proyecto.
2. **APIs y servicios → Pantalla de consentimiento de OAuth** (OAuth consent screen):
   - Tipo de usuario: **External**.
   - Completá nombre de la app (ej. *Tournament Director*), email de soporte y email de contacto.
   - Scopes: alcanza con `.../auth/userinfo.email`, `.../auth/userinfo.profile` y `openid`.
   - En *Test users* agregá tu propio Gmail mientras la app esté en modo prueba.
3. **APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth**:
   - Tipo de aplicación: **Aplicación web**.
   - **URI de redireccionamiento autorizados** → pegá la callback de Supabase:
     ```
     https://<PROJECT_REF>.supabase.co/auth/v1/callback
     ```
     (reemplazá `<PROJECT_REF>` por el tuyo del Paso 1).
   - Guardá y copiá el **Client ID** y el **Client Secret**.

> Nota: en *Authorized JavaScript origins* podés agregar `http://localhost:5181` y tu dominio de
> producción, pero lo que **importa sí o sí** es el redirect URI de Supabase de arriba.

---

## Paso 3 — Activar Google en Supabase Auth

1. En Supabase: **Authentication → Providers → Google** → activá *Enable*.
2. Pegá el **Client ID** y **Client Secret** del Paso 2. Guardá.
3. **Authentication → URL Configuration**:
   - **Site URL**: en desarrollo `http://localhost:5181`. En producción, la URL real del sitio.
   - **Redirect URLs** (lista blanca de adónde puede volver el login): agregá
     `http://localhost:5181/**` y, si publicás, `https://TU-DOMINIO/**`.
     - Para el build **Electron portable** (más adelante) agregá también el esquema/loopback que
       definas (ver nota de Electron en el plan del agente).

---

## Paso 4 — Crear la tabla y las políticas (RLS)

Andá a **SQL Editor** en Supabase, pegá y ejecutá esto:

```sql
-- Tabla de torneos por usuario
create table if not exists public.tournaments (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  levels      jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Activar Row Level Security
alter table public.tournaments enable row level security;

-- Cada usuario solo ve/edita lo suyo
create policy "tournaments_select_own" on public.tournaments
  for select using (auth.uid() = user_id);
create policy "tournaments_insert_own" on public.tournaments
  for insert with check (auth.uid() = user_id);
create policy "tournaments_update_own" on public.tournaments
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "tournaments_delete_own" on public.tournaments
  for delete using (auth.uid() = user_id);

-- Mantener updated_at al día
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger tournaments_set_updated_at
  before update on public.tournaments
  for each row execute function public.set_updated_at();
```

> El `id` es `uuid`. La app ya genera ids con `crypto.randomUUID()`, así que el id local y el
> remoto pueden ser el mismo (clave para sincronizar sin duplicar). El campo `levels` guarda el
> array de niveles tal cual (jsonb).

---

## Paso 5 — Variables de entorno en el proyecto

En la raíz del proyecto (`E:\www\Tournament-Director`) creá un archivo **`.env.local`**
(ese nombre ya está ignorado por git, no se sube):

```
VITE_SUPABASE_URL=https://<PROJECT_REF>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon public key>
```

> Reiniciá `npm run dev` después de crear/editar el `.env.local` (Vite lee las env al arrancar).

---

## Checklist final

- [ ] Proyecto Supabase creado; URL y anon key copiadas.
- [ ] OAuth consent screen configurada (con tu Gmail como test user).
- [ ] Client ID/Secret creados con el redirect `https://<ref>.supabase.co/auth/v1/callback`.
- [ ] Provider Google activado en Supabase con ese Client ID/Secret.
- [ ] Site URL + Redirect URLs configuradas (incluye `http://localhost:5181`).
- [ ] Tabla `tournaments` + RLS + trigger creados (SQL del Paso 4).
- [ ] `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.

Con esto listo, pasale al agente el archivo `SUPABASE_OAUTH_PLAN.md`.

---

## Troubleshooting rápido

- **Vuelve del login pero no queda logueado:** casi siempre es el redirect. La app usa
  **HashRouter** (URLs con `#/`), y el token de OAuth en el hash choca con eso. La solución que
  usa el plan es **flujo PKCE** (vuelve con `?code=...` en query, no en el hash). Verificá que el
  cliente Supabase tenga `flowType: 'pkce'` y que `Redirect URLs` incluya tu origen.
- **`redirect_uri_mismatch` de Google:** el redirect en Google Cloud debe ser EXACTAMENTE
  `https://<ref>.supabase.co/auth/v1/callback`.
- **403 / fila no visible al guardar:** RLS. Revisá que el `insert` mande `user_id = auth.uid()`
  y que las policies del Paso 4 existan.
- **Cambié `.env.local` y no toma:** reiniciá el dev server.
