# FORMIX LAB — Prototipo navegable

Prototipo web mobile-first para la feria de FORMIX: un configurador de jabones con minijuego, captura anónima de preferencias, código de participación, validación por operador, premios y panel administrativo con exportación CSV.

> **Estado:** prototipo funcional de demostración. No es una tienda, no procesa pagos y no sustituye el backend de producción. Los datos viven en el navegador.

## Qué incluye

- Recorrido del visitante: bienvenida, desafío de espuma, selección de molde/color/aroma, creación, misión, premio y cierre.
- Modo operador: búsqueda por código, registro de retos y canje único del premio.
- Panel de administración: métricas, ranking de preferencias, sesiones, catálogo, QR y preparación de feria.
- Exportaciones CSV reales (UTF-8 con BOM) de sesiones, preferencias, juegos y premios.
- Datos de ejemplo para que el panel sea demostrable desde el primer arranque.
- Diseño editorial propio, SVG originales de jabón y mascota, audio sintetizado con Web Audio.
- Pruebas automatizadas de la lógica crítica.

## Requisitos

- Node.js 22 o superior (probado con Node 26).
- npm.
- Un navegador moderno (Chrome, Edge, Safari o Firefox).

## Arranque rápido

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

### Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo con recarga en caliente |
| `npm test` | Ejecuta todas las pruebas |
| `npm run test:watch` | Pruebas en modo interactivo |
| `npm run build` | Comprueba TypeScript y genera `dist/` |
| `npm run preview` | Sirve la build de producción |

## Acceso del equipo

Los PIN no se muestran en la página. El responsable de FORMIX entrega el PIN al operador y al administrador. En este prototipo el acceso es una simulación local; no es seguridad real.

El acceso está en `/#/equipo` o desde el enlace “Equipo FORMIX” del pie.

## Rutas principales

| Ruta | Pantalla |
|---|---|
| `/#/` | Bienvenida |
| `/#/crear/espuma` | Desafío de espuma |
| `/#/crear/molde` | Selección de molde |
| `/#/crear/color` | Selección de color |
| `/#/crear/aroma` | Selección de aroma |
| `/#/crear/creacion` | Resumen y guardado |
| `/#/mision` | Código y retos presenciales |
| `/#/premio` | Estado del premio |
| `/#/gracias` | Cierre |
| `/#/equipo` | Acceso del equipo |
| `/#/operador` | Validación en puesto |
| `/#/admin` | Resumen y métricas |
| `/#/admin/sesiones` | Tabla de sesiones y exportación |
| `/#/admin/catalogo` | Gestión de estados del catálogo |
| `/#/admin/difusion` | QR y preparación de feria |

## Probar el ciclo completo (dos pestañas, mismo navegador)

1. Abre `/#/` y pulsa **Entrar al laboratorio**.
2. Completa la espuma, elige molde, color y aroma, y pulsa **Guardar mi creación**.
3. Copia el código `FX-XXXXXX` de la misión.
4. Abre otra pestaña en `/#/equipo`, entra como operador con el PIN que te entregue el responsable.
5. Busca el código, registra los dos retos y pulsa **Marcar premio como entregado**.
6. Vuelve a la primera pestaña: los retos y el premio se actualizan solos.
7. Entra al panel como administrador con su PIN; revisa métricas y exporta los cuatro CSV.
8. En **Catálogo**, cambia un aroma a **Inactivo** y comprueba que desaparece del flujo.
9. En **Difusión**, usa **Preparar feria** para retirar los datos de ejemplo.

**Limitación importante:** la sincronización funciona entre pestañas del mismo navegador. Un celular y una tablet no comparten `localStorage`; para la feria real hace falta el backend de producción.

## Probar en el celular

En la misma red Wi-Fi:

```bash
npm run dev -- --host
```

Abre en el celular la URL “Network” que imprime Vite (por ejemplo `http://192.168.1.40:5173`). El QR del panel de **Difusión** usa la URL actual; si estás en `localhost`, el mismo panel avisa de que solo sirve en ese equipo.

## Datos y reinicio

Las claves versionadas son:

- `formix.data.v1` — sesiones, preferencias, juegos, premios y overrides de catálogo.
- `formix.currentSession.v1` — sesión en curso.
- `formix.sound.v1` — preferencia de sonido.
- `formix.staff.v1` — sesión del equipo (en `sessionStorage`).

Acciones disponibles en **Difusión**:

- **Preparar feria:** elimina las sesiones de ejemplo y conserva las reales.
- **Restablecer demo:** vuelve a sembrar las 18 sesiones de ejemplo conservando las reales.
- **Borrar todas las sesiones:** vacía todo, incluidas las reales; exige escribir `BORRAR`.

Para un reinicio total desde la consola del navegador:

```js
localStorage.clear();
sessionStorage.clear();
location.reload();
```

## Despliegue estático

```bash
npm run build
```

Publica la carpeta `dist/` en Netlify, Vercel, GitHub Pages o cualquier hosting estático. El proyecto usa `base: './'` y rutas con hash, así que no necesita reglas de rewrite.

### GitHub Pages

El repositorio incluye `.github/workflows/deploy.yml`: en cada push a `main` ejecuta pruebas, compila y publica `dist/`.

**GitHub Actions no puede crear el sitio de Pages por sí solo.** Hay que habilitarlo una vez en el repositorio:

1. En GitHub, abre **Settings → Pages**.
2. En **Build and deployment → Source**, elige **GitHub Actions**.
3. Haz push a `main` o ejecuta el workflow **Deploy to GitHub Pages** desde **Actions**.
4. La URL quedará en `https://alphyyyy.github.io/FORMIX-LAB/`.
5. Genera el QR desde **Difusión** usando esa URL, nunca `localhost`.

Si Pages no aparece como opción, revisa que el repositorio sea público o que tengas permisos de administrador. El workflow no intenta crear el sitio; solo publica en el que ya existe.

Errores frecuentes:

- **`Resource not accessible by integration`** o **`Get Pages site failed: Not Found`**: Pages todavía no está habilitado. Activa **Settings → Pages → Source: GitHub Actions** y vuelve a ejecutar el workflow.
- **`Node.js 20 is deprecated`**: el workflow ya usa las versiones actuales de las actions; si aparece, actualiza la rama `main` y vuelve a ejecutar.
- **El workflow pasa pero la URL da 404**: espera unos minutos, revisa que el deployment haya terminado en **Actions** y que el origen sea **GitHub Actions**.

## Para el evento

Si el evento es temporal y no hay backend, la opción recomendada es **modo kiosco**: un solo tablet o laptop en el puesto, con dos pestañas del mismo navegador (visitante y operador). Un QR abierto en teléfonos personales no sincroniza con el operador.

Lee la guía práctica: [Evento en modo kiosco](docs/EVENTO-KIOSCO.md).

## Personalización

- Catálogo base y textos de producto: `src/data/catalog.ts`.
- Colores del jabón: `src/data/colors.ts`.
- Ilustración del jabón: `src/components/Soap.tsx`.
- Mascota: `src/components/Mascot.tsx`.
- Aviso de privacidad: `src/components/PrivacyDialog.tsx`.
- Datos de ejemplo: `src/data/seed.ts`.
- Tokens visuales: `src/styles/tokens.css`.

Antes de producción, sustituye el catálogo demo por el inventario real confirmado por FORMIX y reemplaza la mascota/audio por los aprobados.

## Estructura

```text
src/
  admin/        Panel: métricas, sesiones, catálogo, QR, preparación
  components/   Marca, botones, layout, modal, sonido, SVG
  data/         Catálogo, colores y datos de ejemplo
  domain/       Tipos, códigos, premios, métricas, CSV, flow guards
  lib/          Audio y descargas
  pages/        Pantallas del visitante y del equipo
  state/        Provider, repositorio, storage, router
  styles/       Tokens y estilos
  test/         Setup, fixtures y helper de render
```

## Limitaciones declaradas

- Sin backend ni autenticación real; el canje único se garantiza solo dentro de un navegador.
- Sin sincronización entre dispositivos.
- La primera carga requiere internet; no hay service worker.
- Catálogo, fotografías, mascota y jingle son provisionales.
- El acceso del equipo es una simulación local, no seguridad real.

## Documentación

- [Guía para FORMIX](docs/GUIA-FORMIX.md) — uso, feria y lista de lo que hay que aportar.
- [Evento en modo kiosco](docs/EVENTO-KIOSCO.md) — preparación y operación del día.
- [Configuración de Supabase](docs/SUPABASE-SETUP.md) — migración, roles y conexión del backend.
- [Camino a producción](docs/PRODUCCION.md) — backend, seguridad, privacidad y QA.
- [Diseño aprobado](docs/superpowers/specs/2026-11-22-formix-lab-prototype-design.md).
- [Plan de implementación](docs/superpowers/plans/2026-11-22-formix-lab-prototype.md).
