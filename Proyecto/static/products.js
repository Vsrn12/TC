const API_URL = "/api/productos";

const form = document.getElementById("product-form");
const idInput = document.getElementById("product-id");
const nombreInput = document.getElementById("nombre");
const precioInput = document.getElementById("precio");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const tableBody = document.getElementById("products-table-body");
const errorMessage = document.getElementById("error-message");

// Los precios se guardan en soles. Al editar se recuerda el valor exacto en soles y lo que se
// mostró en el campo, para no alterar el precio por redondeos de la conversión a dólares.
let products = [];
let editingPricePen = null;
let prefilledPrice = "";

function refreshSubmitLabel() {
  submitBtn.textContent = idInput.value ? t("form.update") : t("form.add");
}

// Campos validados con regex (ver validation.js): cada uno con su <input> y su mensaje de error.
const campos = {
  nombre: { input: nombreInput, error: document.getElementById("nombre-error") },
  precio: { input: precioInput, error: document.getElementById("precio-error") },
};

function leerCampos() {
  return {
    nombre: nombreInput.value.trim(),
    precio: precioInput.value.trim(),
  };
}

function validarCampos() {
  return validateProductFields(leerCampos());
}

// Muestra u oculta el error de los campos indicados (por defecto todos), en el idioma activo.
function mostrarErroresCampos(errores, nombres = Object.keys(campos)) {
  for (const nombre of nombres) {
    const clave = errores[nombre];
    campos[nombre].error.textContent = clave ? t(clave) : "";
    campos[nombre].input.classList.toggle("invalid", Boolean(clave));
    campos[nombre].input.setAttribute("aria-invalid", String(Boolean(clave)));
  }
}

function camposConError() {
  return Object.keys(campos).filter((nombre) => campos[nombre].error.textContent !== "");
}

function prefillPrice(pricePen) {
  editingPricePen = pricePen;
  prefilledPrice = String(toDisplayAmount(pricePen));
  precioInput.value = prefilledPrice;
}

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.classList.add("hidden");
}

function resetForm() {
  idInput.value = "";
  nombreInput.value = "";
  precioInput.value = "";
  editingPricePen = null;
  prefilledPrice = "";
  mostrarErroresCampos({});
  refreshSubmitLabel();
  cancelBtn.classList.add("hidden");
}

async function fetchProducts() {
  const response = await fetch(API_URL);
  products = await response.json();
  renderProducts();
}

function renderProducts() {
  tableBody.innerHTML = "";
  for (const product of products) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${product.id}</td>
      <td>${productName(product)}</td>
      <td>${formatMoney(Number(product.precio))}</td>
      <td>
        <button class="btn-edit" data-id="${product.id}">${t("action.edit")}</button>
        <button class="btn-delete" data-id="${product.id}">${t("action.delete")}</button>
      </td>
    `;
    tableBody.appendChild(row);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const sinCambios = editingPricePen !== null && precioInput.value === prefilledPrice;
  const errores = validarCampos();
  if (sinCambios) delete errores.precio; // el precio sin tocar ya está guardado y es válido
  mostrarErroresCampos(errores);
  const primerInvalido = Object.keys(errores)[0];
  if (primerInvalido) {
    campos[primerInvalido].input.focus();
    return;
  }

  const { nombre, precio } = leerCampos();
  const payload = {
    nombre,
    precio: sinCambios ? editingPricePen : fromDisplayAmount(parsePrice(precio)),
  };

  const editingId = idInput.value;
  const url = editingId ? `${API_URL}/${editingId}` : API_URL;
  const method = editingId ? "PUT" : "POST";

  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json();
    showError(translateBackendError(errorData.detail));
    return;
  }

  resetForm();
  await fetchProducts();
});

tableBody.addEventListener("click", async (event) => {
  const target = event.target;
  const productId = target.dataset.id;
  if (!productId) return;

  clearError();

  if (target.classList.contains("btn-delete")) {
    const response = await fetch(`${API_URL}/${productId}`, { method: "DELETE" });
    if (!response.ok) {
      const errorData = await response.json();
      showError(translateBackendError(errorData.detail, "error.delete"));
      return;
    }
    await fetchProducts();
  }

  if (target.classList.contains("btn-edit")) {
    const response = await fetch(`${API_URL}/${productId}`);
    if (!response.ok) return;
    const product = await response.json();
    idInput.value = product.id;
    nombreInput.value = product.nombre;
    prefillPrice(product.precio);
    mostrarErroresCampos({});
    refreshSubmitLabel();
    cancelBtn.classList.remove("hidden");
  }
});

cancelBtn.addEventListener("click", () => {
  clearError();
  resetForm();
});

// Validación en vivo: al salir de un campo se muestra su error; si ya tenía error, se
// actualiza mientras se escribe hasta que sea válido.
for (const [nombre, { input }] of Object.entries(campos)) {
  input.addEventListener("blur", () => mostrarErroresCampos(validarCampos(), [nombre]));
  input.addEventListener("input", () => {
    if (campos[nombre].error.textContent) mostrarErroresCampos(validarCampos(), [nombre]);
  });
}

document.addEventListener("localechange", (event) => {
  const conError = camposConError();
  clearError();
  refreshSubmitLabel();
  renderProducts();

  if (editingPricePen !== null && precioInput.value === prefilledPrice) {
    // Precio sin tocar: se vuelve a mostrar desde el valor exacto en soles.
    prefillPrice(editingPricePen);
  } else if (!Number.isNaN(parsePrice(precioInput.value))) {
    // Precio escrito a mano: se reinterpreta desde la moneda anterior a la nueva.
    const pen = fromDisplayAmount(parsePrice(precioInput.value), event.detail.previous);
    precioInput.value = toDisplayAmount(pen);
  }

  // Los mensajes de error visibles se vuelven a mostrar en el nuevo idioma.
  mostrarErroresCampos(validarCampos(), conError);
});

document.addEventListener("exchangerateupdate", renderProducts);

refreshSubmitLabel();
fetchProducts();
