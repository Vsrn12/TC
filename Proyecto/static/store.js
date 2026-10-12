// Tienda: catálogo con búsqueda, categorías y orden; panel del carrito; checkout y comprobante.

const API_PRODUCTOS = "/api/productos";
const API_PEDIDOS = "/api/pedidos";

const grid = document.getElementById("catalogo-grid");
const chipsEl = document.getElementById("category-chips");
const searchInput = document.getElementById("search-input");
const sortSelect = document.getElementById("sort-select");
const emptyState = document.getElementById("empty-state");
const cartButton = document.getElementById("cart-button");
const cartCount = document.getElementById("cart-count");
const drawer = document.getElementById("cart-drawer");
const overlay = document.getElementById("overlay");

const filtro = { texto: "", categoria: "todas", orden: "relevancia" };

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

async function fetchCatalogo() {
  const response = await fetch(API_PRODUCTOS);
  productosCatalogo = await response.json();
  renderChips();
  renderCatalogo({ animar: true });
  renderHeroStats();
}

// ---- Catálogo ----

function renderChips() {
  const opciones = [{ clave: "todas", icono: "store" }, ...CATEGORIAS];
  chipsEl.innerHTML = opciones
    .map(({ clave, icono }) => {
      const cantidad = clave === "todas"
        ? productosCatalogo.length
        : productosCatalogo.filter((p) => p.categoria === clave).length;
      if (cantidad === 0) return "";
      const nombre = clave === "todas" ? t("store.all") : categoryName(clave);
      const activo = filtro.categoria === clave;
      return `<button type="button" class="chip ${activo ? "active" : ""}" data-cat="${clave}" role="tab" aria-selected="${activo}">
        ${icon(icono)} ${nombre} <span class="chip-count">${cantidad}</span></button>`;
    })
    .join("");
}

function tarjetaProducto(producto, indice, animar) {
  const unidades = disponible(producto);
  const info = stockEnVivo[producto.id];
  const stockTotal = info ? info.stock : producto.stock;
  const enCarrito = cantidadEnCarrito(carrito, producto.id);
  const agotado = unidades <= 0;
  const porcentaje = stockTotal > 0 ? Math.round((unidades / stockTotal) * 100) : 0;
  const online = Realtime.estaConectado();
  const categoria = categoriaInfo(producto.categoria);

  let badge = "";
  if (agotado) badge = `<span class="badge badge-out">${t("store.soldOut")}</span>`;
  else if (unidades <= STOCK_BAJO) badge = `<span class="badge badge-low">${tf("store.lastUnits", { n: unidades })}</span>`;

  return `
    <article class="product-card ${agotado ? "agotado" : ""} ${animar ? "enter" : ""}"
             data-card="${producto.id}" style="--delay: ${Math.min(indice, 16) * 45}ms; --accent: ${categoria.color}">
      <div class="product-media">
        <span class="product-icon">${productIcon(producto)}</span>
        ${badge}
        ${enCarrito > 0 ? `<span class="in-cart">${icon("shopping-cart")} ${enCarrito}</span>` : ""}
      </div>
      <div class="product-info">
        <span class="product-cat">${categoryName(producto.categoria)}</span>
        <h3>${productName(producto)}</h3>
        <div class="stock-meter" aria-hidden="true"><span style="width: ${porcentaje}%" class="${unidades <= STOCK_BAJO ? "low" : ""}"></span></div>
        <small class="muted">${agotado ? t("store.soldOut") : tf("store.available", { n: unidades })}</small>
        <div class="product-foot">
          <span class="price">${formatMoney(producto.precio)}</span>
          <button type="button" class="btn-add" data-id="${producto.id}" ${agotado || !online ? "disabled" : ""}>
            ${icon("plus")} ${t("store.add")}
          </button>
        </div>
      </div>
    </article>`;
}

// animar = true solo al cargar o al cambiar filtros; los cambios de stock repintan sin animación.
function renderCatalogo({ animar = false } = {}) {
  const visibles = ordenarProductos(
    filtrarProductos(productosCatalogo, filtro, productName),
    filtro.orden,
    productName
  );
  grid.innerHTML = visibles.map((producto, i) => tarjetaProducto(producto, i, animar && !reduceMotion)).join("");
  emptyState.classList.toggle("hidden", visibles.length > 0 || productosCatalogo.length === 0);
}

function renderHeroStats() {
  document.getElementById("hero-products").textContent = productosCatalogo.length;
  document.getElementById("hero-categories").textContent =
    new Set(productosCatalogo.map((p) => p.categoria)).size;
  document.getElementById("hero-online").textContent = Realtime.conectados() ?? 1;
}

chipsEl.addEventListener("click", (event) => {
  const chip = event.target.closest("[data-cat]");
  if (!chip) return;
  filtro.categoria = chip.dataset.cat;
  renderChips();
  renderCatalogo({ animar: true });
});

searchInput.addEventListener("input", () => {
  filtro.texto = searchInput.value;
  renderCatalogo({ animar: true });
  // Si el catálogo está fuera de la vista (por ejemplo, viendo el banner), se baja hasta él.
  if (filtro.texto && grid.getBoundingClientRect().top > window.innerHeight * 0.6) {
    document.getElementById("catalogo").scrollIntoView({ behavior: "smooth", block: "start" });
  }
});

sortSelect.addEventListener("change", () => {
  filtro.orden = sortSelect.value;
  renderCatalogo({ animar: true });
});

grid.addEventListener("click", (event) => {
  const boton = event.target.closest(".btn-add");
  if (!boton) return;
  boton.classList.add("pressed");
  solicitarAgregar(Number(boton.dataset.id));
});

// ---- Animación: el ícono del producto "vuela" hasta el botón del carrito ----

function volarAlCarrito(producto) {
  const origen = grid.querySelector(`[data-card="${producto.id}"] .product-icon`);
  if (!origen || reduceMotion) return rebotarContador();
  const desde = origen.getBoundingClientRect();
  const hasta = cartButton.getBoundingClientRect();
  const clon = document.createElement("span");
  clon.className = "fly-icon";
  clon.style.setProperty("--accent", categoriaInfo(producto.categoria).color);
  clon.innerHTML = productIcon(producto);
  clon.style.left = `${desde.left + desde.width / 2}px`;
  clon.style.top = `${desde.top + desde.height / 2}px`;
  document.body.appendChild(clon);

  const dx = hasta.left + hasta.width / 2 - (desde.left + desde.width / 2);
  const dy = hasta.top + hasta.height / 2 - (desde.top + desde.height / 2);
  clon
    .animate(
      [
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx * 0.5}px), calc(-50% + ${dy - 120}px)) scale(1.3)`, opacity: 1, offset: 0.45 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0.3)`, opacity: 0.4 },
      ],
      { duration: 750, easing: "cubic-bezier(.5,-0.2,.6,1)" }
    )
    .finished.then(() => {
      clon.remove();
      rebotarContador();
    });
}

function rebotarContador() {
  cartButton.classList.remove("bump");
  void cartButton.offsetWidth; // reinicia la animación CSS
  cartButton.classList.add("bump");
}

document.addEventListener("cartadded", (event) => volarAlCarrito(event.detail.producto));

document.addEventListener("cartchange", () => {
  cartCount.textContent = contarUnidades(carrito);
  cartCount.classList.toggle("visible", carrito.length > 0);
  renderCatalogo();
});

// ---- Panel lateral ----

function abrirCarrito() {
  drawer.classList.add("open");
  overlay.classList.add("visible");
  drawer.setAttribute("aria-hidden", "false");
}

function cerrarCarrito() {
  drawer.classList.remove("open");
  overlay.classList.remove("visible");
  drawer.setAttribute("aria-hidden", "true");
}

cartButton.addEventListener("click", abrirCarrito);
document.getElementById("close-cart").addEventListener("click", cerrarCarrito);
overlay.addEventListener("click", () => {
  cerrarCarrito();
  cerrarCheckout();
});

// ---- Checkout ----

const modal = document.getElementById("checkout-modal");
const checkoutStep = document.getElementById("checkout-step");
const receiptStep = document.getElementById("receipt-step");
const checkoutForm = document.getElementById("checkout-form");
const checkoutError = document.getElementById("checkout-error");
const btnPay = document.getElementById("btn-pay");

const CAMPOS_CLIENTE = ["nombre", "documento", "telefono", "email", "direccion"];

function leerCliente() {
  const datos = Object.fromEntries(
    CAMPOS_CLIENTE.map((campo) => [campo, document.getElementById(`c-${campo}`).value.trim()])
  );
  datos.metodo_pago = checkoutForm.querySelector("input[name=metodo_pago]:checked")?.value || "";
  return datos;
}

function mostrarErroresCliente(errores, campos = [...CAMPOS_CLIENTE, "metodo_pago"]) {
  for (const campo of campos) {
    const clave = errores[campo];
    document.getElementById(`c-${campo}-error`).textContent = clave ? t(clave) : "";
    const input = document.getElementById(`c-${campo}`);
    if (input) {
      input.classList.toggle("invalid", Boolean(clave));
      input.setAttribute("aria-invalid", String(Boolean(clave)));
    }
  }
}

function camposClienteConError() {
  return [...CAMPOS_CLIENTE, "metodo_pago"].filter(
    (campo) => document.getElementById(`c-${campo}-error`).textContent !== ""
  );
}

function abrirCheckout() {
  cerrarCarrito();
  checkoutStep.classList.remove("hidden");
  receiptStep.classList.add("hidden");
  checkoutError.classList.add("hidden");
  document.getElementById("checkout-total").textContent = carritoTotalEl.textContent;
  modal.classList.remove("hidden");
  overlay.classList.add("visible");
  document.getElementById("c-nombre").focus();
}

function cerrarCheckout() {
  modal.classList.add("hidden");
  overlay.classList.remove("visible");
}

btnCheckout.addEventListener("click", abrirCheckout);
document.getElementById("close-checkout").addEventListener("click", cerrarCheckout);
document.getElementById("btn-continue").addEventListener("click", cerrarCheckout);
document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  cerrarCarrito();
  cerrarCheckout();
});

for (const campo of CAMPOS_CLIENTE) {
  const input = document.getElementById(`c-${campo}`);
  input.addEventListener("blur", () => {
    if (input.value.trim()) mostrarErroresCliente(validateCustomerFields(leerCliente()), [campo]);
  });
  input.addEventListener("input", () => {
    if (input.classList.contains("invalid")) mostrarErroresCliente(validateCustomerFields(leerCliente()), [campo]);
  });
}

checkoutForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  checkoutError.classList.add("hidden");

  const cliente = leerCliente();
  const errores = validateCustomerFields(cliente);
  mostrarErroresCliente(errores);
  const primero = Object.keys(errores)[0];
  if (primero) {
    document.getElementById(`c-${primero}`)?.focus();
    return;
  }

  const sesion = Realtime.sesion();
  if (!sesion) {
    mostrarErrorCheckout(t("error.offline"));
    return;
  }

  btnPay.disabled = true;
  btnPay.classList.add("loading");
  btnPay.textContent = t("checkout.processing");
  try {
    const response = await fetch(API_PEDIDOS, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cliente, sesion }),
    });
    const data = await response.json();
    if (!response.ok) {
      mostrarErrorCheckout(translateBackendError(data.detail));
      return;
    }
    vaciarCarrito();
    mostrarComprobante(data);
  } catch (_) {
    mostrarErrorCheckout(t("error.offline"));
  } finally {
    btnPay.disabled = false;
    btnPay.classList.remove("loading");
    btnPay.textContent = t("checkout.confirm");
  }
});

function mostrarErrorCheckout(mensaje) {
  checkoutError.textContent = mensaje;
  checkoutError.classList.remove("hidden");
}

// ---- Comprobante (los montos vienen calculados por el servidor, en soles) ----

let ultimoPedido = null;

function mostrarComprobante(pedido) {
  ultimoPedido = pedido;
  renderComprobante();
  checkoutStep.classList.add("hidden");
  receiptStep.classList.remove("hidden");
  lanzarConfeti();
}

function renderComprobante() {
  const pedido = ultimoPedido;
  if (!pedido) return;
  const primerNombre = pedido.cliente.nombre.split(" ")[0];
  document.getElementById("receipt-subtitle").textContent =
    tf("receipt.subtitle", { name: primerNombre, email: pedido.cliente.email });
  document.getElementById("receipt-code").textContent = pedido.codigo;
  document.getElementById("receipt-date").textContent = formatDateTime(pedido.fecha);
  document.getElementById("receipt-payment").textContent = t(`pay.${pedido.cliente.metodo_pago}`);
  document.getElementById("receipt-items").innerHTML = pedido.items
    .map(
      (item) => `<li><span class="receipt-item" style="--accent: ${categoriaInfo(item.categoria).color}">${productIcon(item)} ${item.cantidad} × ${productName(item)}</span>
        <strong>${formatCurrency(toDisplayAmount(item.precio) * item.cantidad)}</strong></li>`
    )
    .join("");
  // En soles se muestran los montos oficiales del servidor. En dólares se recalculan con los
  // precios ya convertidos (igual que el carrito), para que subtotal + IGV + bolsa sumen el total.
  const enSoles = getLocale() === "pe";
  const totales = enSoles
    ? pedido
    : calcularTotalCarrito(
        pedido.items.map((item) => ({ precio: toDisplayAmount(item.precio), cantidad: item.cantidad })),
        IGV_RATE,
        toDisplayAmount(pedido.bolsa)
      );
  const mostrar = (monto) => (enSoles ? formatMoney(monto) : formatCurrency(monto));
  document.getElementById("receipt-subtotal").textContent = mostrar(totales.subtotal);
  document.getElementById("receipt-igv").textContent = mostrar(totales.igv);
  document.getElementById("receipt-bolsa").textContent = mostrar(totales.bolsa);
  document.getElementById("receipt-total").textContent = mostrar(totales.total);
}

function lanzarConfeti() {
  if (reduceMotion) return;
  const colores = ["#16a34a", "#f59e0b", "#ef4444", "#3b82f6", "#a855f7", "#facc15"];
  const capa = document.createElement("div");
  capa.className = "confetti";
  for (let i = 0; i < 90; i++) {
    const pieza = document.createElement("span");
    pieza.style.left = `${Math.random() * 100}%`;
    pieza.style.background = colores[i % colores.length];
    pieza.style.animationDelay = `${Math.random() * 0.4}s`;
    pieza.style.animationDuration = `${2 + Math.random() * 1.5}s`;
    pieza.style.setProperty("--giro", `${Math.random() * 720 - 360}deg`);
    pieza.style.setProperty("--deriva", `${Math.random() * 200 - 100}px`);
    capa.appendChild(pieza);
  }
  document.body.appendChild(capa);
  setTimeout(() => capa.remove(), 4200);
}

// ---- Idioma, tipo de cambio y tiempo real ----

function repintarTodo() {
  renderChips();
  renderCatalogo();
  renderComprobante();
  if (!modal.classList.contains("hidden")) {
    document.getElementById("checkout-total").textContent = carritoTotalEl.textContent;
  }
}

document.addEventListener("localechange", () => {
  const conError = camposClienteConError();
  repintarTodo();
  mostrarErroresCliente(validateCustomerFields(leerCliente()), conError);
});
document.addEventListener("exchangerateupdate", repintarTodo);

document.addEventListener("rt:estado", () => renderCatalogo());
document.addEventListener("rt:stock", () => renderCatalogo());
document.addEventListener("rt:usuarios", renderHeroStats);
document.addEventListener("rt:producto", fetchCatalogo);
document.addEventListener("rt:pedido", (event) => {
  showToast(tf("toast.purchaseOthers", { units: unitsLabel(event.detail.pedido.unidades) }), "info");
});

fetchCatalogo();
