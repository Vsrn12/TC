from app.models.order import OrderResponse
from app.models.product import ProductResponse
from app.services.connection_manager import ConnectionManager
from app.services.stock_reservation_service import StockReservationService


class RealtimeService:
    """
    Arma los mensajes que se envían por WebSocket y los difunde a todos los clientes.
    Así los controladores solo dicen "qué pasó" y no cómo se notifica.
    """

    def __init__(self, manager: ConnectionManager, stock_service: StockReservationService) -> None:
        self._manager = manager
        self._stock = stock_service

    async def difundir_usuarios(self) -> None:
        await self._manager.difundir({"tipo": "usuarios", "conectados": self._manager.total})

    async def difundir_stock(self) -> None:
        await self._manager.difundir({"tipo": "stock", "productos": self._stock.resumen()})

    async def enviar_stock(self, cliente_id: str) -> None:
        await self._manager.enviar(cliente_id, {"tipo": "stock", "productos": self._stock.resumen()})

    async def notificar_producto(self, evento: str, producto: ProductResponse) -> None:
        """evento: "creado", "actualizado" o "eliminado"."""
        await self._manager.difundir(
            {"tipo": "producto", "evento": evento, "producto": producto.model_dump()}
        )
        await self.difundir_stock()

    async def notificar_pedido(self, pedido: OrderResponse, sesion: str) -> None:
        """Avisa a los demás clientes (y al panel de administración) que entró un pedido."""
        await self._manager.difundir({"tipo": "pedido", "pedido": pedido.model_dump()}, excepto=sesion)
        await self.difundir_stock()

    async def enviar(self, cliente_id: str, mensaje: dict) -> None:
        await self._manager.enviar(cliente_id, mensaje)
