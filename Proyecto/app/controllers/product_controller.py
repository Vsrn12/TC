from typing import List
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from app.models.product import ProductCreate, ProductUpdate, ProductResponse
from app.services.product_service import ProductService
from app.repositories.base import ProductRepositoryInterface
from app import container

router = APIRouter(prefix="/api/productos", tags=["Productos"])


def get_product_repository() -> ProductRepositoryInterface:
    """Proveedor de dependencias para el Repositorio (DIP). La instancia vive en app/container.py."""
    return container.product_repository


def get_product_service(
    repository: ProductRepositoryInterface = Depends(get_product_repository),
) -> ProductService:
    """Proveedor de dependencias para el Servicio inyectando el Repositorio (DIP)."""
    return ProductService(repository=repository)


@router.get("", response_model=List[ProductResponse], status_code=status.HTTP_200_OK)
def list_products(service: ProductService = Depends(get_product_service)) -> List[ProductResponse]:
    """Capa de Presentación: Retorna todos los productos en formato JSON."""
    return service.list_products()


@router.get("/{product_id}", response_model=ProductResponse, status_code=status.HTTP_200_OK)
def get_product(
    product_id: int,
    service: ProductService = Depends(get_product_service),
) -> ProductResponse:
    """Capa de Presentación: Busca y retorna un producto por ID."""
    try:
        product = service.get_product_by_id(product_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con id {product_id} no encontrado.",
        )
    return product


@router.post("", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    product_data: ProductCreate,
    background_tasks: BackgroundTasks,
    service: ProductService = Depends(get_product_service),
) -> ProductResponse:
    """Capa de Presentación: Recibe el payload JSON, invoca al servicio y retorna el recurso creado."""
    try:
        created = service.create_product(product_data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    # Tras responder, se avisa por WebSocket a todas las pestañas abiertas.
    background_tasks.add_task(container.realtime_service.notificar_producto, "creado", created)
    return created


@router.put("/{product_id}", response_model=ProductResponse, status_code=status.HTTP_200_OK)
def update_product(
    product_id: int,
    product_data: ProductUpdate,
    background_tasks: BackgroundTasks,
    service: ProductService = Depends(get_product_service),
) -> ProductResponse:
    """Capa de Presentación: Actualiza un producto existente."""
    try:
        updated = service.update_product(product_id, product_data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con id {product_id} no encontrado para actualizar.",
        )

    background_tasks.add_task(container.realtime_service.notificar_producto, "actualizado", updated)
    return updated


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    background_tasks: BackgroundTasks,
    service: ProductService = Depends(get_product_service),
) -> None:
    """Capa de Presentación: Elimina un producto por su ID."""
    try:
        product = service.get_product_by_id(product_id)
        deleted = service.delete_product(product_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Producto con id {product_id} no encontrado para eliminar.",
        )

    # Las unidades que otros clientes tenían reservadas de este producto dejan de existir.
    container.stock_reservation_service.olvidar_producto(product_id)
    background_tasks.add_task(container.realtime_service.notificar_producto, "eliminado", product)
