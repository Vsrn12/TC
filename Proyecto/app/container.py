"""
Instancias compartidas por toda la aplicación (un contenedor IoC sencillo).
La API REST y el WebSocket usan el mismo repositorio, así ambos ven el mismo stock.
"""
from app.repositories.base import ProductRepositoryInterface
from app.repositories.json_product_repository import JsonProductRepository
from app.repositories.order_repository import JsonOrderRepository, OrderRepositoryInterface
from app.services.connection_manager import ConnectionManager
from app.services.order_service import OrderService
from app.services.realtime_service import RealtimeService
from app.services.stock_reservation_service import StockReservationService

product_repository: ProductRepositoryInterface = JsonProductRepository()
connection_manager = ConnectionManager()
stock_reservation_service = StockReservationService(product_repository)
realtime_service = RealtimeService(connection_manager, stock_reservation_service)
order_repository: OrderRepositoryInterface = JsonOrderRepository()
order_service = OrderService(order_repository, product_repository, stock_reservation_service)
