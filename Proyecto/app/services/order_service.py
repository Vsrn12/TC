import re
from datetime import datetime, timezone
from typing import List
from app.models.order import CustomerData, OrderCreate, OrderItem, OrderResponse
from app.repositories.base import ProductRepositoryInterface
from app.repositories.order_repository import OrderRepositoryInterface
from app.services.stock_reservation_service import StockReservationService

IGV_RATE = 0.18
COSTO_BOLSA = 0.5
METODOS_PAGO = ("efectivo", "tarjeta", "yape")

# Mismas reglas que validateCustomerFields en static/validation.js.
# [^\W\d_] equivale a \p{L} (una letra, con tildes y ñ).
CLIENTE_PATTERNS = {
    # Nombre y apellido: al menos dos palabras de letras, de 3 a 60 caracteres.
    "nombre": (
        re.compile(r"^(?=.{3,60}$)[^\W\d_]+(?:[ '-][^\W\d_]+)+$"),
        "Ingresa tu nombre y apellido (solo letras, de 3 a 60 caracteres).",
    ),
    # DNI peruano: exactamente 8 dígitos.
    "documento": (re.compile(r"^\d{8}$"), "El DNI debe tener exactamente 8 dígitos."),
    "email": (
        re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$"),
        "El correo electrónico no es válido.",
    ),
    # Celular peruano: 9 dígitos que empiezan en 9.
    "telefono": (re.compile(r"^9\d{8}$"), "El celular debe tener 9 dígitos y empezar en 9."),
    # Dirección: de 5 a 100 caracteres, con al menos una letra.
    "direccion": (
        re.compile(r"^(?=.*[^\W\d_])(?:[^\W_]|[ .,#°º/-]){5,100}$"),
        "La dirección debe tener de 5 a 100 caracteres (letras, números y . , # ° / -).",
    ),
}


class OrderService:
    """
    Capa de Lógica de Negocio: convierte las reservas de un cliente en un pedido.
    Los precios y totales se calculan aquí con los datos del servidor: nunca se confía
    en los montos que envía el navegador.
    """

    def __init__(
        self,
        repository: OrderRepositoryInterface,
        product_repository: ProductRepositoryInterface,
        stock_service: StockReservationService,
    ) -> None:
        self._repository = repository
        self._products = product_repository
        self._stock = stock_service

    def list_orders(self) -> List[OrderResponse]:
        """Pedidos del más reciente al más antiguo."""
        return sorted(self._repository.get_all(), key=lambda order: order.id, reverse=True)

    def create_order(self, order_data: OrderCreate) -> OrderResponse:
        cliente = self._validate_cliente(order_data.cliente)

        # Precios del momento de la compra, leídos antes de descontar el stock.
        productos = {producto.id: producto for producto in self._products.get_all()}
        vendidos = self._stock.confirmar_compra(order_data.sesion)
        if not vendidos:
            raise ValueError("Tu carrito está vacío o sus productos ya no están disponibles.")

        items = []
        for producto_id, cantidad in vendidos.items():
            producto = productos.get(producto_id) or self._products.get_by_id(producto_id)
            if not producto:
                continue
            items.append(
                OrderItem(
                    producto_id=producto.id,
                    nombre=producto.nombre,
                    categoria=producto.categoria,
                    precio=producto.precio,
                    cantidad=cantidad,
                    subtotal=round(producto.precio * cantidad, 2),
                )
            )

        subtotal = round(sum(item.subtotal for item in items), 2)
        igv = round(subtotal * IGV_RATE, 2)
        order_id = self._repository.next_id()
        order = OrderResponse(
            id=order_id,
            codigo=f"PED-{order_id:05d}",
            fecha=datetime.now(timezone.utc).isoformat(timespec="seconds"),
            cliente=cliente,
            items=items,
            unidades=sum(item.cantidad for item in items),
            subtotal=subtotal,
            igv=igv,
            bolsa=COSTO_BOLSA,
            total=round(subtotal + igv + COSTO_BOLSA, 2),
        )
        return self._repository.save(order)

    def _validate_cliente(self, cliente: CustomerData) -> CustomerData:
        datos = {campo: valor.strip() for campo, valor in cliente.model_dump().items()}
        for campo, (patron, mensaje) in CLIENTE_PATTERNS.items():
            if not patron.match(datos[campo]):
                raise ValueError(mensaje)
        if datos["metodo_pago"] not in METODOS_PAGO:
            raise ValueError("El método de pago no es válido.")
        datos["email"] = datos["email"].lower()
        return CustomerData(**datos)
