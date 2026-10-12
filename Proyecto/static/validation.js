// Validación del formulario de productos con expresiones regulares (regex).
// Son funciones puras: solo dependen de sus parámetros. Los mensajes son claves de i18n.js,
// así que se muestran en el idioma activo.

// Nombre: de 2 a 60 caracteres.
//   ^                      inicio del texto
//   (?=.*\p{L})            lookahead: debe haber al menos una letra (evita nombres como "1234")
//   [\p{L}\p{N}]           el primer carácter es una letra o un número (con tildes y ñ)
//   [\p{L}\p{N} .,'%()/+-]{1,59}   el resto: letras, números, espacios y . , ' % ( ) / + -
//   $                      fin del texto
const NOMBRE_REGEX = /^(?=.*\p{L})[\p{L}\p{N}][\p{L}\p{N} .,'%()/+-]{1,59}$/u;

// Precio: monto mayor a 0, hasta 6 dígitos enteros y 2 decimales, con punto o coma decimal.
//   (?!0+(?:[.,]0+)?$)     lookahead negativo: rechaza 0, 0.0, 0.00 ...
//   (?:0|[1-9]\d{0,5})     parte entera sin ceros a la izquierda (0 o 1 a 6 dígitos)
//   (?:[.,]\d{1,2})?       decimales opcionales: 1 o 2 dígitos
const PRECIO_REGEX = /^(?!0+(?:[.,]0+)?$)(?:0|[1-9]\d{0,5})(?:[.,]\d{1,2})?$/;

// Stock: entero de 0 a 99999, sin ceros a la izquierda, sin signos ni decimales.
//   (?:0|[1-9]\d{0,4})     0, o de 1 a 5 dígitos que no empiezan en 0
const STOCK_REGEX = /^(?:0|[1-9]\d{0,4})$/;

// Convierte el texto del precio ("12.50" o "12,50") a número. Devuelve NaN si no es un número.
function parsePrice(texto) {
  return parseFloat(String(texto).trim().replace(",", "."));
}

// Retorna la clave del mensaje de error, o null si es válido.
function validateName(nombre) {
  if (nombre === "") return "validation.required";
  return NOMBRE_REGEX.test(nombre) ? null : "validation.nameFormat";
}

function validatePrice(precio) {
  if (precio === "") return "validation.required";
  return PRECIO_REGEX.test(precio) ? null : "validation.priceFormat";
}

function validateStock(stock) {
  if (stock === "") return "validation.required";
  return STOCK_REGEX.test(stock) ? null : "validation.stockFormat";
}

// Categoría: una de las claves de CATEGORIAS (catalog.js), igual que en el backend.
function validateCategory(categoria) {
  if (categoria === "") return "validation.required";
  return /^[a-z_]+$/.test(categoria) && CATEGORIAS.some((c) => c.clave === categoria)
    ? null
    : "validation.categoryFormat";
}

function soloErrores(errores) {
  return Object.fromEntries(Object.entries(errores).filter(([, clave]) => clave !== null));
}

// Valida todo el formulario. Retorna { nombre?, precio?, stock?, categoria? } con la clave de
// error de cada campo inválido (los campos válidos no aparecen).
function validateProductFields({ nombre, precio, stock, categoria }) {
  return soloErrores({
    nombre: validateName(nombre),
    precio: validatePrice(precio),
    stock: validateStock(stock),
    categoria: validateCategory(categoria),
  });
}

// ---- Checkout: datos del cliente (mismas reglas que app/services/order_service.py) ----

const CLIENTE_REGEX = {
  // Nombre y apellido: al menos dos palabras de letras separadas por espacio, ' o -; 3 a 60 caracteres.
  //   (?=.{3,60}$)           lookahead: largo total de 3 a 60
  //   \p{L}+(?:[ '-]\p{L}+)+ una palabra y al menos otra más
  nombre: [/^(?=.{3,60}$)\p{L}+(?:[ '-]\p{L}+)+$/u, "validation.customerName"],
  // DNI: exactamente 8 dígitos.
  documento: [/^\d{8}$/, "validation.document"],
  // Correo: usuario@dominio.ext (extensión de al menos 2 letras).
  email: [/^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/, "validation.email"],
  // Celular peruano: 9 dígitos y empieza en 9.
  telefono: [/^9\d{8}$/, "validation.phone"],
  // Dirección: 5 a 100 caracteres (letras, números, espacios y . , # ° º / -), con al menos una letra.
  direccion: [/^(?=.*\p{L})[\p{L}\p{N} .,#°º/-]{5,100}$/u, "validation.address"],
};

const METODOS_PAGO = ["efectivo", "tarjeta", "yape"];

function validateCustomerFields(datos) {
  const errores = {};
  for (const [campo, [regex, clave]] of Object.entries(CLIENTE_REGEX)) {
    const valor = (datos[campo] || "").trim();
    errores[campo] = valor === "" ? "validation.required" : regex.test(valor) ? null : clave;
  }
  errores.metodo_pago = METODOS_PAGO.includes(datos.metodo_pago) ? null : "validation.payment";
  return soloErrores(errores);
}
