# Guía para FORMIX

Esta guía explica cómo abrir, probar y preparar el prototipo de **FORMIX LAB** sin conocimientos técnicos profundos. Para el detalle técnico, consulta el [README](../README.md) y el [camino a producción](PRODUCCION.md).

## 1. Qué tienes en la mano

Una web que se abre desde un QR y guía a una persona por este recorrido:

1. Bienvenida y aviso de privacidad.
2. Desafío de espuma.
3. Elección de molde, color y aroma.
4. Resumen de la combinación y guardado.
5. Código de participación.
6. Retos físicos validados por el equipo.
7. Premio y cierre.

También incluye un panel para el equipo con métricas, sesiones, catálogo, QR y exportación CSV.

**No es** una tienda, no cobra, no reserva stock y no pide datos personales.

## 2. Instalarlo en tu computadora

Necesitas:

- Node.js 22 o superior. Descárgalo de [nodejs.org](https://nodejs.org/) y elige la versión LTS.
- Un navegador actualizado.

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Para detener el servidor, pulsa `Ctrl + C`.

Si `npm` no se reconoce, cierra y vuelve a abrir la terminal después de instalar Node.

## 3. Probar la experiencia como visitante

1. Pulsa **Entrar al laboratorio**.
2. Arrastra la pastilla a la jabonera o pulsa **Toca aquí para llevarla**.
3. Elige un molde y pulsa **Continuar**.
4. Elige un color y continúa.
5. Elige un aroma y continúa.
6. Revisa la combinación, marca si te interesaría comprarla o si sería para regalo, y pulsa **Guardar mi creación**.
7. Copia el código de la pantalla de misión.

La experiencia está pensada para durar unos 3–4 minutos.

## 4. Probar el modo operador

1. Abre otra pestaña en `/#/equipo`.
2. Pulsa **Operador**, escribe el PIN `2468` y entra.
3. Pega el código del visitante y pulsa **Buscar**.
4. Pulsa **Ganó** o **No ganó** en cada reto. Confirma la acción.
5. El premio se emite al validar el primer reto. Al validar el segundo, sube de nivel si corresponde.
6. Pulsa **Marcar premio como entregado**. Solo se puede canjear una vez.
7. Vuelve a la pestaña del visitante: la pantalla se actualiza sola.

**Importante:** la sincronización es entre pestañas del mismo navegador. En una feria real, el celular del visitante y la tablet del operador necesitan el backend de producción.

## 5. Probar el panel administrativo

1. Abre `/#/equipo`.
2. Pulsa **Administrador**, escribe `1357` y entra.
3. **Resumen:** sesiones, finalización, participación, premios y preferencias.
4. **Sesiones:** tabla con combinaciones, retos, premio y origen (demo/real).
5. **Catálogo:** cambia el estado de moldes, colores y aromas.
6. **Difusión:** QR, copiar enlace, preparación de feria y reset de demo.

### Exportar los CSV

En **Sesiones**, elige si quieres incluir los datos de ejemplo y pulsa:

- **Sesiones CSV** — una fila por sesión con combinación, intenciones, retos y premio.
- **Preferencias CSV** — molde, color y aroma con IDs y nombres.
- **Juegos CSV** — resultado, fecha y operador.
- **Premios CSV** — tipo, emisión, canje y responsable.

Los archivos se descargan a la carpeta de descargas del navegador. Se abren en Excel; el BOM evita problemas con tildes y ñ.

## 6. Preparar la feria

Antes del evento:

1. Entra como administrador.
2. Revisa **Catálogo** y deja solo como disponibles los moldes, colores y aromas que realmente existen.
3. Prueba un ciclo completo con un código de prueba.
4. Exporta un CSV de prueba y ábrelo.
5. En **Difusión**, pulsa **Preparar feria** para quitar los ejemplos.
6. Si además quieres borrar las sesiones de prueba, usa **Borrar todas las sesiones** (pide escribir `BORRAR`).
7. Despliega la web en el dominio definitivo.
8. Genera e imprime el QR desde **Difusión**.
9. Abre el QR desde un celular real y confirma que carga.

**No imprimas un QR de `localhost`**: solo funcionaría en la computadora que sirve la web.

## 7. Qué debe aportar FORMIX para producción

| Necesidad | Detalle |
|---|---|
| Catálogo real | Moldes, colores y aromas confirmados; marcar disponible vs. concepto vs. retirado |
| Fotografías | Fotos reales de productos y puesto; sustituir los SVG provisionales si se desea |
| Marca | Logotipo, mascota aprobada, tipografías definitivas |
| Audio | Jingle propio o audio con licencia; el prototipo usa sonidos sintetizados |
| Hosting y dominio | Cuenta en Netlify, Vercel, GitHub Pages o equivalente |
| Backend | Proyecto de Supabase o equivalente, claves y permisos |
| Privacidad | Revisión del aviso y del plazo de conservación |
| Responsable | Persona a cargo del panel, la exportación y el respaldo |
| Evento | Fecha, duración, conectividad esperada y número de operadores |

Sin esas piezas se puede demostrar el prototipo, pero no garantizar reglas entre dispositivos.

## 8. Checklist del día de la feria

- [ ] Web desplegada y probada desde el dominio final.
- [ ] QR impreso y probado con al menos dos celulares.
- [ ] Panel abierto en el equipo del responsable.
- [ ] Operador con PIN y código de prueba validado.
- [ ] CSV exportado y respaldado fuera del hosting.
- [ ] Batería, cargador y datos móviles o Wi-Fi del puesto.
- [ ] Plan manual para los juegos si se cae la conexión.
- [ ] Mascota, premios y materiales listos.

## 9. Problemas frecuentes

| Problema | Solución |
|---|---|
| `npm` no se reconoce | Instala Node LTS y reinicia la terminal |
| El QR no abre en el celular | Estás usando `localhost`; despliega la web o usa la URL de red local |
| El operador no ve el código del visitante | Debe abrir la web en otra pestaña del mismo navegador |
| El premio ya fue entregado | El canje es único; usa **Restablecer demo** solo en pruebas |
| Se perdieron los datos | El prototipo guarda en el navegador; no borres los datos del sitio |
| El panel está vacío | Activa **Incluir datos de ejemplo** o crea una sesión nueva |

## 10. Contacto técnico

Entrega el repositorio, el README y las credenciales de despliegue a la persona responsable. Para la puesta en producción, usa el documento [PRODUCCION.md](PRODUCCION.md).
