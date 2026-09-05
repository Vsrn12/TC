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
- **API REST:** `http://127.0.0.1:8000/api/productos`
