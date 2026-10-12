from typing import Dict, Optional
from uuid import uuid4
from fastapi import WebSocket


class ConnectionManager:
    """
    Registro de las conexiones WebSocket abiertas (una por pestaña del navegador).
    Permite enviar un mensaje a un cliente puntual o difundirlo (broadcast) a todos.
    """

    def __init__(self) -> None:
        self._conexiones: Dict[str, WebSocket] = {}

    @property
    def total(self) -> int:
        return len(self._conexiones)

    async def conectar(self, websocket: WebSocket) -> str:
        """Acepta la conexión y le asigna un identificador único de cliente."""
        await websocket.accept()
        cliente_id = uuid4().hex
        self._conexiones[cliente_id] = websocket
        return cliente_id

    def desconectar(self, cliente_id: str) -> None:
        self._conexiones.pop(cliente_id, None)

    async def enviar(self, cliente_id: str, mensaje: dict) -> None:
        websocket = self._conexiones.get(cliente_id)
        if websocket:
            await websocket.send_json(mensaje)

    async def difundir(self, mensaje: dict, excepto: Optional[str] = None) -> None:
        """Envía el mensaje a todos los clientes conectados (salvo `excepto`)."""
        for cliente_id, websocket in list(self._conexiones.items()):
            if cliente_id == excepto:
                continue
            try:
                await websocket.send_json(mensaje)
            except Exception:
                # La conexión se cerró a mitad del envío: se descarta y se sigue con los demás.
                self.desconectar(cliente_id)
