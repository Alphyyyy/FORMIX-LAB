# Camino a producción

> **Estado actual:** el proyecto ya incluye una integración básica con Supabase para sesiones anónimas, validación del equipo y panel. Este documento describe lo que falta para una operación multiusuario endurecida y el checklist productivo.

Este documento describe lo que falta para pasar del prototipo local a una aplicación de feria con datos entre dispositivos. **No implementa el backend completo**; fija la arquitectura, las reglas y el checklist para hacerlo con seguridad.

## 1. Punto de partida

El prototipo actual:

- Es una SPA estática (React + Vite) con rutas hash.
- Persiste todo en `localStorage`, en un único navegador.
- Simula la sesión del equipo con PINs visibles y `sessionStorage`.
- Genera códigos y calcula premios en el cliente.
- Exporta CSV desde el navegador.

Esto es suficiente para validar experiencia, estética, flujo y narrativa. **No** es suficiente para:

- Sincronizar el celular del visitante con la tablet del operador.
- Impedir que un visitante marque un reto como ganado.
- Garantizar un canje único entre operadores o dispositivos.
- Autenticar al equipo con contraseñas reales.
- Hacer respaldos y retención de datos.

## 2. Arquitectura recomendada

La referencia del ERS propone React + Vite + Supabase. Es una buena opción para el MVP:

```text
Celular del visitante ─┐
Tablet del operador  ──┼─> Frontend estático (Vercel/Netlify)
Panel administrativo ──┘          │
                                  ▼
                        Supabase (PostgreSQL + Auth + RLS)
                                  │
                                  ├─> Storage (fotos de producto)
                                  └─> Backups / exportación
```

Alternativas válidas: cualquier backend con PostgreSQL/MySQL, autenticación por roles, RLS o autorización equivalente, y endpoints transaccionales. Lo importante no es la marca del proveedor, sino que las reglas críticas vivan en el servidor.

## 3. Modelo de datos

Tablas mínimas, alineadas con el ERS:

| Tabla | Campos clave | Reglas |
|---|---|---|
| `catalog_items` | `id`, `type`, `name`, `image_url`, `status`, `sort_order`, `is_active`, `created_at` | `type` en `shape/color/scent`; `status` en `available/proposed/inactive`; no borrar ítems referenciados |
| `sessions` | `id`, `started_at`, `completed_at`, `state`, `code_hash`, `consent_version` | sesión anónima; código no secuencial; token seguro en el cliente |
| `preferences` | `id`, `session_id`, `shape_id`, `color_id`, `scent_id`, `purchase_intent`, `gift_intent`, `submitted_at` | una preferencia final por sesión |
| `game_results` | `id`, `session_id`, `game_type`, `result`, `operator_id`, `validated_at` | `UNIQUE(session_id, game_type)`; solo operador autenticado |
| `rewards` | `id`, `session_id`, `reward_type`, `issued_at`, `redeemed_at`, `redeemed_by` | una fila por sesión; canje único y atómico |
| `operators` | `id`, `role`, `enabled`, `created_at` | roles `operator/admin`; nunca PIN compartido en producción |
| `sales` (opcional) | `id`, `session_id`, `sku`, `qty`, `amount`, `sold_at` | fuera del MVP |

Recomendaciones:

- Usar UUID y claves foráneas.
- Guardar `created_at` con zona horaria (`timestamptz`).
- No guardar el código público en claro: guardar `code_hash` y buscar por hash.
- Mantener las opciones desactivadas en lugar de borrarlas.
- Añadir índices a `sessions.code_hash`, `preferences.session_id`, `game_results.session_id` y `rewards.session_id`.

## 4. Reglas críticas en el servidor

### 4.1 Sesión anónima

- `POST /api/sessions` crea la sesión y devuelve un token de sesión (no el código público).
- El token se guarda en una cookie `HttpOnly`, `Secure`, `SameSite=Lax` o en un almacenamiento seguro equivalente.
- El servidor deriva la sesión del token; nunca confía en un `session_id` enviado por el cliente.

### 4.2 Validación de juegos

- Solo un usuario autenticado con rol `operator` o `admin` puede insertar en `game_results`.
- El cliente del visitante no recibe permisos de escritura sobre juegos ni premios.
- Una restricción `UNIQUE(session_id, game_type)` impide duplicados.
- El resultado es inmutable: no se actualiza; si hubo un error operativo, se registra una corrección auditada.

### 4.3 Canje único y atómico

La operación debe ser una sola transacción condicional:

```sql
update rewards
set redeemed_at = now(),
    redeemed_by = $operator_id
where session_id = $session_id
  and redeemed_at is null
returning id, reward_type, redeemed_at;
```

Si no devuelve filas, el premio ya fue canjeado o no existe. La UI muestra el rechazo; no se emite un segundo premio.

### 4.4 Emisión y mejora del premio

- El servidor calcula el nivel a partir de los `game_results` válidos.
- Mientras `redeemed_at` sea nulo, una nueva victoria puede actualizar el tipo de premio (`greeting` → `photo` → `photo_dance`).
- Después del canje, el nivel queda bloqueado.
- La emisión y la mejora se hacen en la misma transacción que valida el juego, o con una función SQL/Edge Function idempotente.

### 4.5 Códigos

- Generar con CSPRNG en el servidor.
- Formato `FX-` + 6 caracteres sin ambigüedad.
- Guardar hash + un identificador de búsqueda; nunca exponer credenciales.
- Limitar intentos de búsqueda por IP/operador (rate limiting).

## 5. Autenticación y permisos

- Sustituir los PIN por Supabase Auth (email/contraseña o magic link) para operadores y administradores.
- Roles en una tabla `operators` o en `app_metadata`; nunca confiar en un rol enviado por el cliente.
- RLS de ejemplo:

```sql
-- El visitante solo puede leer el catálogo activo.
create policy "catalog public read"
on catalog_items for select
using (status <> 'inactive');

-- Solo operadores/admin pueden insertar resultados.
create policy "operators insert game results"
on game_results for insert
to authenticated
with check (exists (
  select 1 from operators o
  where o.user_id = auth.uid() and o.enabled and o.role in ('operator','admin')
));

-- El visitante solo ve su propia sesión/preferencias.
create policy "own session read"
on sessions for select
to authenticated
using (user_id = auth.uid());
```

Ajusta las políticas al modelo final. Prueba cada rol con cuentas reales; no confíes solo en la UI.

## 6. Privacidad y cumplimiento

- No pedir nombre, teléfono, correo ni DNI para participar.
- Aviso claro de finalidad, base legal, responsable, plazo de conservación y derechos.
- Consentimiento separado y explícito para cualquier comunicación comercial futura.
- Exportación y borrado a solicitud.
- Retención recomendada: definir con FORMIX antes de la feria (por ejemplo, 6–12 meses) y documentarla.
- Evitar geolocalización, reconocimiento facial y publicidad conductual.
- Guardar solo lo necesario: combinación, retos, premio y timestamps.
- Revisar el texto de privacidad con la persona responsable legal de FORMIX.

## 7. Exportación y respaldo

- Generar los CSV en el servidor con consultas autenticadas y filtros de fecha.
- Mantener los cuatro archivos: sesiones, preferencias, juegos, premios.
- Incluir encabezados claros, IDs y nombres resueltos, timestamps ISO y `origen` si se mezclan datos demo.
- Programar un respaldo de la base antes y después de la feria.
- Guardar una copia fuera del hosting temporal.
- Probar la restauración, no solo la descarga.

## 8. Conectividad y offline

El prototipo requiere red en la primera carga. Para la feria:

- Confirmar la conectividad del recinto.
- Considerar un service worker con precache del shell para tolerar cortes después de la primera visita.
- Si se implementa offline, definir una cola de sincronización y **no prometer** guardado en servidor hasta confirmarlo.
- Tener un plan manual para los juegos físicos si falla el servicio.
- Probar en modo avión y con red lenta.

## 9. Migración desde el prototipo

1. Crear el proyecto de backend y las tablas.
2. Implementar la capa `repository` contra la API, manteniendo las firmas actuales cuando sea posible.
3. Mover la generación de códigos, el cálculo de premios y el canje al servidor.
4. Sustituir el login por Auth real.
5. Mantener el modo demo solo en desarrollo.
6. Migrar el catálogo real y las fotos.
7. Ejecutar el ciclo completo en dos dispositivos.
8. Probar 20–30 sesiones simuladas, exportar y restaurar un respaldo.

## 10. Checklist de aceptación productiva

- [ ] QR abre en Android e iPhone sin instalar app.
- [ ] La sesión se recupera al recargar.
- [ ] La combinación se guarda con IDs válidos.
- [ ] Dos operadores no pueden canjear el mismo premio.
- [ ] Un visitante no puede marcar un juego como ganado.
- [ ] Desactivar un aroma lo retira del flujo sin borrar historial.
- [ ] Exportación CSV completa y legible.
- [ ] Sin conexión se muestra una contingencia comprensible.
- [ ] Audio apagado no bloquea la experiencia.
- [ ] Respaldo y restauración comprobados.
- [ ] Aviso de privacidad revisado.
- [ ] Responsable del panel y del respaldo designado.

## 11. Fuera de alcance de esta entrega

- Backend, Auth, RLS, migraciones y despliegue productivo.
- Fotos reales, logo definitivo, mascota aprobada y jingle.
- Impresión del QR y dominio final.
- Revisión legal de privacidad.
- Analítica avanzada, CRM, pagos o ventas.

Estas piezas requieren cuentas, credenciales y decisiones de FORMIX. El prototipo deja el camino preparado, pero no puede sustituirlas.
