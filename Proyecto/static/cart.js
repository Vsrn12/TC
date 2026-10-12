// Carrito de compras: estado, cálculos y sincronización de reservas con el servidor (WebSocket).

const IGV_RATE = 0.18;
const COSTO_BOLSA = 0.5;

// Catálogo cargado desde la API (lo llena store.js con fetchCatalogo).
let productosCatalogo = [];

// Estado compartido del carrito: arreglo de { id, nombre, precio, categoria, cantidad }
let carrito = [];

// Stock en vivo recibido por WebSocket: { [id]: { stock, reservado, disponible } }.
// "disponible" ya descuenta lo que todos los clientes (incluido este) tienen en su carrito.
let stockEnVivo = {};

const carritoItemsEl = document.getElementById("carrito-items");
const carritoSubtotalEl = document.getElementById("carrito-subtotal");
const carritoIgvEl = document.getElementById("carrito-igv");
const carritoBolsaEl = document.getElementById("carrito-bolsa");
const carritoTotalEl = document.getElementById("carrito-total");
const drawerCountEl = document.getElementById("drawer-count");
const btnCheckout = document.getElementById("btn-checkout");

// ---- Funciones stateless: solo dependen de sus parámetros, no leen ni modifican `carrito` ----

function calcularSubtotal(items) {
  return items.reduce((acumulado, item) => acumulado + item.precio * item.cantidad, 0);
}

function calcularTotalCarrito(items, tasaIgv = IGV_RATE, costoBolsa = COSTO_BOLSA) {
  const subtotal = calcularSubtotal(items);
  // Redondeado a céntimos, igual que en el servidor (order_service.py), para que los totales cuadren.
  const igv = Math.round(subtotal * tasaIgv * 100) / 100;
  const bolsa = items.length > 0 ? costoBolsa : 0;
  const total = subtotal + igv + bolsa;
  return { subtotal, igv, bolsa, total };
}

function contarUnidades(items) {
  return items.reduce((acumulado, item) => acumulado + item.cantidad, 0);
}

function cantidadEnCarrito(items, productoId) {
  return items.find((item) => item.id === productoId)?.cantidad ?? 0;
}

// ---- Funciones stateful: leen y modifican el arreglo global `carrito` ----

function agregarAlCarrito(producto) {
  const existente = carrito.find((item) => item.id === producto.id);
  if (existente) {
    existente.cantidad += 1;
  } else {
    carrito.push({ ...producto, cantidad: 1 });
  }
  notificarCambio();
}

function quitarDelCarrito(productoId) {
  const existente = carrito.find((item) => item.id === productoId);
  if (!existente) return;
  if (existente.cantidad > 1) {
    existente.cantidad -= 1;
  } else {
    carrito = carrito.filter((item) => item.id !== productoId);
  }
  notificarCambio();
}

// Quita el producto completo y retorna cuántas unidades tenía.
function eliminarDelCarrito(productoId) {
  const cantidad = cantidadEnCarrito(carrito, productoId);
  carrito = carrito.filter((item) => item.id !== productoId);
  notificarCambio();
  return cantidad;
}

function vaciarCarrito() {
  carrito = [];
  notificarCambio();
}

// Ajusta las cantidades a las que el servidor logró reservar (al reconectarse, alguien pudo
// haberse llevado unidades mientras tanto). Retorna true si se recortó algo.
function ajustarCarrito(reservas) {
  let recortado = false;
  carrito = carrito
    .map((item) => {
      const concedidas = reservas[item.id] || 0;
      if (concedidas < item.cantidad) recortado = true;
      return { ...item, cantidad: concedidas };
    })
    .filter((item) => item.cantidad > 0);
  notificarCambio();
  return recortado;
}

function notificarCambio() {
  renderCarrito();
  document.dispatchEvent(new CustomEvent("cartchange"));
}

// ---- Acciones que pasan por el servidor ----
// Agregar no toca el carrito: pide una reserva y el producto entra recién con la confirmación
// ("rt:reserva"), así dos clientes nunca se llevan la misma última unidad.

function solicitarAgregar(productoId) {
  return Realtime.enviar({ accion: "reservar", producto_id: productoId });
}

function solicitarQuitar(productoId) {
  quitarDelCarrito(productoId);
  Realtime.enviar({ accion: "liberar", producto_id: productoId });
}

function solicitarEliminar(productoId) {
  const cantidad = eliminarDelCarrito(productoId);
  if (cantidad > 0) Realtime.enviar({ accion: "liberar", producto_id: productoId, cantidad });
}

// Unidades que aún se pueden agregar: lo disponible para todos (ya descontadas las reservas).
function disponible(producto) {
  const info = stockEnVivo[producto.id];
  return info ? info.disponible : producto.stock;
}

// ---- Panel lateral del carrito ----

function renderCarrito() {
  // Los precios se guardan en soles: se convierten a la moneda activa antes de calcular,
  // así subtotal, IGV, bolsa y total cuadran entre sí en soles y en dólares.
  const items = carrito.map((item) => ({ ...item, precio: toDisplayAmount(item.precio) }));

  if (items.length === 0) {
    carritoItemsEl.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">${icon("shopping-basket")}</span>
        <p><strong>${t("cart.empty")}</strong></p>
        <p class="muted">${t("cart.emptyHint")}</p>
      </div>`;
  } else {
    carritoItemsEl.innerHTML = items
      .map((item) => {
        const producto = productosCatalogo.find((p) => p.id === item.id) || item;
        const sinMas = disponible(producto) <= 0;
        return `
        <div class="cart-item" data-item="${item.id}">
          <span class="cart-item-icon" style="--accent: ${categoriaInfo(item.categoria).color}">${productIcon(item)}</span>
          <div class="cart-item-info">
            <strong>${productName(item)}</strong>
            <span class="muted">${formatCurrency(item.precio)}</span>
            <div class="qty">
              <button type="button" class="qty-btn" data-action="menos" data-id="${item.id}" aria-label="${t("cart.decrease")}">${icon("minus")}</button>
              <span>${item.cantidad}</span>
              <button type="button" class="qty-btn" data-action="mas" data-id="${item.id}" aria-label="${t("cart.increase")}" ${sinMas ? "disabled" : ""}>${icon("plus")}</button>
            </div>
          </div>
          <div class="cart-item-side">
            <strong>${formatCurrency(item.precio * item.cantidad)}</strong>
            <button type="button" class="link-btn" data-action="eliminar" data-id="${item.id}">${t("cart.remove")}</button>
          </div>
        </div>`;
      })
      .join("");
  }

  const { subtotal, igv, bolsa, total } = calcularTotalCarrito(items, IGV_RATE, toDisplayAmount(COSTO_BOLSA));
  carritoSubtotalEl.textContent = formatCurrency(subtotal);
  carritoIgvEl.textContent = formatCurrency(igv);
  carritoBolsaEl.textContent = formatCurrency(bolsa);
  carritoTotalEl.textContent = formatCurrency(total);
  drawerCountEl.textContent = contarUnidades(items);
  btnCheckout.disabled = items.length === 0 || !Realtime.estaConectado();
}

carritoItemsEl.addEventListener("click", (event) => {
  const boton = event.target.closest("[data-action]");
  if (!boton) return;
  const productId = Number(boton.dataset.id);
  if (boton.dataset.action === "mas") solicitarAgregar(productId);
  if (boton.dataset.action === "menos") solicitarQuitar(productId);
  if (boton.dataset.action === "eliminar") solicitarEliminar(productId);
});

document.addEventListener("localechange", renderCarrito);
document.addEventListener("exchangerateupdate", renderCarrito);

// ---- Tiempo real (WebSocket) ----

document.addEventListener("rt:estado", (event) => {
  // Al (re)conectarse, el servidor no conoce este carrito: se le pide reservar lo que hay en pantalla.
  if (event.detail.conectado && carrito.length > 0) {
    Realtime.enviar({
      accion: "sincronizar",
      items: carrito.map((item) => ({ producto_id: item.id, cantidad: item.cantidad })),
    });
  }
  renderCarrito();
});

document.addEventListener("rt:stock", (event) => {
  stockEnVivo = event.detail.productos;
  renderCarrito();
});

document.addEventListener("rt:reserva", (event) => {
  const { producto_id: productId, ok } = event.detail;
  const producto = productosCatalogo.find((item) => item.id === productId);
  if (!producto) return;
  if (ok) {
    agregarAlCarrito(producto);
    document.dispatchEvent(new CustomEvent("cartadded", { detail: { producto } }));
  } else {
    showToast(tf("toast.noStock", { name: productName(producto) }), "warning");
  }
});

document.addEventListener("rt:sincronizado", (event) => {
  if (ajustarCarrito(event.detail.reservas)) showToast(t("toast.cartAdjusted"), "warning");
});

// Otro usuario editó o eliminó un producto: se actualiza también el carrito.
document.addEventListener("rt:producto", (event) => {
  const { evento, producto } = event.detail;
  const enCarrito = carrito.find((item) => item.id === producto.id);
  if (!enCarrito) return;
  if (evento === "actualizado") {
    Object.assign(enCarrito, { nombre: producto.nombre, precio: producto.precio, categoria: producto.categoria });
    notificarCambio();
  }
  if (evento === "eliminado") {
    carrito = carrito.filter((item) => item.id !== producto.id);
    notificarCambio();
    showToast(tf("toast.removedFromCart", { name: productName(producto) }), "warning");
  }
});

renderCarrito();
