// Dashboard del panel: KPIs, ventas por categoría y pedidos recientes, en vivo vía WebSocket.
// El stock en vivo (stockEnVivo) lo mantiene admin-products.js.

const API_PEDIDOS = "/api/pedidos";
const MAX_PEDIDOS_FEED = 8;

let pedidos = [];
let pedidosNuevos = new Set();
const valoresKpi = {};

const reduceMotionAdmin = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---- Funciones stateless (puras) ----

function calcularEstadisticas(listaPedidos) {
  const ventas = listaPedidos.reduce((acumulado, pedido) => acumulado + pedido.total, 0);
  const unidades = listaPedidos.reduce((acumulado, pedido) => acumulado + pedido.unidades, 0);
  return {
    ventas,
    pedidos: listaPedidos.length,
    unidades,
    ticketPromedio: listaPedidos.length ? ventas / listaPedidos.length : 0,
  };
}

// { categoria: monto en soles }, ordenado de mayor a menor.
function ventasPorCategoria(listaPedidos) {
  const totales = {};
  for (const pedido of listaPedidos) {
    for (const item of pedido.items) {
      totales[item.categoria] = (totales[item.categoria] || 0) + item.subtotal;
    }
  }
  return Object.entries(totales).sort(([, a], [, b]) => b - a);
}

function resumenStock(stock) {
  const productos = Object.values(stock);
  return {
    bajos: productos.filter((p) => p.stock <= STOCK_BAJO).length,
    agotados: productos.filter((p) => p.stock === 0).length,
    enCarritos: productos.reduce((acumulado, p) => acumulado + p.reservado, 0),
  };
}

// ---- Animación de conteo ("count-up") ----

function animarNumero(id, hasta, formatear) {
  const el = document.getElementById(id);
  const desde = valoresKpi[id] ?? 0;
  valoresKpi[id] = hasta;
  if (reduceMotionAdmin || desde === hasta) {
    el.textContent = formatear(hasta);
    return;
  }
  const inicio = performance.now();
  const duracion = 900;
  function paso(ahora) {
    const progreso = Math.min(1, (ahora - inicio) / duracion);
    const suavizado = 1 - Math.pow(1 - progreso, 3);
    el.textContent = formatear(desde + (hasta - desde) * suavizado);
    if (progreso < 1) requestAnimationFrame(paso);
  }
  requestAnimationFrame(paso);
  el.closest(".kpi").classList.remove("flash");
  void el.offsetWidth;
  el.closest(".kpi").classList.add("flash");
}

// ---- Render ----

function renderKpis() {
  const stats = calcularEstadisticas(pedidos);
  const stock = resumenStock(stockEnVivo);

  animarNumero("kpi-sales", stats.ventas, (v) => formatMoney(v));
  animarNumero("kpi-orders", stats.pedidos, (v) => Math.round(v));
  animarNumero("kpi-units", stats.unidades, (v) => Math.round(v));
  animarNumero("kpi-low", stock.bajos, (v) => Math.round(v));

  document.getElementById("kpi-sales-hint").textContent = tf("kpi.avgTicket", { amount: formatMoney(stats.ticketPromedio) });
  document.getElementById("kpi-orders-hint").textContent = pedidos[0] ? tf("kpi.lastOrder", { code: pedidos[0].codigo }) : "";
  document.getElementById("kpi-units-hint").textContent = tf("kpi.inCarts", { n: stock.enCarritos });
  document.getElementById("kpi-low-hint").textContent = tf("kpi.soldOut", { n: stock.agotados });
}

// Al cambiar idioma o tipo de cambio se reescribe el monto sin volver a animarlo.
function refrescarMontos() {
  document.getElementById("kpi-sales").textContent = formatMoney(valoresKpi["kpi-sales"] ?? 0);
  renderKpis();
}

function renderBarras() {
  const contenedor = document.getElementById("category-bars");
  const datos = ventasPorCategoria(pedidos);
  if (datos.length === 0) {
    contenedor.innerHTML = `<p class="muted empty-panel">${icon("chart-bar", "icon-lg")}<span>${t("admin.noSales")}</span></p>`;
    return;
  }
  const maximo = datos[0][1];
  contenedor.innerHTML = datos
    .map(([clave, monto]) => {
      const { icono, color } = categoriaInfo(clave);
      return `
      <div class="bar-row">
        <span class="bar-label" style="--accent: ${color}">${icon(icono)} ${categoryName(clave)}</span>
        <div class="bar-track"><span class="bar-fill" style="--w: ${(monto / maximo) * 100}%"></span></div>
        <strong class="bar-value">${formatMoney(monto)}</strong>
      </div>`;
    })
    .join("");
  // Se aplica el ancho en el siguiente cuadro para que la transición CSS haga crecer la barra.
  requestAnimationFrame(() => contenedor.classList.add("ready"));
}

function renderPedidos() {
  const feed = document.getElementById("orders-feed");
  if (pedidos.length === 0) {
    feed.innerHTML = `<li class="muted empty-panel">${icon("receipt", "icon-lg")}<span>${t("admin.noOrders")}</span></li>`;
    return;
  }
  feed.innerHTML = pedidos
    .slice(0, MAX_PEDIDOS_FEED)
    .map((pedido) => {
      const iconos = pedido.items
        .slice(0, 3)
        .map((item) => `<span class="mini-icon" style="--accent: ${categoriaInfo(item.categoria).color}">${productIcon(item)}</span>`)
        .join("");
      return `
      <li class="order ${pedidosNuevos.has(pedido.id) ? "new" : ""}">
        <span class="order-icons">${iconos}</span>
        <div class="order-info">
          <strong>${pedido.codigo} · ${pedido.cliente.nombre}</strong>
          <small class="muted">${formatDateTime(pedido.fecha)} · ${unitsLabel(pedido.unidades)} · ${t(`pay.${pedido.cliente.metodo_pago}`)}</small>
        </div>
        <strong class="order-total">${formatMoney(pedido.total)}</strong>
      </li>`;
    })
    .join("");
}

function renderDashboard() {
  renderKpis();
  renderBarras();
  renderPedidos();
}

async function fetchPedidos() {
  const response = await fetch(API_PEDIDOS);
  pedidos = await response.json();
  renderDashboard();
}

// ---- Tiempo real ----

document.addEventListener("rt:pedido", (event) => {
  const pedido = event.detail.pedido;
  pedidos.unshift(pedido);
  pedidosNuevos.add(pedido.id);
  renderDashboard();
  showToast(tf("toast.newOrder", { code: pedido.codigo, total: formatMoney(pedido.total) }), "success");
  setTimeout(() => pedidosNuevos.delete(pedido.id), 3000);
});

// admin-products.js actualiza stockEnVivo con el mismo evento; este listener se registra después.
document.addEventListener("rt:stock", renderKpis);

document.addEventListener("localechange", () => {
  refrescarMontos();
  renderBarras();
  renderPedidos();
});
document.addEventListener("exchangerateupdate", () => {
  refrescarMontos();
  renderBarras();
  renderPedidos();
});

fetchPedidos();
