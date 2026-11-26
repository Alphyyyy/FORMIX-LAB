# Configuración de Supabase

Esta guía conecta el proyecto de Supabase con FORMIX LAB. La migración crea el catálogo, las sesiones, los roles del equipo y las reglas de canje.

## 1. Ejecutar la migración

En Supabase, abre tu proyecto y entra en **SQL Editor → New query**.

Copia y ejecuta el contenido completo de:

```text
supabase/migrations/20261126_init.sql
```

Esto crea:

- `catalog_items` con los 20 moldes, colores y aromas iniciales.
- `staff` para los roles de operador y administrador.
- `sessions` para las combinaciones, retos y premios.
- Funciones para crear la sesión, guardar preferencias, completar la combinación, validar retos y canjear el premio.
- Políticas RLS para que cada visitante solo vea su sesión y el equipo pueda validar.

## 2. Asignar los roles del equipo

En **SQL Editor**, abre el archivo:

```text
supabase/seed-staff.sql
```

Reemplaza:

- `OPERADOR_EMAIL` por el correo del usuario operador.
- `ADMIN_EMAIL` por el correo del usuario administrador.

Ejecuta las dos llamadas a `assign_staff`. Deben terminar sin error.

Puedes comprobar los roles con:

```sql
select s.role, s.display_name, s.initials, u.email
from public.staff s
join auth.users u on u.id = s.user_id;
```

## 3. Probar las funciones

Con el SQL Editor puedes comprobar que el catálogo existe:

```sql
select type, count(*)
from public.catalog_items
group by type
order by type;
```

Debes ver 8 moldes, 6 colores y 6 aromas.

## 4. Variables del frontend

En la raíz del proyecto debe existir `.env.local` (no se sube a git):

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

En GitHub, los mismos valores deben estar en:

**Settings → Secrets and variables → Actions**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

La `anon key` es pública por diseño. La `service_role` no se usa en el frontend.

## 5. Lo que falta después del SQL

La migración deja la base lista, pero la aplicación todavía no la usa. La integración del frontend incluye:

- login del equipo con correo y contraseña;
- sesión anónima del visitante;
- guardado de preferencias y código en Supabase;
- consulta del operador desde otro dispositivo;
- actualización del premio en el celular del visitante;
- panel administrativo con datos de la nube.

Esa parte se implementa y prueba después de ejecutar la migración.

## Seguridad

- Los visitantes usan `signInAnonymously()`; no se les pide correo.
- Los operadores y administradores usan cuentas de Supabase Auth.
- Las políticas RLS impiden que un visitante lea sesiones ajenas.
- Los juegos y el canje solo se escriben mediante funciones `security definer` que verifican el rol.
- El código de participación se genera en el servidor y es único.
- No se guardan datos personales de visitantes.
