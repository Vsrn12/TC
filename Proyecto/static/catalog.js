// Catálogo visual de la tienda: categorías, colores de acento e íconos (icons.js) de cada producto.
// Las claves de categoría son las mismas que valida el backend (CATEGORIAS en product_service.py).

const CATEGORIAS = [
  { clave: "abarrotes", icono: "package", color: "#a16207" },
  { clave: "lacteos", icono: "milk", color: "#0369a1" },
  { clave: "carnes", icono: "beef", color: "#b91c1c" },
  { clave: "frutas_verduras", icono: "leafy-green", color: "#15803d" },
  { clave: "panaderia", icono: "croissant", color: "#c2410c" },
  { clave: "bebidas", icono: "cup-soda", color: "#6d28d9" },
  { clave: "limpieza", icono: "spray-can", color: "#0e7490" },
];

// Íconos de los 20 productos por defecto; los nuevos usan el ícono de su categoría.
const PRODUCT_ICONS = {
  "Arroz 1kg": "wheat",
  "Azúcar 1kg": "candy",
  "Aceite 1L": "droplet",
  "Fideos 500g": "soup",
  "Leche evaporada": "milk",
  "Huevos x30": "egg",
  "Pan francés": "croissant",
  "Pollo entero": "drumstick",
  "Carne molida 1kg": "beef",
  "Atún en lata": "fish",
  "Papa 1kg": "bean",
  "Cebolla 1kg": "sprout",
  "Tomate 1kg": "cherry",
  "Manzana 1kg": "apple",
  "Plátano 1kg": "banana",
  "Queso fresco 500g": "cake-slice",
  "Mantequilla 200g": "sandwich",
  "Café instantáneo": "coffee",
  "Gaseosa 3L": "cup-soda",
  "Papel higiénico x4": "toilet",
};

// Desde cuántas unidades disponibles se muestra "¡Últimas N!".
const STOCK_BAJO = 5;

function categoriaInfo(clave) {
  return CATEGORIAS.find((item) => item.clave === clave) || CATEGORIAS[0];
}

function categoryName(clave) {
  return t(`cat.${clave}`);
}

// <svg> del producto (o de su categoría), en el color de acento de la categoría.
function productIcon(producto, clase = "") {
  return icon(PRODUCT_ICONS[producto.nombre] || categoriaInfo(producto.categoria).icono, clase);
}

// ---- Funciones stateless (puras): solo dependen de sus parámetros ----

// Quita tildes y pasa a minúsculas, para buscar "platano" y encontrar "Plátano".
function normalizarTexto(texto) {
  return String(texto).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

// Filtra por categoría y por texto (busca en el nombre original y en el traducido).
function filtrarProductos(productos, { texto = "", categoria = "todas" } = {}, nombreDe = (p) => p.nombre) {
  const buscado = normalizarTexto(texto);
  return productos.filter(
    (producto) =>
      (categoria === "todas" || producto.categoria === categoria) &&
      normalizarTexto(`${producto.nombre} ${nombreDe(producto)}`).includes(buscado)
  );
}

// Retorna una copia ordenada; no modifica el arreglo recibido.
function ordenarProductos(productos, orden, nombreDe = (p) => p.nombre) {
  const copia = [...productos];
  const comparadores = {
    "precio-asc": (a, b) => a.precio - b.precio,
    "precio-desc": (a, b) => b.precio - a.precio,
    nombre: (a, b) => nombreDe(a).localeCompare(nombreDe(b)),
  };
  return comparadores[orden] ? copia.sort(comparadores[orden]) : copia;
}
