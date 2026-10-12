from typing import List
from pydantic import BaseModel, Field


class CustomerData(BaseModel):
    nombre: str = Field(..., description="Nombre y apellido del cliente")
    documento: str = Field(..., description="DNI de 8 dígitos")
    email: str = Field(..., description="Correo electrónico")
    telefono: str = Field(..., description="Celular de 9 dígitos que empieza en 9")
    direccion: str = Field(..., description="Dirección de entrega")
    metodo_pago: str = Field(..., description="efectivo, tarjeta o yape")


class OrderCreate(BaseModel):
    cliente: CustomerData
    sesion: str = Field(..., description="Identificador de la conexión WebSocket que tiene las reservas")


class OrderItem(BaseModel):
    producto_id: int
    nombre: str
    categoria: str
    precio: float
    cantidad: int
    subtotal: float


class OrderResponse(BaseModel):
    id: int
    codigo: str
    fecha: str
    cliente: CustomerData
    items: List[OrderItem]
    unidades: int
    subtotal: float
    igv: float
    bolsa: float
    total: float
