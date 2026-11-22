# FORMIX LAB — Prototipo navegable

**Tipo:** diseño de producto y experiencia
**Fecha:** 22 de noviembre de 2026
**Estado:** propuesto para aprobación de FORMIX
**Base:** ERS / SRS FORMIX LAB v1.0 (18/11/2026) y referencia visual aportada por FORMIX

---

## 1. Intención y por qué

FORMIX necesita aprender qué formas, colores y aromas despiertan interés antes de invertir en moldes e insumos, y al mismo tiempo quiere que el paso por el puesto sea memorable. La web es el puente entre el QR del puesto, una dinámica digital breve y los retos físicos que valida el equipo.

Esta entrega es un **prototipo navegable completo**, no una tienda ni un formulario. Su doble función:

1. Servir como **mockup interactivo aprobable** antes de invertir en el MVP productivo.
2. Servir como **base funcional** del MVP: flujo, reglas, datos, panel y exportación ya resueltos, con persistencia local sustituible por backend.

El objetivo de la experiencia es que una persona complete el recorrido en **3–4 minutos**, sin cuenta, sin datos personales y con una recompensa clara en el puesto.

## 2. Objetivos, no objetivos y antiobjetivos

**Objetivos**

- Registrar una combinación final por sesión: molde, color y aroma.
- Medir sesiones iniciadas, completadas, participación en juegos y premios canjeados.
- Entregar un código de participación legible y validable por el operador.
- Exportar datos reales en CSV desde el panel.
- Demostrar el ciclo completo: QR → juego → combinación → validación → premio → panel → CSV.

**No objetivos de esta entrega**

- Backend real, autenticación productiva, RLS ni sincronización entre dispositivos.
- Pagos, carrito, cuentas de visitante, CRM o analítica predictiva.
- Fotos reales de producto, logo definitivo, jingle definitivo o mascota aprobada.
- Impresión del QR y despliegue en un dominio de FORMIX.

**Antiobjetivos** (aunque técnicamente funcionen, harían fallar la entrega)

- Parecer una tienda o prometer stock, reserva o compra.
- Pedir nombre, teléfono, correo o DNI para participar.
- Infantilizar la marca con exceso de caricatura, arcoíris o animación ruidosa.
- Mostrar métricas como si representaran a toda la ciudad.
- Simular seguridad o sincronización que el prototipo no tiene.

## 3. Restricciones y supuestos

- **Mobile-first**, pensada para abrirse desde un QR en el celular del visitante.
- **Local-first:** los datos viven en `localStorage` del navegador. La validación de operador funciona en el mismo navegador (dos pestañas o modo kiosco), no entre dispositivos distintos.
- **Conexión:** la primera carga requiere internet; una vez abierta, la app funciona con los datos locales. No se implementa service worker en esta iteración (ver §14).
- **Sin datos personales obligatorios.** El aviso de privacidad es informativo y la sesión es anónima.
- **Catálogo de demostración:** los nombres y estados son provisionales hasta que FORMIX confirme inventario real. La interfaz debe distinguir con claridad `Disponible` de `Concepto`.
- **Audios sintetizados** con Web Audio, sin música comercial. Se sustituirán por el jingle propio en producción.
- **Identidad:** rosa predominante, morado como acento, fondo claro, burbujas y formas de jabón. La referencia visual se usa para el recorrido de 12 pantallas, no para el acabado estético.
- **Accesibilidad básica:** alternativa al arrastre, foco visible, contraste, objetivos táctiles ≥ 44 px y respeto a `prefers-reduced-motion`.

## 4. Enfoques considerados

| Enfoque | Qué ofrece | Qué cuesta | Decisión |
|---|---|---|---|
| **A. React + Vite + TypeScript, local-first** | Flujo completo, estado persistente, panel y CSV; se despliega como sitio estático; base limpia para conectar Supabase después | Las reglas críticas quedan simuladas en el cliente; no hay sincronización entre celular y tablet | **Elegido** |
| B. MVP con Supabase desde el inicio | Reglas reales en servidor, multiusuario, canje atómico | Requiere cuentas, claves, migraciones, despliegue y decisiones de privacidad que FORMIX aún no tomó; retrasa la validación visual | Se pospone a fase productiva |
| C. HTML/CSS/JS sin compilación | Cero setup, un solo archivo | Difícil de mantener al crecer el panel, el catálogo y las pruebas; menos base para el MVP | Descartado |

**Por qué A:** maximiza lo que se puede validar ahora (experiencia, estética, flujo, datos) sin bloquear el avance por infraestructura. La separación entre la capa de datos y la interfaz permitirá sustituir `localStorage` por API/Supabase sin rehacer pantallas.

## 5. Dirección visual: “laboratorio editorial”

La referencia aportada es clara en flujo, pero su estética (gradientes morados, tipografía redondeada, emojis y caricatura) se percibe infantil y genérica. La propuesta conserva los códigos de FORMIX y sube el nivel:

- **Concepto:** cosmética artesanal de autor + laboratorio. Limpio, cálido, sensorial; lúdico sin ser infantil.
- **Paleta:** crema cálido de fondo, ciruela profundo para texto, rosa FORMIX como acento principal, lavanda y verde salvia como apoyos. El morado deja de ser el fondo dominante y pasa a ser tinta y detalle.
- **Tipografía:** display serif con carácter (Fraunces) para titulares; sans geométrica legible (Manrope) para interfaz y datos. Etiquetas en versalitas espaciadas.
- **Material:** superficies color hueso, bordes finos, sombras suaves, vidrio esmerilado solo en burbujas y códigos. Nada de neón ni sombras duras.
- **Jabón:** renders SVG propios con brillo, relieve y sombra; el color elegido tiñe el jabón en tiempo real. Sin fotos genéricas.
- **Mascota:** “Burbuja”, una pastilla de jabón rosa con gafas de laboratorio, dibujada en SVG con línea fina y volumen suave. Aparece en bienvenida, creación y premio; no satura el resto.
- **Movimiento:** burbujas lentas y discretas, revelado escalonado de moldes, espuma que se disuelve, transiciones de 180–320 ms. Todo se desactiva con movimiento reducido.
- **Escritorio:** la experiencia del visitante se centra en una columna de 480–560 px sobre un fondo editorial con marca y burbujas; el panel de equipo usa todo el ancho. En móvil, pantalla completa.

**Sketch textual de la bienvenida**

```text
┌──────────────────────────────┐
│ FORMIX  ·  LAB        ◉ sonido│
│                              │
│   Tu jabón.                  │
│   Tu fórmula.                │
│                              │
│        [Burbuja, mascota]    │
│                              │
│  3 min · sin registro        │
│  · sin datos personales      │
│                              │
│  [ Entrar al laboratorio → ] │
│                              │
│  Aviso de privacidad         │
└──────────────────────────────┘
```

## 6. Recorrido y pantallas

Cinco pasos digitales + misión, premio y cierre. La barra de progreso solo cuenta los cinco pasos de creación.

### 6.1 Bienvenida (`#/`)

- Wordmark FORMIX LAB, botón de sonido y enlace discreto “Equipo FORMIX”.
- Titular editorial, mascota y tres certezas: “3 minutos”, “Sin registro”, “Sin datos personales”.
- CTA principal: **Entrar al laboratorio**.
- Aviso de privacidad en modal: finalidad, qué se guarda, dónde, cuánto tiempo y cómo se borra.
- Al entrar se crea la sesión anónima con `startedAt`, `consentVersion` y un `sessionId`.
- Si existe una sesión en curso, se ofrece **Continuar** en lugar de empezar de cero.

### 6.2 Desafío de espuma (`#/crear/espuma`)

- Paso 1 de 5. Instrucción: llevar la pastilla a la jabonera.
- Interacción de arrastre con puntero; alternativa visible “Toca aquí para llevarla” y soporte de teclado.
- Al soltar dentro de la jabonera: la espuma se disuelve y se revelan los moldes. Sonido de espuma si el audio está activo.
- El avance se guarda; una recarga no repite la animación de forma forzada.

### 6.3 Selección de molde (`#/crear/molde`)

- Paso 2 de 5. Grid de 2 columnas con 6–8 moldes.
- Cada tarjeta: render SVG del jabón, nombre y etiqueta de estado.
- `Disponible` sin etiqueta adicional; `Concepto` con chip ámbar y microcopy “Mide interés, no disponibilidad”.
- Selección única; CTA **Continuar** deshabilitado hasta elegir.
- Los moldes `inactivos` no aparecen.

### 6.4 Selección de color (`#/crear/color`)

- Paso 3 de 5. Vista previa grande del molde elegido.
- 5–6 muestras circulares con brillo, nombre debajo y check en la seleccionada. Al elegir, el jabón cambia de color con una transición suave.
- CTA **Continuar**.

### 6.5 Selección de aroma (`#/crear/aroma`)

- Paso 4 de 5. 4–6 tarjetas con icono lineal, nombre y notas breves (“frutal · dulce”).
- Etiqueta `Concepto` cuando aplique. Nota de seguridad: no ingerir, evitar en caso de sensibilidad; participación voluntaria.
- CTA **Continuar**.

### 6.6 Tu creación (`#/crear/creacion`)

- Paso 5 de 5. Render grande del jabón con la combinación, resumen en filas y dos intenciones opcionales: “Me interesaría comprarlo” y “Sería para regalo”.
- Aclaración visible: **“Es una preferencia, no un pedido ni una reserva.”**
- CTA **Guardar mi creación** → completa la sesión, genera código y navega a la misión.
- Antes de guardar se puede volver y editar; después, la combinación queda bloqueada. Para cambiarla se inicia una nueva sesión.

### 6.7 Misión presencial (`#/mision`)

- Código grande, copiable, en formato `FX-XXXXXX` (sin caracteres ambiguos).
- Instrucción: mostrarlo al equipo FORMIX para validar los retos.
- Dos tarjetas de reto con estado: pendiente, superado o no superado.
  - **Derriba las bacterias:** seis botellas, dos lanzamientos, gana con 4+.
  - **Adivina el aroma:** tres envases, gana con 2/3 aciertos.
- Escalera de premios: participa → saludo; un reto → foto con la mascota; ambos → baile breve + foto.
- **Lectura de la escalera:** «un reto» significa un reto *ganado*; «ambos» exige ganar los dos. Si la persona juega y no gana ninguno, recibe el saludo; si no hay ningún reto validado, no hay premio todavía.
- El acertijo presencial es una actividad física opcional del puesto; no forma parte del recorrido digital ni de la escalera de premios en esta versión.
- Aviso: los resultados solo los registra el equipo; el visitante no puede marcarlos.
- CTA **Ver mi premio** cuando hay validación; si no, explica que falta el equipo.

### 6.8 Premio (`#/premio`)

- Estado pendiente: “Aún no validado”, con el código y qué falta.
- Estado desbloqueado: premio correspondiente, instrucciones y botón para mostrar el código al operador.
- Estado canjeado: sello “Entregado” con fecha y hora; no se puede volver a canjear.
- Mientras el premio no se canjee, completar un segundo reto **mejora el mismo premio** (saludo → foto → foto + baile). Después del canje, el nivel queda bloqueado; el operador debe avisar de esto antes de entregar.
- Cierre con CTA **Terminar** → gracias.

### 6.9 Gracias (`#/gracias`)

- Mensaje de marca, resumen de la combinación y recordatorio de que las elecciones alimentan la investigación.
- **Volver a empezar** crea una sesión nueva y conserva la anterior (RN-05).
- Enlace “Equipo FORMIX”.

### 6.10 Acceso del equipo (`#/equipo`)

- Selector Operador / Administrador y PIN de demostración.
- Operador: `2468`. Administrador: `1357`. En pantalla se muestra la pista de demo para que FORMIX pueda probar; en producción se elimina.
- Aviso explícito: “Acceso de demostración. La seguridad real requiere servidor.”

### 6.11 Operador (`#/operador`)

- Buscador por código. Al encontrar la sesión: combinación, estado de los juegos y del premio.
- Botones **Ganó / No ganó** por cada reto. Una vez registrado, el resultado es inmutable; pide confirmación.
- Al iniciar sesión, el operador puede escribir sus iniciales (opcional). Se guardan con cada validación y canje para auditoría; por defecto se usa «Operador».
- Al validar el primer reto, gane o pierda, se emite el premio que corresponda: saludo si no hay victorias, foto con una victoria. Mientras no se haya canjeado, validar un segundo reto **mejora el premio en el mismo registro** (saludo → foto → foto + baile).
- Una vez canjeado, el premio queda bloqueado: si llega un segundo reto ganado después del canje, el sistema lo registra pero no emite una mejora; el operador ve el aviso «premio ya entregado» y deriva el caso a la persona responsable. El operador debe avisar al visitante antes de canjear que puede completar ambos retos primero.
- Botón **Marcar premio como entregado**, con confirmación. Si ya fue canjeado, se muestran las iniciales del operador y la hora; el segundo intento se rechaza.
- Lista de últimas sesiones para operar sin escribir el código completo.

### 6.12 Panel administrativo (`#/admin`)

Tres pestañas:

- **Resumen:** tarjetas de sesiones iniciadas, completadas, tasa de finalización, participación presencial, premios emitidos/canjeados. Ranking de formas, colores y aromas con barras; top 5 combinaciones; nota metodológica sobre muestra por conveniencia.
- **Sesiones:** tabla/cards con código, fecha, combinación, retos y premio; búsqueda por código; exportaciones CSV de sesiones, preferencias, juegos y premios. Las exportaciones ofrecen «Datos reales» (excluye demo) e «Incluir demo»; la variante con demo añade la columna `origen` y el sufijo `-demo`.
- **Catálogo:** lista por tipo con estado (`Disponible`, `Concepto`, `Inactivo`). El panel solo cambia el estado; no crea, renombra ni reordena ítems en esta versión (el catálogo base vive en código y los estados se guardan como overrides). `Inactivo` retira el ítem del flujo sin borrar historial (CA-07).
- Los registros sembrados llevan `isSeed` y un sello «Demo». El panel incluye un interruptor «Incluir datos de ejemplo» (activo por defecto si no hay sesiones reales) y una acción **Preparar feria** que elimina solo los registros demo y deja el espacio limpio para el evento.
- **Difusión:** QR del enlace actual y botón de copiar enlace, para probar en celular o imprimir. Si la URL es `localhost`, se advierte que el QR no funcionará fuera de ese equipo.
- Acciones de demo: restablecer datos de ejemplo, **Preparar feria** y cerrar sesión.

## 7. Modelo de datos local

Claves versionadas en `localStorage`:

- `formix.catalog.v1` — catálogo y overrides del panel.
- `formix.sessions.v1` — sesiones, preferencias, juegos y premios.
- `formix.currentSession.v1` — token de la sesión en curso.
- `formix.sound.v1` — preferencia de sonido.
- `formix.staff.v1` — sesión de personal (sessionStorage para el login).

Entidades:

```text
CatalogItem  id, type(shape|color|scent), name, notes, status(available|proposed|inactive),
             sortOrder, swatch?, icon?, createdAt

Session      id, startedAt, completedAt?, state(started|completed), code?,
             consentVersion, foamDone, preferences?, games?, reward?, isSeed?

Preferences  shapeId, colorId, scentId, purchaseIntent, giftIntent, submittedAt

GameResult   gameType(bacteria|aroma), result(WIN|LOSE), validatedAt, operatorInitials?

Reward       type(greeting|photo|photo_dance), issuedAt, redeemedAt?, redeemedBy?
```

`status` gobierna la visibilidad: `inactive` equivale a no visible. No se usa un campo `isActive` separado para evitar dos fuentes de verdad.

Reglas:

- Una sesión guarda una única combinación final; se puede editar hasta confirmar (RN-01).
- El código es aleatorio, no secuencial y único; se genera al completar. En el prototipo se guarda en claro para permitir la búsqueda del operador; en producción se almacenará hash/token (RN-05, integridad).
- Los resultados de juegos son inmutables una vez registrados y solo los escribe el modo operador (RN-04).
- El premio se emite una sola vez por sesión. Mientras no se canjee, su nivel puede mejorar al validar más retos; tras el canje queda bloqueado y se rechaza un segundo intento (RN-03).
- Las opciones inactivas dejan de ofrecerse, pero las sesiones históricas conservan sus referencias (RN-07).
- El catálogo base vive en código; el panel solo guarda overrides de estado. No hay CRUD de ítems en esta versión.
- Los registros sembrados se marcan con `isSeed`; las exportaciones reales los excluyen y la variante con demo los identifica con `origen`.
- Repetir la experiencia crea una sesión nueva; no se fusiona con la anterior (RN-05).
- No se solicitan datos personales. Las intenciones de compra/regalo son opcionales (RN-06).

## 8. Métricas y CSV

- **Sesiones iniciadas:** total de sesiones.
- **Tasa de finalización:** completadas / iniciadas × 100.
- **Preferencias:** conteo y porcentaje por atributo entre sesiones completadas.
- **Top combinaciones:** agrupación por molde + color + aroma entre sesiones completadas.
- **Participación presencial:** sesiones con al menos un juego validado.
- **Premios:** emitidos y canjeados; tasa de canje = canjeados / emitidos × 100.
- **Conversión a venta:** no se implementa (fuera del MVP), pero el modelo deja espacio.
- Las métricas usan sesiones reales por defecto. El interruptor «Incluir demo» permite ver el panel poblado; los seeds nunca cuentan como «reales» en las exportaciones.
- **Preparar feria:** elimina los registros `isSeed` y deja intactas las sesiones reales.

Exportaciones independientes en UTF-8 con BOM para Excel:

1. `formix-sesiones-AAAA-MM-DD.csv`
2. `formix-preferencias-AAAA-MM-DD.csv`
3. `formix-juegos-AAAA-MM-DD.csv`
4. `formix-premios-AAAA-MM-DD.csv`

Encabezados claros, fechas ISO y nombres de catálogo resueltos además de los IDs. No se exportan datos personales porque no existen. La exportación «real» excluye `isSeed`; la variante con demo agrega la columna `origen` y el sufijo `-demo` al nombre del archivo.

## 9. Reglas de interacción y accesibilidad

- El arrastre nunca es la única vía: botón equivalente y activación por teclado.
- Objetivos táctiles de 44 px o más; foco visible; navegación por teclado en todo el flujo.
- Contraste AA en texto y controles; no se depende solo del color para indicar estado.
- `prefers-reduced-motion`: se desactivan burbujas, parallax y transiciones largas.
- Audio apagado por defecto hasta la primera interacción; botón de silencio visible y persistente (RN-08).
- Aviso de conexión: si `navigator.onLine` es falso, se indica que los datos se guardan en el dispositivo. No se promete sincronización.
- La primera visita necesita conexión para descargar la app. No hay service worker ni arranque en frío sin red en esta iteración; queda como decisión de producción.
- Los estados de error (código inexistente, premio ya canjeado, opción desactivada) se explican en lenguaje claro y con salida.

## 10. Arquitectura técnica

- **Frontend:** React + Vite + TypeScript.
- **Estilos:** CSS propio con tokens de diseño; sin framework de UI para controlar la identidad.
- **Fuentes:** Fraunces y Manrope empaquetadas localmente (`@fontsource-variable`), sin depender de Google Fonts en la feria.
- **Rutas:** hash router propio (`#/...`), sin dependencia de servidor; recarga y enlace directo funcionan en hosting estático.
- **Estado:** contexto + reducer, con persistencia en `localStorage` y sincronización entre pestañas mediante el evento `storage`.
- **Capa de datos:** módulo `storage`/`repository` aislado para sustituirlo por API/Supabase en la fase productiva.
- **Admin:** carga diferida (*code splitting*) para que el visitante no descargue el panel.
- **QR:** componente `qrcode.react` que codifica la URL actual; solo en el panel.
- **Audio:** Web Audio API, secuencias cortas sintetizadas; sin archivos externos.
- **Pruebas:** Vitest para lógica (códigos, métricas, CSV, premios, guardas de flujo) y React Testing Library para pantallas críticas; verificación manual del ciclo completo en navegador móvil.

## 11. Criterios de aceptación del prototipo

| Caso | Resultado esperado |
|---|---|
| CA-01 Abrir desde QR | Carga en Android/iPhone, sin instalar app ni crear cuenta |
| CA-02 Selección de atributos | Se guarda una combinación con IDs válidos y estado del catálogo |
| CA-03 Recarga | Recupera la sesión y el paso si existe token local válido |
| CA-04 Doble canje | El segundo intento en el mismo navegador se rechaza con mensaje claro |
| CA-05 Visitante intenta validar | No existe control para hacerlo; el modo operador requiere PIN |
| CA-06 Exportar CSV | Cuatro archivos legibles; la exportación real excluye demo y la variante con demo marca `origen` |
| CA-07 Desactivar aroma | Deja de ofrecerse en el flujo; las sesiones anteriores no cambian |
| CA-08 Sin conexión | Aviso comprensible; los datos locales siguen guardándose sin fingir backend |
| CA-09 Audio apagado | La experiencia sigue siendo completamente utilizable |
| CA-10 Ciclo completo | QR → juego → combinación → validación → premio → panel → CSV |
| CA-11 Segundo reto tras canje | No se duplica el premio; el nivel queda bloqueado y se informa al operador |
| CA-12 Preparar feria | Elimina solo los seeds y conserva las sesiones reales |

**Limitación declarada:** CA-04 y CA-05 se cumplen dentro del mismo navegador; la garantía multidispositivo y multiusuario requiere el backend productivo.

## 12. Entregables

- Aplicación estática ejecutable con `npm run dev` y `npm run build`.
- Flujo del visitante completo, operador y panel administrativo.
- Catálogo de demostración con cambio de estado desde el panel y datos de ejemplo.
- Exportación CSV real.
- `README.md` con arranque, rutas, PINs y despliegue.
- `docs/GUIA-FORMIX.md` con instrucciones para el equipo y lista de lo que debe aportar.
- `docs/PRODUCCION.md` con el camino a Supabase/backend, seguridad, privacidad y checklist de feria.
- Pruebas automatizadas de la lógica crítica.

## 13. Lo que queda a cargo de FORMIX / del siguiente paso productivo

1. Confirmar catálogo real: moldes, colores y aromas; cuáles están disponibles, cuáles son concepto y cuáles se retiran.
2. Aprobar logotipo, fotografías reales, mascota y jingle; sustituir los provisionales.
3. Decidir si el acertijo es obligatorio u opcional y confirmar la mascota en la feria. En esta versión el acertijo es una actividad física opcional, fuera del flujo digital y de la escalera de premios.
4. Definir fecha, duración, conectividad y responsable del panel/exportación/respaldo.
5. Para producción: crear el proyecto de backend (Supabase o equivalente), aportar claves y dominio, revisar privacidad y desplegar. Sin esas cuentas no se pueden garantizar reglas entre dispositivos.
6. Imprimir el QR del dominio final y probar el ciclo completo en celulares reales antes de la feria.

## 14. Decisiones del constructor

- Stack, estructura, router y pruebas: React + Vite + TypeScript, hash routing, Vitest.
- Estética: “laboratorio editorial” descrita arriba, alejada del cartoon de la referencia.
- Datos de ejemplo: sembrados para que el panel sea demostrable desde el primer arranque, con opción de restablecer.
- Catálogo demo: 8 moldes, 6 colores y 6 aromas, con mezcla de disponibles y conceptos; editable en el panel.
- Los códigos usan prefijo `FX-` y seis caracteres sin ambigüedad.
- El acceso del equipo y el canje único son simulaciones locales declaradas, no seguridad real.
- **Escalera de premios:** «un reto» = un reto ganado; 0 victorias con al menos un reto validado = saludo; sin retos validados = sin premio. El acertijo físico no cuenta.
- **Mejora del premio:** el nivel se actualiza en el mismo registro mientras no haya canje; después queda bloqueado y el operador deriva el caso.
- **Identidad del equipo:** iniciales opcionales al iniciar sesión; por defecto «Operador». No se exige una cuenta nominal.
- **Catálogo:** solo cambios de estado (`Disponible`, `Concepto`, `Inactivo`), sin CRUD completo; el catálogo base se edita en código.
- **Datos demo:** separados por `isSeed`, con interruptor para incluirlos y acción «Preparar feria» que solo borra seeds.
- **Sin service worker:** la primera carga requiere red; el soporte offline en frío queda para producción.
