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
    "nav.store": "Tienda",
    "nav.admin": "Panel admin",
    "locale.label": "Idioma y región",
    "announce.fx": "Tipo de cambio en vivo",
    "announce.shipping": "Delivery gratis en Lima",
    "footer.text": "Proyecto académico · Arquitectura en N capas con FastAPI",
    "footer.tech": "Compra segura · Stock en tiempo real · Delivery en Lima",

    "hero.tag": "Stock en tiempo real",
    "hero.title": "Lo fresco del mercado, en tu puerta",
    "hero.subtitle": "Elige tus productos, resérvalos al instante y confirma tu pedido en segundos. Lo que ves disponible es lo que hay de verdad.",
    "hero.cta": "Comprar ahora",
    "hero.products": "productos",
    "hero.categories": "categorías",
    "hero.online": "comprando ahora",

    "store.search": "Buscar productos…",
    "store.catalog": "Nuestros productos",
    "store.all": "Todos",
    "store.sort": "Ordenar",
    "sort.relevance": "Destacados",
    "sort.priceAsc": "Precio: menor a mayor",
    "sort.priceDesc": "Precio: mayor a menor",
    "sort.name": "Nombre A-Z",
    "store.empty": "No encontramos productos con esa búsqueda",
    "store.add": "Agregar",
    "store.inCart": "{n} en tu carrito",
    "store.available": "Disponibles: {n}",
    "store.lastUnits": "¡Últimas {n}!",
    "store.soldOut": "Agotado",

    "cat.abarrotes": "Abarrotes",
    "cat.lacteos": "Lácteos y huevos",
    "cat.carnes": "Carnes",
    "cat.frutas_verduras": "Frutas y verduras",
    "cat.panaderia": "Panadería",
    "cat.bebidas": "Bebidas",
    "cat.limpieza": "Limpieza",

    "cart.title": "Carrito",
    "cart.yourCart": "Tu carrito",
    "cart.empty": "Tu carrito está vacío",
    "cart.emptyHint": "Agrega productos del catálogo para empezar.",
    "cart.subtotal": "Subtotal",
    "cart.tax": "IGV (18%)",
    "cart.bag": "Bolsa",
    "cart.total": "Total",
    "cart.checkout": "Finalizar compra",
    "cart.continue": "Seguir comprando",
    "cart.remove": "Quitar",
    "cart.increase": "Agregar uno",
    "cart.decrease": "Quitar uno",
    "cart.reservedNote": "Tus productos quedan reservados mientras tengas la página abierta.",

    "checkout.title": "Datos de entrega",
    "checkout.subtitle": "Completa tus datos para confirmar el pedido.",
    "checkout.name": "Nombre y apellido",
    "checkout.document": "DNI",
    "checkout.email": "Correo electrónico",
    "checkout.phone": "Celular",
    "checkout.address": "Dirección de entrega",
    "checkout.payment": "Método de pago",
    "pay.efectivo": "Efectivo",
    "pay.tarjeta": "Tarjeta",
    "pay.yape": "Yape",
    "checkout.toPay": "Total a pagar",
    "checkout.confirm": "Confirmar pedido",
    "checkout.processing": "Procesando…",
    "receipt.title": "¡Pedido confirmado!",
    "receipt.subtitle": "Gracias por tu compra, {name}. Te enviaremos el detalle a {email}.",
    "receipt.code": "Código de pedido",
    "receipt.date": "Fecha",
    "receipt.payment": "Pago",

    "validation.required": "Este campo es obligatorio.",
    "validation.nameFormat": "Usa de 2 a 60 caracteres: letras, números, espacios y . , ' % ( ) / + - (con al menos una letra).",
    "validation.priceFormat": "Ingresa un monto mayor a 0, de hasta 6 dígitos y 2 decimales (ej. 12.50).",
    "validation.stockFormat": "Ingresa un número entero de 0 a 99999.",
    "validation.categoryFormat": "Elige una categoría.",
    "validation.customerName": "Ingresa tu nombre y apellido (solo letras).",
    "validation.document": "El DNI tiene 8 dígitos.",
    "validation.email": "Ingresa un correo válido (ej. nombre@correo.com).",
    "validation.phone": "El celular tiene 9 dígitos y empieza en 9.",
    "validation.address": "Ingresa una dirección de 5 a 100 caracteres.",
    "validation.payment": "Elige un método de pago.",

    "admin.title": "Panel de administración",
    "admin.subtitle": "Ventas, pedidos y stock actualizados en tiempo real.",
    "kpi.sales": "Ventas totales",
    "kpi.orders": "Pedidos",
    "kpi.units": "Unidades vendidas",
    "kpi.lowStock": "Productos con stock bajo",
    "kpi.avgTicket": "Ticket promedio: {amount}",
    "kpi.inCarts": "{n} en carritos ahora mismo",
    "kpi.soldOut": "{n} agotados",
    "kpi.lastOrder": "Último: {code}",
    "admin.byCategory": "Ventas por categoría",
    "admin.noSales": "Aún no hay ventas. Haz un pedido desde la tienda y míralo aparecer aquí.",
    "admin.recentOrders": "Pedidos recientes",
    "admin.live": "En vivo",
    "admin.noOrders": "Todavía no hay pedidos.",
    "admin.products": "Productos",
    "admin.searchProducts": "Buscar producto…",

    "form.name": "Nombre del producto",
    "form.price": "Precio (S/)",
    "form.stock": "Stock",
    "form.category": "Categoría",
    "form.add": "Agregar",
    "form.update": "Actualizar",
    "form.cancel": "Cancelar",
    "table.id": "ID",
    "table.product": "Producto",
    "table.price": "Precio",
    "table.stock": "Stock",
    "table.reserved": "{n} en carritos",
    "table.actions": "Acciones",
    "action.edit": "Editar",
    "action.delete": "Eliminar",
    "error.generic": "Ocurrió un error al procesar la solicitud.",
    "error.delete": "No se pudo eliminar el producto.",
    "error.offline": "Sin conexión con el servidor. Espera unos segundos e inténtalo otra vez.",

    "rt.user": "1 en línea",
    "rt.users": "{n} en línea",
    "rt.offline": "Reconectando…",
    "unit.one": "1 unidad",
    "unit.many": "{n} unidades",
    "toast.created": "Nuevo producto: {name}",
    "toast.updated": "Producto actualizado: {name}",
    "toast.deleted": "Producto eliminado: {name}",
    "toast.purchaseOthers": "Otro cliente acaba de comprar {units}",
    "toast.newOrder": "Nuevo pedido {code} · {total}",
    "toast.noStock": "Ya no quedan unidades de {name}",
    "toast.removedFromCart": "{name} se quitó de tu carrito porque fue eliminado",
    "toast.cartAdjusted": "Algunas unidades de tu carrito ya no estaban disponibles",
  },
  en: {
    "nav.store": "Store",
    "nav.admin": "Admin panel",
    "locale.label": "Language and region",
    "announce.fx": "Live exchange rate",
    "announce.shipping": "Free delivery in Lima",
    "footer.text": "Academic project · N-tier architecture with FastAPI",
    "footer.tech": "Secure checkout · Real-time stock · Delivery in Lima",

    "hero.tag": "Real-time stock",
    "hero.title": "Market-fresh groceries, at your door",
    "hero.subtitle": "Pick your products, reserve them instantly and confirm your order in seconds. What you see available is what is really in stock.",
    "hero.cta": "Shop now",
    "hero.products": "products",
    "hero.categories": "categories",
    "hero.online": "shopping now",

    "store.search": "Search products…",
    "store.catalog": "Our products",
    "store.all": "All",
    "store.sort": "Sort",
    "sort.relevance": "Featured",
    "sort.priceAsc": "Price: low to high",
    "sort.priceDesc": "Price: high to low",
    "sort.name": "Name A-Z",
    "store.empty": "No products match your search",
    "store.add": "Add",
    "store.inCart": "{n} in your cart",
    "store.available": "Available: {n}",
    "store.lastUnits": "Only {n} left!",
    "store.soldOut": "Sold out",

    "cat.abarrotes": "Pantry",
    "cat.lacteos": "Dairy & eggs",
    "cat.carnes": "Meat",
    "cat.frutas_verduras": "Fruits & vegetables",
    "cat.panaderia": "Bakery",
    "cat.bebidas": "Beverages",
    "cat.limpieza": "Household",

    "cart.title": "Cart",
    "cart.yourCart": "Your cart",
    "cart.empty": "Your cart is empty",
    "cart.emptyHint": "Add products from the catalog to get started.",
    "cart.subtotal": "Subtotal",
    "cart.tax": "VAT (18%)",
    "cart.bag": "Bag",
    "cart.total": "Total",
    "cart.checkout": "Checkout",
    "cart.continue": "Continue shopping",
    "cart.remove": "Remove",
    "cart.increase": "Add one",
    "cart.decrease": "Remove one",
    "cart.reservedNote": "Your items stay reserved while this page is open.",

    "checkout.title": "Delivery details",
    "checkout.subtitle": "Fill in your details to confirm the order.",
    "checkout.name": "Full name",
    "checkout.document": "ID number (DNI)",
    "checkout.email": "Email",
    "checkout.phone": "Mobile phone",
    "checkout.address": "Delivery address",
    "checkout.payment": "Payment method",
    "pay.efectivo": "Cash",
    "pay.tarjeta": "Card",
    "pay.yape": "Yape",
    "checkout.toPay": "Amount due",
    "checkout.confirm": "Place order",
    "checkout.processing": "Processing…",
    "receipt.title": "Order confirmed!",
    "receipt.subtitle": "Thanks for your purchase, {name}. We will send the details to {email}.",
    "receipt.code": "Order code",
    "receipt.date": "Date",
    "receipt.payment": "Payment",

    "validation.required": "This field is required.",
    "validation.nameFormat": "Use 2 to 60 characters: letters, numbers, spaces and . , ' % ( ) / + - (with at least one letter).",
    "validation.priceFormat": "Enter an amount greater than 0, up to 6 digits and 2 decimals (e.g. 12.50).",
    "validation.stockFormat": "Enter a whole number from 0 to 99999.",
    "validation.categoryFormat": "Choose a category.",
    "validation.customerName": "Enter your first and last name (letters only).",
    "validation.document": "The DNI has 8 digits.",
    "validation.email": "Enter a valid email (e.g. name@mail.com).",
    "validation.phone": "The mobile number has 9 digits and starts with 9.",
    "validation.address": "Enter an address of 5 to 100 characters.",
    "validation.payment": "Choose a payment method.",

    "admin.title": "Admin dashboard",
    "admin.subtitle": "Sales, orders and stock updated in real time.",
    "kpi.sales": "Total sales",
    "kpi.orders": "Orders",
    "kpi.units": "Units sold",
    "kpi.lowStock": "Low-stock products",
    "kpi.avgTicket": "Average ticket: {amount}",
    "kpi.inCarts": "{n} in carts right now",
    "kpi.soldOut": "{n} sold out",
    "kpi.lastOrder": "Latest: {code}",
    "admin.byCategory": "Sales by category",
    "admin.noSales": "No sales yet. Place an order from the store and watch it show up here.",
    "admin.recentOrders": "Recent orders",
    "admin.live": "Live",
    "admin.noOrders": "No orders yet.",
    "admin.products": "Products",
    "admin.searchProducts": "Search product…",

    "form.name": "Product name",
    "form.price": "Price ($)",
    "form.stock": "Stock",
    "form.category": "Category",
    "form.add": "Add",
    "form.update": "Update",
    "form.cancel": "Cancel",
    "table.id": "ID",
    "table.product": "Product",
    "table.price": "Price",
    "table.stock": "Stock",
    "table.reserved": "{n} in carts",
    "table.actions": "Actions",
    "action.edit": "Edit",
    "action.delete": "Delete",
    "error.generic": "An error occurred while processing the request.",
    "error.delete": "The product could not be deleted.",
    "error.offline": "No connection to the server. Wait a few seconds and try again.",

    "rt.user": "1 online",
    "rt.users": "{n} online",
    "rt.offline": "Reconnecting…",
    "unit.one": "1 unit",
    "unit.many": "{n} units",
    "toast.created": "New product: {name}",
    "toast.updated": "Product updated: {name}",
    "toast.deleted": "Product deleted: {name}",
    "toast.purchaseOthers": "Another customer just bought {units}",
    "toast.newOrder": "New order {code} · {total}",
    "toast.noStock": "No units of {name} left",
    "toast.removedFromCart": "{name} was removed from your cart because it was deleted",
    "toast.cartAdjusted": "Some units in your cart were no longer available",
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
  [/^El stock del producto debe ser un entero entre 0 y 99999\.$/, () => "The product stock must be a whole number between 0 and 99999."],
  [/^La categoría del producto no es válida\.$/, () => "The product category is not valid."],
  [/^Ingresa tu nombre y apellido/, () => "Enter your first and last name (letters only, 3 to 60 characters)."],
  [/^El DNI debe tener exactamente 8 dígitos\.$/, () => "The DNI must have exactly 8 digits."],
  [/^El correo electrónico no es válido\.$/, () => "The email address is not valid."],
  [/^El celular debe tener 9 dígitos y empezar en 9\.$/, () => "The mobile number must have 9 digits and start with 9."],
  [/^La dirección debe tener de 5 a 100 caracteres/, () => "The address must be 5 to 100 characters long (letters, numbers and . , # ° / -)."],
  [/^El método de pago no es válido\.$/, () => "The payment method is not valid."],
  [/^Tu carrito está vacío/, () => "Your cart is empty or its products are no longer available."],
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

// Traducción con variables: tf("rt.users", { n: 3 }) -> "3 usuarios conectados".
function tf(key, vars = {}) {
  return t(key).replace(/\{(\w+)\}/g, (texto, nombre) => (nombre in vars ? vars[nombre] : texto));
}

function unitsLabel(n) {
  return n === 1 ? t("unit.one") : tf("unit.many", { n });
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

// Fecha y hora de un pedido: "12/10/2026, 07:45 p. m." o "10/12/2026, 7:45 PM".
function formatDateTime(isoString) {
  return new Intl.DateTimeFormat(LOCALES[currentLocale].intl, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoString));
}

// Rótulo del tipo de cambio en la barra superior: "1 USD = S/ 3.40".
function renderTipoCambio() {
  const el = document.getElementById("fx-rate");
  if (!el) return;
  const soles = new Intl.NumberFormat(LOCALES[currentLocale].intl, { style: "currency", currency: "PEN" });
  el.textContent = `1 USD = ${soles.format(PEN_POR_USD)}`;
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

  renderTipoCambio();
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

document.addEventListener("exchangerateupdate", renderTipoCambio);

applyTranslations();
actualizarTipoCambio();
