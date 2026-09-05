from abc import ABC, abstractmethod
from typing import List, Optional
from app.models.product import ProductCreate, ProductUpdate, ProductResponse


class ProductRepositoryInterface(ABC):
    """Interfaz abstracta para el repositorio de productos (Principio DIP)."""

    @abstractmethod
    def get_all(self) -> List[ProductResponse]:
        pass

    @abstractmethod
    def get_by_id(self, product_id: int) -> Optional[ProductResponse]:
        pass

    @abstractmethod
    def create(self, product_data: ProductCreate) -> ProductResponse:
        pass

    @abstractmethod
    def update(self, product_id: int, product_data: ProductUpdate) -> Optional[ProductResponse]:
        pass

    @abstractmethod
    def delete(self, product_id: int) -> bool:
        pass
