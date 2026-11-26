# Evento en modo kiosco

> **Esta guía aplica al modo local, sin Supabase.** Si ya conectaste Supabase, el flujo recomendado es que cada visitante use su celular y el operador valide desde una tablet; el modo kiosco queda como contingencia.

Guía práctica para usar FORMIX LAB en un evento temporal con un solo dispositivo, sin backend y sin sincronización entre celulares.

## 1. Decisión importante: un solo dispositivo

El prototipo guarda los datos en el navegador. Por eso:

- **Recomendado:** un tablet o laptop en el puesto. El visitante completa la experiencia ahí y el operador valida desde otra pestaña del mismo navegador.
- **No recomendado:** que cada visitante escanee el QR en su propio celular. Su código y sus preferencias quedarían en su teléfono; el operador de la tablet no podría encontrarlos ni canjear el premio digital.
- **Única forma de usar celulares personales:** backend real con sesiones compartidas. Está documentado en [PRODUCCION.md](PRODUCCION.md), pero no es necesario para un evento temporal de bajo riesgo.

El QR impreso puede usarse para que la gente llegue a la página o para señalizar el puesto, pero el recorrido con validación debe ocurrir en el dispositivo del puesto.

## 2. Material recomendado

- Un tablet o laptop con Chrome o Edge actualizado.
- Cargador y, si es posible, batería externa.
- Un perfil de navegador dedicado al evento (sin datos personales).
- La página desplegada, por ejemplo `https://alphyyyy.github.io/FORMIX-LAB/`.
- Dos pestañas:
  - **Visitante:** `https://alphyyyy.github.io/FORMIX-LAB/#/`
  - **Equipo:** `https://alphyyyy.github.io/FORMIX-LAB/#/equipo`
- El PIN de operador y administrador, entregado en privado por el responsable.
- Una hoja de respaldo en papel por si el dispositivo falla (opcional).

## 3. Preparación antes del evento

1. Abre la web en el dispositivo del puesto y confirma que carga.
2. Entra como administrador.
3. Revisa **Catálogo** y deja solo los moldes, colores y aromas que realmente existen.
4. Haz un ciclo completo de prueba: visitante → código → operador → premio.
5. Exporta un CSV de prueba y ábrelo para comprobar que se descarga bien.
6. En **Difusión**, pulsa **Borrar todas las sesiones** para dejar el espacio limpio. Escribe `BORRAR` cuando lo pida.
7. Cierra sesión del equipo o deja la pestaña de operador lista, sin datos de prueba.
8. Comprueba que el navegador no esté en modo incógnito y que no borrará datos al cerrarse.
9. Deja el dispositivo cargando y con la pantalla configurada para no apagarse.

## 4. Operación durante el evento

1. El visitante usa la pestaña **Visitante**.
2. Completa el recorrido y llega al código de participación.
3. El operador cambia a la pestaña **Equipo**, entra con su PIN y busca el código.
4. Registra los retos y marca el premio como entregado.
5. Vuelve a la pestaña del visitante para mostrar el premio y cerrar.
6. Para el siguiente visitante, pulsa **Volver a empezar** o recarga `/#/`.

Consejo: deja la pestaña del visitante en primer plano entre personas y la del equipo en segundo plano. La sesión del operador se guarda por pestaña, así que no se pierde al cambiar.

## 5. Privacidad y datos

- No pidas nombre, teléfono, correo ni DNI.
- Los datos quedan en ese navegador; no se envían a GitHub ni a ningún servidor.
- No uses el modo incógnito: al cerrarlo se pierden las sesiones.
- No borres los datos del sitio durante el evento.
- Al finalizar, exporta los cuatro CSV desde **Sesiones** antes de limpiar nada.
- Guarda los CSV en una memoria USB, Google Drive o correo del responsable.
- Si quieres dejar el dispositivo limpio después del evento, usa **Borrar todas las sesiones** solo cuando el respaldo esté confirmado.

## 6. QR y señalización

- Imprime el QR desde **Difusión** con la URL final, nunca `localhost`.
- Si el QR apunta a la página pública, un visitante puede abrirla en su celular, pero no compartirá datos con el puesto.
- Para evitar confusión, el cartel puede decir: **“Vive la experiencia en la tablet del stand”**.
- Si quieres que el QR sea solo informativo, colócalo junto a la mesa, no como único punto de entrada.

## 7. Contingencia

- Si falla el internet después de cargar la página, la pestaña abierta sigue funcionando con los datos locales; si se recarga sin red, puede no volver a cargar porque no hay service worker.
- Si el dispositivo se apaga o se cierra el navegador, vuelve a abrir la misma URL en el mismo navegador para conservar los datos.
- Si se pierde el estado, usa una hoja de respaldo para anotar códigos, retos y premios.
- Ten a mano el PIN del equipo en un lugar privado, no visible para el público.

## 8. Cierre del evento

1. Exporta **Sesiones**, **Preferencias**, **Juegos** y **Premios**.
2. Abre los archivos y confirma que tienen datos.
3. Copia los CSV fuera del dispositivo.
4. Toma una captura del panel de resumen para el reporte.
5. Si corresponde, desactiva GitHub Pages o deja la web publicada; los datos no están en GitHub.
6. Anota incidencias y comentarios del equipo para la siguiente versión.
