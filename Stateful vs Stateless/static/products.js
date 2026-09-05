const API_URL = "/api/productos";

const form = document.getElementById("product-form");
const idInput = document.getElementById("product-id");
const nombreInput = document.getElementById("nombre");
const precioInput = document.getElementById("precio");
const submitBtn = document.getElementById("submit-btn");
const cancelBtn = document.getElementById("cancel-btn");
const tableBody = document.getElementById("products-table-body");
const errorMessage = document.getElementById("error-message");

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
  submitBtn.textContent = "Agregar";
  cancelBtn.classList.add("hidden");
}

async function fetchProducts() {
  const response = await fetch(API_URL);
  const products = await response.json();
  renderProducts(products);
}

function renderProducts(products) {
  tableBody.innerHTML = "";
  for (const product of products) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${product.id}</td>
      <td>${product.nombre}</td>
      <td>$${Number(product.precio).toFixed(2)}</td>
      <td>
        <button class="btn-edit" data-id="${product.id}">Editar</button>
        <button class="btn-delete" data-id="${product.id}">Eliminar</button>
      </td>
    `;
    tableBody.appendChild(row);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearError();

  const payload = {
    nombre: nombreInput.value.trim(),
    precio: parseFloat(precioInput.value),
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
    showError(errorData.detail || "Ocurrió un error al procesar la solicitud.");
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
      showError(errorData.detail || "No se pudo eliminar el producto.");
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
    precioInput.value = product.precio;
    submitBtn.textContent = "Actualizar";
    cancelBtn.classList.remove("hidden");
  }
});

cancelBtn.addEventListener("click", () => {
  clearError();
  resetForm();
});

fetchProducts();
