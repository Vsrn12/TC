const API_URL = "/api/productos";

const IGV_RATE = 0.18;
const COSTO_BOLSA = 0.5;

// Catálogo cargado desde la API (JSON persistido en disco), ya no hardcodeado.
let productosCatalogo = [];

// Estado compartido del carrito: arreglo de { id, nombre, precio, cantidad }
let carrito = [];

const catalogoGrid = document.getElementById("catalogo-grid");
const carritoTableBody = document.getElementById("carrito-table-body");
const carritoSubtotalEl = document.getElementById("carrito-subtotal");
const carritoIgvEl = document.getElementById("carrito-igv");
const carritoBolsaEl = document.getElementById("carrito-bolsa");
const carritoTotalEl = document.getElementById("carrito-total");

async function fetchCatalogo() {
  const response = await fetch(API_URL);
  productosCatalogo = await response.json();
  renderCatalogo();
}

// Stateless: solo depende de sus parámetros, no lee ni modifica el carrito global.
function calcularSubtotal(items) {
  return items.reduce((acumulado, item) => acumulado + item.precio * item.cantidad, 0);
}

// Stateless: calcula IGV y total a partir de los parámetros recibidos, sin efectos secundarios.
function calcularTotalCarrito(items, tasaIgv = IGV_RATE, costoBolsa = COSTO_BOLSA) {
  const subtotal = calcularSubtotal(items);
  const igv = subtotal * tasaIgv;
  const bolsa = items.length > 0 ? costoBolsa : 0;
  const total = subtotal + igv + bolsa;
  return { subtotal, igv, bolsa, total };
}

// Stateful: lee y modifica el arreglo global `carrito`.
function agregarAlCarrito(producto) {
  const existente = carrito.find((item) => item.id === producto.id);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  renderCarrito();
}

// Stateful: lee y modifica el arreglo global `carrito`.
function quitarDelCarrito(productoId) {
  const existente = carrito.find((item) => item.id === productoId);
  if (!existente) return;
  if (existente.cantidad > 1) {
    existente.cantidad -= 1;
  } else {
    carrito = carrito.filter((item) => item.id !== productoId);
  }
  renderCarrito();
}

function renderCatalogo() {
  catalogoGrid.innerHTML = "";
  for (const producto of productosCatalogo) {
    const card = document.createElement("div");
    card.className = "catalogo-item";
    card.innerHTML = `
      <p>${productName(producto)}</p>
      <p class="precio">${formatMoney(producto.precio)}</p>
      <button class="btn-agregar" data-id="${producto.id}">${t("cart.add")}</button>
    `;
    catalogoGrid.appendChild(card);
  }
}

function renderCarrito() {
  // Los precios se guardan en soles: se convierten a la moneda activa antes de calcular,
  // así subtotal, IGV, bolsa y total cuadran entre sí en soles y en dólares.
  const items = carrito.map((item) => ({ ...item, precio: toDisplayAmount(item.precio) }));

  carritoTableBody.innerHTML = "";
  for (const item of items) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${productName(item)}</td>
      <td>${formatCurrency(item.precio)}</td>
      <td>${item.cantidad}</td>
      <td>${formatCurrency(item.precio * item.cantidad)}</td>
      <td><button class="btn-quitar" data-id="${item.id}">${t("cart.remove")}</button></td>
    `;
    carritoTableBody.appendChild(row);
  }

  const { subtotal, igv, bolsa, total } = calcularTotalCarrito(items, IGV_RATE, toDisplayAmount(COSTO_BOLSA));
  carritoSubtotalEl.textContent = formatCurrency(subtotal);
  carritoIgvEl.textContent = formatCurrency(igv);
  carritoBolsaEl.textContent = formatCurrency(bolsa);
  carritoTotalEl.textContent = formatCurrency(total);
}

document.addEventListener("localechange", () => {
  renderCatalogo();
  renderCarrito();
});

document.addEventListener("exchangerateupdate", () => {
  renderCatalogo();
  renderCarrito();
});

catalogoGrid.addEventListener("click", (event) => {
  const productId = Number(event.target.dataset.id);
  if (!productId) return;
  const producto = productosCatalogo.find((item) => item.id === productId);
  if (producto) agregarAlCarrito(producto);
});

carritoTableBody.addEventListener("click", (event) => {
  const productId = Number(event.target.dataset.id);
  if (!productId) return;
  quitarDelCarrito(productId);
});

fetchCatalogo();
renderCarrito();
