// Conexión WebSocket compartida por todas las páginas (ver app/controllers/realtime_controller.py).
// Cada mensaje del servidor se reenvía como evento del documento según su tipo: "rt:stock",
// "rt:producto", "rt:reserva", ... para que products.js y cart.js reaccionen sin recargar.
// Además pinta el contador de usuarios conectados y las notificaciones (toasts).

const Realtime = (() => {
  let socket = null;
  let intentos = 0;
  let conectados = null;
  let sesion = null;

  function wsUrl() {
    const protocolo = location.protocol === "https:" ? "wss" : "ws";
    return `${protocolo}://${location.host}/ws`;
  }

  function emitir(nombre, detail) {
    document.dispatchEvent(new CustomEvent(nombre, { detail }));
  }

  function conectar() {
    socket = new WebSocket(wsUrl());

    socket.addEventListener("open", () => {
      intentos = 0;
      emitir("rt:estado", { conectado: true });
    });

    socket.addEventListener("message", (event) => {
      let mensaje;
      try {
        mensaje = JSON.parse(event.data);
      } catch (_) {
        return;
      }
      if (mensaje && typeof mensaje.tipo === "string") emitir(`rt:${mensaje.tipo}`, mensaje);
    });

    socket.addEventListener("close", () => {
      conectados = null;
      sesion = null;
      emitir("rt:estado", { conectado: false });
      // Reintento con espera creciente: 1s, 2s, 4s ... hasta 10s.
      const espera = Math.min(10000, 1000 * 2 ** intentos);
      intentos += 1;
      setTimeout(conectar, espera);
    });
  }

  // Envía un mensaje al servidor. Retorna false si no hay conexión.
  function enviar(mensaje) {
    if (!estaConectado()) return false;
    socket.send(JSON.stringify(mensaje));
    return true;
  }

  function estaConectado() {
    return socket !== null && socket.readyState === WebSocket.OPEN;
  }

  // Indicador "● 3 usuarios conectados" en la barra de navegación.
  function renderEstado() {
    const el = document.getElementById("rt-status");
    if (!el) return;
    const online = estaConectado();
    el.classList.toggle("offline", !online);
    if (!online) {
      el.textContent = t("rt.offline");
    } else if (conectados !== null) {
      el.textContent = tf(conectados === 1 ? "rt.user" : "rt.users", { n: conectados });
    }
  }

  // Id de esta conexión: se envía al confirmar el pedido para comprar lo que tiene reservado.
  document.addEventListener("rt:sesion", (event) => {
    sesion = event.detail.cliente_id;
  });

  document.addEventListener("rt:estado", renderEstado);
  document.addEventListener("localechange", renderEstado);
  document.addEventListener("rt:usuarios", (event) => {
    conectados = event.detail.conectados;
    renderEstado();
  });

  return { conectar, enviar, estaConectado, sesion: () => sesion, conectados: () => conectados };
})();

// Notificación flotante que desaparece sola. tipo: "info", "success" o "warning".
function showToast(texto, tipo = "info") {
  let contenedor = document.getElementById("toast-container");
  if (!contenedor) {
    contenedor = document.createElement("div");
    contenedor.id = "toast-container";
    contenedor.setAttribute("aria-live", "polite");
    document.body.appendChild(contenedor);
  }
  const toast = document.createElement("div");
  toast.className = `toast toast-${tipo}`;
  toast.textContent = texto;
  contenedor.appendChild(toast);
  setTimeout(() => toast.classList.add("toast-hide"), 4000);
  setTimeout(() => toast.remove(), 4500);
}

// Avisos comunes a todas las páginas: cambios en el catálogo.
const TOAST_PRODUCTO = {
  creado: ["toast.created", "success"],
  actualizado: ["toast.updated", "info"],
  eliminado: ["toast.deleted", "warning"],
};

document.addEventListener("rt:producto", (event) => {
  const { evento, producto } = event.detail;
  const [clave, tipo] = TOAST_PRODUCTO[evento] || [];
  if (clave) showToast(tf(clave, { name: productName(producto) }), tipo);
});

Realtime.conectar();
