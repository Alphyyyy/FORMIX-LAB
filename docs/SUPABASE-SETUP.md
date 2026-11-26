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

## 5. Integración con el frontend

La aplicación ya incluye la capa de Supabase:

- login del equipo con correo y contraseña;
- sesión anónima del visitante;
- guardado de preferencias y código en Supabase;
- consulta del operador desde otro dispositivo;
- actualización del premio en el celular del visitante mediante polling;
- panel administrativo con datos de la nube y CSV.

Para que una build use Supabase, deben existir `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en el entorno de compilación. En local se cargan desde `.env.local`; en GitHub Actions, desde los secretos del repositorio. Si faltan, la app cae en modo local de demostración.

### Probar en local con Supabase

1. Confirma que `.env.local` tiene las dos variables.
2. Ejecuta `npm run dev`.
3. Abre `/#/equipo` y entra con tu cuenta de operador.
4. Prueba un recorrido desde `/#/` en otra pestaña o en otro celular de la misma red.
5. Valida el código desde la tablet/pestaña de operador.

### Limpieza y usuarios anónimos

Para limpiar pruebas, usa **solo**:

```sql
delete from public.sessions;
```

No borres `auth.users` antes del evento. Si eliminas usuarios anónimos mientras un teléfono tiene una sesión abierta, su token queda huérfano y el guardado puede fallar con `sessions_user_id_fkey`. La app intenta renovar el usuario y reintentar, pero la limpieza segura es borrar sesiones, no identidades, hasta que termine el evento.

## Seguridad

- Los visitantes usan `signInAnonymously()`; no se les pide correo.
- Los operadores y administradores usan cuentas de Supabase Auth.
- Las políticas RLS impiden que un visitante lea sesiones ajenas.
- Los juegos y el canje solo se escriben mediante funciones `security definer` que verifican el rol.
- El código de participación se genera en el servidor y es único.
- No se guardan datos personales de visitantes.
