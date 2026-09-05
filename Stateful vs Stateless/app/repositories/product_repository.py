from typing import Dict, List, Optional
from app.repositories.base import ProductRepositoryInterface
from app.models.product import ProductCreate, ProductUpdate, ProductResponse


class InMemoryProductRepository(ProductRepositoryInterface):
    """
    Capa de Acceso a Datos (Data Layer).
    Maneja el almacenamiento y persistencia de datos (en memoria).
    No contiene lógica de negocio ni validaciones.
    """

    def __init__(self) -> None:
        self._products: Dict[int, ProductResponse] = {}
        self._current_id: int = 1

    def get_all(self) -> List[ProductResponse]:
        return list(self._products.values())

    def get_by_id(self, product_id: int) -> Optional[ProductResponse]:
        return self._products.get(product_id)

    def create(self, product_data: ProductCreate) -> ProductResponse:
        new_product = ProductResponse(
            id=self._current_id,
            nombre=product_data.nombre,
            precio=product_data.precio,
        )
        self._products[self._current_id] = new_product
        self._current_id += 1
        return new_product

    def update(self, product_id: int, product_data: ProductUpdate) -> Optional[ProductResponse]:
        existing_product = self._products.get(product_id)
        if not existing_product:
            return None

        updated_data = existing_product.model_dump()
        if product_data.nombre is not None:
            updated_data["nombre"] = product_data.nombre
        if product_data.precio is not None:
            updated_data["precio"] = product_data.precio

        updated_product = ProductResponse(**updated_data)
        self._products[product_id] = updated_product
        return updated_product

    def delete(self, product_id: int) -> bool:
        if product_id in self._products:
            del self._products[product_id]
            return True
        return False
