# Dineto · web y landing del test

Sitio estático (HTML, CSS y JS sin compilación). Se publica tal cual en Vercel, Netlify, Cloudflare Pages o cualquier hosting. Activad la compresión (gzip o brotli); todos esos servicios la traen por defecto.

| Página | Archivo | Para qué |
| --- | --- | --- |
| Web | `index.html` | Reservar la llamada de 30 minutos |
| Landing del test | `test/index.html` | Destino de los anuncios: test, datos y resultado |
| Legal | `legal/index.html` | Aviso legal, privacidad y cookies (borrador) |
| Error | `404.html` | Página no encontrada |

## Probar en local

```bash
cd web
npx serve .          # o: python -m http.server 8000
```

## Conectar las herramientas

Todo se configura en `assets/js/core.js`, en el bloque `DINETO_CONFIG`:

| Campo | Qué poner | Si se deja vacío |
| --- | --- | --- |
| `calLink` | Enlace de Cal.com, p. ej. `dineto/30min` | El botón de reserva abre WhatsApp con un mensaje ya escrito |
| `leadEndpoint` | Webhook del formulario de la web (HubSpot, Make, Zapier o n8n) | La solicitud se envía por WhatsApp |
| `testEndpoint` | Webhook del test: recibe contacto, respuestas, nota por bloque, si encaja y UTM | El resultado se ve en pantalla, pero no llega al CRM ni se envía por correo |
| `plausibleDomain` | `dineto.es` | Sin analítica |
| `linkedinPartnerId`, `metaPixelId` | Identificadores de los píxeles | Sin píxeles ni banner de cookies |

Los dos webhooks reciben un `POST` con JSON. En el CRM:

- Con `encaja: true` (facturación de 0,5 a 4 M€ y cargo de dueño o CEO) y sin reserva, cread la tarea de llamar en menos de 24 horas.
- Usad `notas` y `peor_bloque` para la secuencia de cuatro correos.

Eventos de analítica: `cta_click`, `model_select`, `chat_ask`, `lead`, `test_start`, `test_block_done`, `test_complete` y `booking_click`.

## Antes de publicar

1. **Textos por confirmar.** Los he redactado yo porque el documento de negocio no estaba en la carpeta: los textos de cada sección, las 15 preguntas del test y las 5 de cualificación.
2. **Precio y garantía.** La web dice 2.900 € + IVA, garantía de devolución y WhatsApp incluido durante 12 meses. Está en `index.html` (sección Precio) y en el JSON-LD de la cabecera.
3. **Equipo.** Faltan las fotos reales en 4:5 y los nombres. Seguid el comentario `EQUIPO:` de `index.html`.
4. **Legal.** Completad los datos marcados en rojo en `legal/index.html` y validadlos con vuestro asesor.
5. **Empresa de ejemplo.** Las cifras de los actos (Talleres Ejemplo, 41/100, la conversación) son ilustrativas y así se indica en pantalla.

## Movimiento

GSAP 3.15 (ScrollTrigger, DrawSVG y SplitText) y Lenis 1.3, en `assets/vendor/`. Todo el contenido se ve sin JavaScript. Con «reducir movimiento» activado en el sistema, las animaciones se desactivan.
