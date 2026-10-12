import threading
from typing import Dict
from app.models.product import ProductUpdate
from app.repositories.base import ProductRepositoryInterface


class StockReservationService:
    """
    Capa de Lógica de Negocio: reservas de stock en tiempo real.

    Cuando un cliente agrega un producto a su carrito se le reserva una unidad, que deja de estar
    disponible para los demás. Las reservas viven en memoria y se liberan si el cliente quita el
    producto o cierra la pestaña. Al confirmar la compra se descuentan del stock guardado en disco.

        disponible = stock - unidades reservadas por todos los clientes
    """

    def __init__(self, repository: ProductRepositoryInterface) -> None:
        self._repository = repository
        # { cliente_id: { producto_id: cantidad } }
        self._reservas: Dict[str, Dict[int, int]] = {}
        # Los endpoints REST corren en hilos aparte y el WebSocket en el event loop.
        self._lock = threading.Lock()

    def _reservado(self, producto_id: int) -> int:
        return sum(reservas.get(producto_id, 0) for reservas in self._reservas.values())

    def _disponible(self, producto_id: int) -> int:
        producto = self._repository.get_by_id(producto_id)
        if not producto:
            return 0
        return max(0, producto.stock - self._reservado(producto_id))

    def resumen(self) -> Dict[int, dict]:
        """Stock, unidades reservadas y unidades disponibles de cada producto."""
        with self._lock:
            resumen = {}
            for producto in self._repository.get_all():
                reservado = self._reservado(producto.id)
                resumen[producto.id] = {
                    "stock": producto.stock,
                    "reservado": reservado,
                    "disponible": max(0, producto.stock - reservado),
                }
            return resumen

    def reservar(self, cliente_id: str, producto_id: int) -> bool:
        """Reserva una unidad para el cliente. Retorna False si ya no hay unidades disponibles."""
        with self._lock:
            if self._disponible(producto_id) <= 0:
                return False
            reservas = self._reservas.setdefault(cliente_id, {})
            reservas[producto_id] = reservas.get(producto_id, 0) + 1
            return True

    def liberar(self, cliente_id: str, producto_id: int, cantidad: int = 1) -> bool:
        """Devuelve unidades reservadas por el cliente. Retorna False si no tenía ninguna."""
        with self._lock:
            reservas = self._reservas.get(cliente_id, {})
            if reservas.get(producto_id, 0) <= 0 or cantidad <= 0:
                return False
            reservas[producto_id] -= min(cantidad, reservas[producto_id])
            if reservas[producto_id] == 0:
                del reservas[producto_id]
            return True

    def liberar_todo(self, cliente_id: str) -> bool:
        """Libera todas las reservas del cliente (al desconectarse). Retorna True si tenía alguna."""
        with self._lock:
            return bool(self._reservas.pop(cliente_id, None))

    def sincronizar(self, cliente_id: str, pedidas: Dict[int, int]) -> Dict[int, int]:
        """
        Reemplaza las reservas del cliente por las cantidades pedidas, hasta donde alcance el stock.
        Se usa al reconectarse, para recuperar el carrito que el navegador aún tiene en pantalla.
        Retorna las cantidades que realmente se pudieron reservar.
        """
        with self._lock:
            self._reservas.pop(cliente_id, None)
            concedidas = {}
            for producto_id, cantidad in pedidas.items():
                cantidad = min(max(0, cantidad), self._disponible(producto_id))
                if cantidad > 0:
                    concedidas[producto_id] = cantidad
            if concedidas:
                self._reservas[cliente_id] = concedidas
            return dict(concedidas)

    def confirmar_compra(self, cliente_id: str) -> Dict[int, int]:
        """
        Descuenta del stock en disco lo reservado por el cliente.
        Retorna { producto_id: unidades vendidas }.
        """
        with self._lock:
            reservas = self._reservas.pop(cliente_id, {})
            vendidos = {}
            for producto_id, cantidad in reservas.items():
                producto = self._repository.get_by_id(producto_id)
                if not producto:
                    continue
                vendidas = min(cantidad, producto.stock)
                if vendidas > 0:
                    self._repository.update(producto_id, ProductUpdate(stock=producto.stock - vendidas))
                    vendidos[producto_id] = vendidas
            return vendidos

    def olvidar_producto(self, producto_id: int) -> None:
        """Quita un producto eliminado de las reservas de todos los clientes."""
        with self._lock:
            for reservas in self._reservas.values():
                reservas.pop(producto_id, None)
