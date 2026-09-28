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

// Valida todo el formulario. Retorna { nombre?, precio? } con la clave de error de cada
// campo inválido (los campos válidos no aparecen).
function validateProductFields({ nombre, precio }) {
  const errores = {
    nombre: validateName(nombre),
    precio: validatePrice(precio),
  };
  return Object.fromEntries(Object.entries(errores).filter(([, clave]) => clave !== null));
}
