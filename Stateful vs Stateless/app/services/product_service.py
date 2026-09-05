from typing import List, Optional
from app.repositories.base import ProductRepositoryInterface
from app.models.product import ProductCreate, ProductUpdate, ProductResponse


class ProductService:
    """
    Capa de Lógica de Negocio (Business Layer / Service).
    Contiene reglas de negocio, validaciones y orquesta las llamadas al repositorio.
    Aplica el principio DIP al recibir la interfaz del repositorio por inyección de dependencias.
    """

    def __init__(self, repository: ProductRepositoryInterface) -> None:
        self._repository = repository

    def list_products(self) -> List[ProductResponse]:
        """Obtiene el listado completo de productos."""
        return self._repository.get_all()

    def get_product_by_id(self, product_id: int) -> Optional[ProductResponse]:
        """Busca un producto por su identificador único."""
        if product_id <= 0:
            raise ValueError("El ID del producto debe ser un entero positivo.")
        return self._repository.get_by_id(product_id)

    def create_product(self, product_data: ProductCreate) -> ProductResponse:
        """Valida y crea un nuevo producto."""
        self._validate_product_data(product_data.nombre, product_data.precio)
        return self._repository.create(product_data)

    def update_product(self, product_id: int, product_data: ProductUpdate) -> Optional[ProductResponse]:
        """Valida y actualiza los datos de un producto existente."""
        if product_id <= 0:
            raise ValueError("El ID del producto debe ser un entero positivo.")

        # Validaciones de negocio en campos a actualizar
        if product_data.nombre is not None:
            self._validate_nombre(product_data.nombre)
        if product_data.precio is not None:
            self._validate_precio(product_data.precio)

        # Verificar existencia en repositorio
        existing = self._repository.get_by_id(product_id)
        if not existing:
            return None

        return self._repository.update(product_id, product_data)

    def delete_product(self, product_id: int) -> bool:
        """Elimina un producto por su ID."""
        if product_id <= 0:
            raise ValueError("El ID del producto debe ser un entero positivo.")
        return self._repository.delete(product_id)

    def _validate_product_data(self, nombre: str, precio: float) -> None:
        """Aplica todas las reglas de negocio para un producto nuevo."""
        self._validate_nombre(nombre)
        self._validate_precio(precio)

    def _validate_nombre(self, nombre: str) -> None:
        if not nombre or not nombre.strip():
            raise ValueError("El nombre del producto no puede estar vacío.")

    def _validate_precio(self, precio: float) -> None:
        if precio <= 0:
            raise ValueError("El precio del producto debe ser estrictamente mayor a 0.")
