-- FORMIX LAB · Asignación de roles del equipo
-- Ejecutar DESPUÉS de crear los usuarios en Authentication → Users.
-- Reemplaza OPERADOR_EMAIL y ADMIN_EMAIL por los correos reales.
-- No compartas este archivo con las contraseñas.

-- Opcional: lista los usuarios para copiar los correos exactos.
-- select email, id, email_confirmed_at from auth.users order by created_at;

select public.assign_staff('OPERADOR_EMAIL', 'operator', 'Operador', 'OP');
select public.assign_staff('ADMIN_EMAIL', 'admin', 'Administrador', 'AD');
