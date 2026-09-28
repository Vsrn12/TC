# Sistema de Gestión de Productos y Carrito de Compras

Aplicación en Python con **FastAPI** para gestionar productos y simular un carrito de compras de supermercado.

**Autor:** Piero Adrian Delgado Chipana

![Captura del proyecto](Media/Captura%20de%20pantalla.png)

---

## Funciones del carrito (stateful y stateless)

El carrito (`static/cart.js`) se construyó a partir de 2 funciones **stateful** y 2 funciones **stateless**, tal como se pidió:

### Stateful (leen y modifican el estado compartido `carrito`)

- `agregarAlCarrito(producto)`: si el producto ya está en el carrito incrementa su cantidad, si no lo agrega con cantidad 1. Modifica el arreglo global `carrito`.
- `quitarDelCarrito(productoId)`: reduce en 1 la cantidad de un producto y lo elimina del carrito cuando llega a 0. Modifica el arreglo global `carrito`.

### Stateless (puras, solo dependen de sus parámetros, sin efectos secundarios)

- `calcularSubtotal(items)`: recibe un arreglo de items y retorna la suma de `precio * cantidad`.
- `calcularTotalCarrito(items, tasaIgv, costoBolsa)`: recibe el arreglo de items y las tasas, y retorna `{ subtotal, igv, bolsa, total }`.

### Reglas de negocio del carrito

- **IGV:** 18% sobre el subtotal.
- **Costo de bolsa:** S/ 0.50, se cobra únicamente si hay al menos un producto en el carrito.
- **Catálogo:** se carga desde la API (`/api/productos`), ya no está hardcodeado en el JS.

---

## Persistencia de datos

Los productos ya no se guardan solo en memoria: se persisten en `data/products.json`, que funciona como una base de datos simple en disco. El archivo se crea automáticamente (con 20 productos de supermercado por defecto) si no existe, y se actualiza en cada creación, edición o eliminación.

---

## Internacionalización (i18n)

Arriba a la derecha de todas las páginas hay un **menú desplegable** con las opciones **PE (Español)** y **EEUU (English)**, con la fecha de hoy al costado. La lógica está en `static/i18n.js` y la elección se recuerda entre páginas.

| | PE (Español) | EEUU (English) |
|---|---|---|
| Idioma | Español | Inglés |
| Moneda | Soles: `S/ 4.50` | Dólares: `$1.20` |
| Fecha | `21/09/2026` (día/mes/año) | `09/21/2026` (mes/día/año) |

- Los precios se guardan **siempre en soles**; en EEUU se convierten al mostrarlos con el tipo de cambio `PEN_POR_USD`, obtenido en tiempo real desde una API externa (ver [Tipo de cambio en tiempo real](#tipo-de-cambio-en-tiempo-real-api-externa)), con `3.75` como valor de respaldo si la API no responde. Al crear o editar un producto en EEUU, el precio escrito se interpreta en dólares y se guarda convertido a soles.
- Cada producto tiene un solo nombre. Los 20 productos por defecto se traducen al mostrarlos con un diccionario en `i18n.js`; los que crea el usuario no tienen traducción automática y se muestran igual en los dos idiomas (solo cambia el precio, a la moneda activa).
- Las páginas se sirven con la versión de sus CSS/JS en la URL (`styles.css?v=...`) y con `Cache-Control: no-cache`, para que el navegador nunca use archivos viejos.

---

## Tipo de cambio en tiempo real (API externa)

Arriba a la izquierda de todas las páginas hay un rótulo **"Api: Open Exchange Rates (Cambio de moneda constante)"** que indica que el tipo de cambio USD → PEN ya no es un número fijo en el código, sino que se consulta a una API externa.

- **Backend** (`app/services/exchange_rate_service.py`): al recibir una petición, llama a [Open Exchange Rates](https://www.exchangerate-api.com/) (`open.er-api.com`, gratuita y sin API key) para obtener la tasa `USD → PEN` del día. Si la API externa falla (sin internet, timeout, etc.) se usa una tasa de respaldo (`3.75`), sin romper la aplicación.
- **Endpoint propio:** `GET /api/tipo-cambio` (capa de presentación en `app/controllers/exchange_controller.py`), que expone la tasa obtenida en formato JSON, por ejemplo:
  ```json
  { "moneda_origen": "USD", "moneda_destino": "PEN", "tasa": 3.397195, "fecha": "Fri, 25 Sep 2026 00:02:31 +0000", "fuente": "open-er-api" }
  ```
- **Frontend** (`static/i18n.js`): al cargar cualquier página, consulta `/api/tipo-cambio` y reemplaza el valor de respaldo por la tasa real. Al llegar, dispara el evento `exchangerateupdate`, que hace que `static/products.js` y `static/cart.js` vuelvan a pintar los precios ya convertidos con la tasa actualizada, sin recargar la página.
- **Nota:** se evaluó primero usar [Frankfurter](https://frankfurter.dev), pero esa API solo cubre las divisas de referencia del Banco Central Europeo y no incluye el sol peruano (PEN), por lo que se optó por Open Exchange Rates.

---

## Validación del formulario con expresiones regulares (regex)

El formulario de productos (`/`) se valida con regex antes de enviarse, en `static/validation.js`. Los errores aparecen bajo cada campo, en el idioma activo, y no se envía nada hasta corregirlos. Se valida al salir de cada campo y de nuevo al enviar.

| Campo | Regex | Qué acepta |
|---|---|---|
| Nombre (español / inglés) | `^(?=.*\p{L})[\p{L}\p{N}][\p{L}\p{N} .,'%()/+-]{1,59}$` | 2 a 60 caracteres: letras (con tildes y ñ), números, espacios y `. , ' % ( ) / + -`; debe incluir al menos una letra. Solo es obligatorio el del idioma activo. |
| Precio | `^(?!0+(?:[.,]0+)?$)(?:0\|[1-9]\d{0,5})(?:[.,]\d{1,2})?$` | Monto mayor a 0, hasta 6 dígitos enteros y 2 decimales, con punto o coma (`12.50` o `12,50`). Sin ceros a la izquierda, sin signos ni notación científica. |

El mismo patrón del nombre se aplica en el backend (`app/services/product_service.py`, con el módulo `re` de Python), de modo que la API también rechaza nombres inválidos con un error 400, traducido al inglés en la página cuando corresponde.

---

## Páginas

- `/` → gestión de productos (alta, edición, baja).
- `/carrito` → catálogo de productos y carrito de compras.

Ambas páginas comparten estilos (`static/styles.css`) y tienen una barra de navegación para moverse entre ellas.

---

## Cómo ejecutar el proyecto

```
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
python main.py
```

- **Productos:** `http://127.0.0.1:8000/`
- **Carrito:** `http://127.0.0.1:8000/carrito`
- **Documentación interactiva (Swagger):** `http://127.0.0.1:8000/docs`
- **API REST de productos:** `http://127.0.0.1:8000/api/productos`
- **API REST de tipo de cambio:** `http://127.0.0.1:8000/api/tipo-cambio`
