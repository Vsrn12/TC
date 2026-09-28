// Internacionalización compartida por todas las páginas.
// Los precios se guardan siempre en soles (PEN); en EEUU se convierten a dólares solo al mostrarlos.

const LOCALES = {
  pe: { lang: "es", intl: "es-PE", currency: "PEN" },
  us: { lang: "en", intl: "en-US", currency: "USD" },
};

// Tipo de cambio: soles por 1 dólar. Arranca en un valor de respaldo y se reemplaza por el
// tipo de cambio real apenas responde la API externa (Open Exchange Rates, vía /api/tipo-cambio).
let PEN_POR_USD = 3.75;

// Consulta el tipo de cambio a nuestro backend, que a su vez lo obtiene de Open Exchange Rates.
async function actualizarTipoCambio() {
  try {
    const response = await fetch("/api/tipo-cambio");
    const { tasa } = await response.json();
    if (typeof tasa === "number" && tasa > 0) {
      PEN_POR_USD = tasa;
      document.dispatchEvent(new CustomEvent("exchangerateupdate"));
    }
  } catch (_) {
    // Sin conexión con la API externa: se sigue usando el tipo de cambio de respaldo.
  }
}

const LOCALE_STORAGE_KEY = "locale";

const TRANSLATIONS = {
  es: {
    "nav.products": "Productos",
    "nav.cart": "Carrito",
    "locale.label": "Idioma y región",

    "products.heading": "Gestión de Productos",
    "form.name": "Nombre del producto",
    "form.price": "Precio (S/)",
    "form.add": "Agregar",
    "form.update": "Actualizar",
    "form.cancel": "Cancelar",
    "table.id": "ID",
    "table.name": "Nombre",
    "table.price": "Precio",
    "table.actions": "Acciones",
    "action.edit": "Editar",
    "action.delete": "Eliminar",
    "error.generic": "Ocurrió un error al procesar la solicitud.",
    "validation.required": "Este campo es obligatorio.",
    "validation.nameFormat": "Usa de 2 a 60 caracteres: letras, números, espacios y . , ' % ( ) / + - (con al menos una letra).",
    "validation.priceFormat": "Ingresa un monto mayor a 0, de hasta 6 dígitos y 2 decimales (ej. 12.50).",
    "error.delete": "No se pudo eliminar el producto.",

    "cart.heading": "Carrito de Compras",
    "cart.catalog": "Catálogo del Supermercado",
    "cart.yourCart": "Tu Carrito",
    "cart.product": "Producto",
    "cart.price": "Precio",
    "cart.quantity": "Cantidad",
    "cart.subtotal": "Subtotal",
    "cart.actions": "Acciones",
    "cart.tax": "IGV (18%)",
    "cart.bag": "Costo de bolsa",
    "cart.total": "Total",
    "cart.add": "Agregar",
    "cart.remove": "Quitar",
  },
  en: {
    "nav.products": "Products",
    "nav.cart": "Cart",
    "locale.label": "Language and region",

    "products.heading": "Product Management",
    "form.name": "Product name",
    "form.price": "Price ($)",
    "form.add": "Add",
    "form.update": "Update",
    "form.cancel": "Cancel",
    "table.id": "ID",
    "table.name": "Name",
    "table.price": "Price",
    "table.actions": "Actions",
    "action.edit": "Edit",
    "action.delete": "Delete",
    "error.generic": "An error occurred while processing the request.",
    "validation.required": "This field is required.",
    "validation.nameFormat": "Use 2 to 60 characters: letters, numbers, spaces and . , ' % ( ) / + - (with at least one letter).",
    "validation.priceFormat": "Enter an amount greater than 0, up to 6 digits and 2 decimals (e.g. 12.50).",
    "error.delete": "The product could not be deleted.",

    "cart.heading": "Shopping Cart",
    "cart.catalog": "Supermarket Catalog",
    "cart.yourCart": "Your Cart",
    "cart.product": "Product",
    "cart.price": "Price",
    "cart.quantity": "Quantity",
    "cart.subtotal": "Subtotal",
    "cart.actions": "Actions",
    "cart.tax": "VAT (18%)",
    "cart.bag": "Bag fee",
    "cart.total": "Total",
    "cart.add": "Add",
    "cart.remove": "Remove",
  },
};

// Traducción de los 20 productos que vienen por defecto en data/products.json. Los productos
// que se crean o editan solo tienen un nombre, y se muestran igual en los dos idiomas.
const PRODUCT_NAMES_EN = {
  "Arroz 1kg": "Rice 1kg",
  "Azúcar 1kg": "Sugar 1kg",
  "Aceite 1L": "Oil 1L",
  "Fideos 500g": "Pasta 500g",
  "Leche evaporada": "Evaporated milk",
  "Huevos x30": "Eggs x30",
  "Pan francés": "French bread",
  "Pollo entero": "Whole chicken",
  "Carne molida 1kg": "Ground beef 1kg",
  "Atún en lata": "Canned tuna",
  "Papa 1kg": "Potatoes 1kg",
  "Cebolla 1kg": "Onions 1kg",
  "Tomate 1kg": "Tomatoes 1kg",
  "Manzana 1kg": "Apples 1kg",
  "Plátano 1kg": "Bananas 1kg",
  "Queso fresco 500g": "Fresh cheese 500g",
  "Mantequilla 200g": "Butter 200g",
  "Café instantáneo": "Instant coffee",
  "Gaseosa 3L": "Soda 3L",
  "Papel higiénico x4": "Toilet paper x4",
};

// Mensajes de error que devuelve el backend (en español) y su equivalente en inglés.
const BACKEND_ERRORS_EN = [
  [/^El ID del producto debe ser un entero positivo\.$/, () => "The product ID must be a positive integer."],
  [/^El nombre del producto no puede estar vacío\.$/, () => "The product name cannot be empty."],
  [/^El precio del producto debe ser estrictamente mayor a 0\.$/, () => "The product price must be strictly greater than 0."],
  [/^El nombre del producto debe tener de 2 a 60 caracteres/, () => "The product name must be 2 to 60 characters long (letters, numbers, spaces and . , ' % ( ) / + -) and include at least one letter."],
  [
    /^Producto con id (\d+) no encontrado( para actualizar| para eliminar)?\.$/,
    (_, id, suffix) => {
      const action = { " para actualizar": " for update", " para eliminar": " for deletion" }[suffix] || "";
      return `Product with id ${id} not found${action}.`;
    },
  ],
];

let currentLocale = loadLocale();

function loadLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved in LOCALES) return saved;
  } catch (_) {
    // localStorage no disponible: se usa el valor por defecto.
  }
  return "pe";
}

function getLocale() {
  return currentLocale;
}

function t(key) {
  return TRANSLATIONS[LOCALES[currentLocale].lang][key] ?? key;
}

function getLang() {
  return LOCALES[currentLocale].lang;
}

// Nombre del producto en el idioma activo. Los 20 productos por defecto se traducen con el
// diccionario de arriba; los que crea el usuario solo tienen un nombre y se muestran igual
// en los dos idiomas (no hay traducción automática).
function productName(producto) {
  if (getLang() === "en") return PRODUCT_NAMES_EN[producto.nombre] || producto.nombre;
  return producto.nombre;
}

function translateBackendError(detail, fallbackKey = "error.generic") {
  if (typeof detail !== "string") return t(fallbackKey);
  if (LOCALES[currentLocale].lang === "es") return detail;
  for (const [pattern, build] of BACKEND_ERRORS_EN) {
    const match = detail.match(pattern);
    if (match) return build(...match);
  }
  return detail;
}

// Convierte un monto en soles a la moneda activa (redondeado a centavos).
function toDisplayAmount(montoPen, locale = currentLocale) {
  const amount = LOCALES[locale].currency === "USD" ? montoPen / PEN_POR_USD : montoPen;
  return Math.round(amount * 100) / 100;
}

// Convierte un monto escrito en la moneda de `locale` a soles (redondeado a centavos).
function fromDisplayAmount(monto, locale = currentLocale) {
  const pen = LOCALES[locale].currency === "USD" ? monto * PEN_POR_USD : monto;
  return Math.round(pen * 100) / 100;
}

// Da formato de moneda a un monto ya expresado en la moneda activa: "S/ 4.50" o "$1.20".
function formatCurrency(monto) {
  const { intl, currency } = LOCALES[currentLocale];
  return new Intl.NumberFormat(intl, { style: "currency", currency }).format(monto);
}

// Da formato de moneda a un monto guardado en soles.
function formatMoney(montoPen) {
  return formatCurrency(toDisplayAmount(montoPen));
}

// PE: 21/09/2026 (día/mes/año) — EEUU: 09/21/2026 (mes/día/año).
function formatDate(date = new Date()) {
  return new Intl.DateTimeFormat(LOCALES[currentLocale].intl, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function applyTranslations() {
  document.documentElement.lang = LOCALES[currentLocale].lang;

  for (const el of document.querySelectorAll("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n);
  }
  for (const el of document.querySelectorAll("[data-i18n-placeholder]")) {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  }
  for (const el of document.querySelectorAll("[data-i18n-aria-label]")) {
    el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel));
  }

  const selector = document.getElementById("locale-select");
  if (selector) selector.value = currentLocale;

  const dateEl = document.getElementById("current-date");
  if (dateEl) dateEl.textContent = formatDate();
}

function setLocale(locale) {
  if (!(locale in LOCALES) || locale === currentLocale) return;
  const previous = currentLocale;
  currentLocale = locale;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch (_) {
    // Si no se puede guardar, el cambio sigue valiendo para esta sesión.
  }
  applyTranslations();
  document.dispatchEvent(new CustomEvent("localechange", { detail: { previous, current: locale } }));
}

// Menú desplegable de idioma: cada <option> tiene como value la clave de LOCALES ("pe" o "us").
document.addEventListener("change", (event) => {
  if (event.target.id === "locale-select") setLocale(event.target.value);
});

applyTranslations();
actualizarTipoCambio();
