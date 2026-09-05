import json
from pathlib import Path
from typing import Dict, List, Optional
from app.repositories.base import ProductRepositoryInterface
from app.models.product import ProductCreate, ProductUpdate, ProductResponse

DEFAULT_DATA_FILE = Path(__file__).resolve().parent.parent.parent / "data" / "products.json"


class JsonProductRepository(ProductRepositoryInterface):
    """
    Capa de Acceso a Datos (Data Layer).
    Persiste los productos en un archivo JSON en disco, funcionando como
    una base de datos simple que sobrevive entre reinicios del servidor.
    """

    def __init__(self, data_file: Path = DEFAULT_DATA_FILE) -> None:
        self._data_file = data_file
        self._products: Dict[int, ProductResponse] = {}
        self._current_id: int = 1
        self._load()

    def _load(self) -> None:
        self._data_file.parent.mkdir(parents=True, exist_ok=True)
        if not self._data_file.exists():
            self._save()
            return

        with self._data_file.open("r", encoding="utf-8") as file:
            raw_products = json.load(file)

        self._products = {
            item["id"]: ProductResponse(**item) for item in raw_products
        }
        self._current_id = max(self._products.keys(), default=0) + 1

    def _save(self) -> None:
        raw_products = [product.model_dump() for product in self._products.values()]
        with self._data_file.open("w", encoding="utf-8") as file:
            json.dump(raw_products, file, ensure_ascii=False, indent=2)

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
        self._save()
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
        self._save()
        return updated_product

    def delete(self, product_id: int) -> bool:
        if product_id in self._products:
            del self._products[product_id]
            self._save()
            return True
        return False
