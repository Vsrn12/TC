from typing import List
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from app import container
from app.models.order import OrderCreate, OrderResponse
from app.services.order_service import OrderService

router = APIRouter(prefix="/api/pedidos", tags=["Pedidos"])


def get_order_service() -> OrderService:
    """Proveedor de dependencias para el Servicio de pedidos (DIP)."""
    return container.order_service


@router.get("", response_model=List[OrderResponse], status_code=status.HTTP_200_OK)
def list_orders(service: OrderService = Depends(get_order_service)) -> List[OrderResponse]:
    """Capa de Presentación: pedidos del más reciente al más antiguo."""
    return service.list_orders()


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    order_data: OrderCreate,
    background_tasks: BackgroundTasks,
    service: OrderService = Depends(get_order_service),
) -> OrderResponse:
    """
    Capa de Presentación: confirma la compra de lo que la sesión WebSocket tiene reservado.
    Valida los datos del cliente y calcula los totales en el servidor.
    """
    try:
        order = service.create_order(order_data)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

    background_tasks.add_task(container.realtime_service.notificar_pedido, order, order_data.sesion)
    return order
