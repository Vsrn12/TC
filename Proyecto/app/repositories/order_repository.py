import json
from abc import ABC, abstractmethod
from pathlib import Path
from typing import List
from app.models.order import OrderResponse

DEFAULT_ORDERS_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "orders.json"


class OrderRepositoryInterface(ABC):
    """Interfaz abstracta para el repositorio de pedidos (Principio DIP)."""

    @abstractmethod
    def get_all(self) -> List[OrderResponse]:
        pass

    @abstractmethod
    def next_id(self) -> int:
        pass

    @abstractmethod
    def save(self, order: OrderResponse) -> OrderResponse:
        pass


class JsonOrderRepository(OrderRepositoryInterface):
    """
    Capa de Acceso a Datos: guarda los pedidos en data/orders.json.
    El archivo se crea vacío la primera vez que se usa.
    """

    def __init__(self, data_file: Path = DEFAULT_ORDERS_FILE) -> None:
        self._data_file = data_file
        self._orders: List[OrderResponse] = []
        self._load()

    def _load(self) -> None:
        self._data_file.parent.mkdir(parents=True, exist_ok=True)
        if not self._data_file.exists():
            self._save()
            return
        with self._data_file.open("r", encoding="utf-8") as file:
            self._orders = [OrderResponse(**item) for item in json.load(file)]

    def _save(self) -> None:
        with self._data_file.open("w", encoding="utf-8") as file:
            json.dump([order.model_dump() for order in self._orders], file, ensure_ascii=False, indent=2)

    def get_all(self) -> List[OrderResponse]:
        return list(self._orders)

    def next_id(self) -> int:
        return max((order.id for order in self._orders), default=0) + 1

    def save(self, order: OrderResponse) -> OrderResponse:
        self._orders.append(order)
        self._save()
        return order
