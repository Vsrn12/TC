import json
from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.container import connection_manager, realtime_service, stock_reservation_service

router = APIRouter(tags=["Tiempo real"])


@router.websocket("/ws")
async def canal_tiempo_real(websocket: WebSocket) -> None:
    """
    Capa de Presentación: canal WebSocket compartido por las páginas de productos y carrito.

    Cliente -> servidor:
        {"accion": "reservar", "producto_id": 1}
        {"accion": "liberar", "producto_id": 1, "cantidad": 1}
        {"accion": "sincronizar", "items": [{"producto_id": 1, "cantidad": 2}]}

    Servidor -> cliente:
        {"tipo": "sesion", "cliente_id": "..."}
        {"tipo": "usuarios", "conectados": 3}
        {"tipo": "stock", "productos": {"1": {"stock": 25, "reservado": 2, "disponible": 23}}}
        {"tipo": "producto", "evento": "creado" | "actualizado" | "eliminado", "producto": {...}}
        {"tipo": "reserva", "producto_id": 1, "ok": true}
        {"tipo": "sincronizado", "reservas": {"1": 2}}
        {"tipo": "pedido", "pedido": {...}}               (a los demás, al confirmarse un pedido)
    """
    cliente_id = await connection_manager.conectar(websocket)
    # El navegador guarda su id de sesión para enviarlo al confirmar el pedido (POST /api/pedidos).
    await realtime_service.enviar(cliente_id, {"tipo": "sesion", "cliente_id": cliente_id})
    await realtime_service.enviar_stock(cliente_id)
    await realtime_service.difundir_usuarios()

    try:
        while True:
            texto = await websocket.receive_text()
            try:
                mensaje = json.loads(texto)
            except json.JSONDecodeError:
                continue
            if isinstance(mensaje, dict):
                await _procesar(cliente_id, mensaje)
    except WebSocketDisconnect:
        pass
    finally:
        connection_manager.desconectar(cliente_id)
        if stock_reservation_service.liberar_todo(cliente_id):
            await realtime_service.difundir_stock()
        await realtime_service.difundir_usuarios()


async def _procesar(cliente_id: str, mensaje: dict) -> None:
    accion = mensaje.get("accion")

    if accion == "reservar":
        producto_id = _entero(mensaje.get("producto_id"))
        ok = producto_id is not None and stock_reservation_service.reservar(cliente_id, producto_id)
        await realtime_service.enviar(cliente_id, {"tipo": "reserva", "producto_id": producto_id, "ok": ok})
        if ok:
            await realtime_service.difundir_stock()

    elif accion == "liberar":
        producto_id = _entero(mensaje.get("producto_id"))
        cantidad = _entero(mensaje.get("cantidad")) or 1
        if producto_id is not None and stock_reservation_service.liberar(cliente_id, producto_id, cantidad):
            await realtime_service.difundir_stock()

    elif accion == "sincronizar":
        pedidas = {}
        for item in mensaje.get("items") or []:
            producto_id = _entero(item.get("producto_id")) if isinstance(item, dict) else None
            cantidad = _entero(item.get("cantidad")) if isinstance(item, dict) else None
            if producto_id is not None and cantidad is not None:
                pedidas[producto_id] = cantidad
        reservas = stock_reservation_service.sincronizar(cliente_id, pedidas)
        await realtime_service.enviar(cliente_id, {"tipo": "sincronizado", "reservas": reservas})
        await realtime_service.difundir_stock()


def _entero(valor) -> Optional[int]:
    return valor if isinstance(valor, int) and not isinstance(valor, bool) else None
