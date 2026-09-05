from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class ProductBase(BaseModel):
    nombre: str = Field(..., min_length=1, description="Nombre del producto")
    precio: float = Field(..., description="Precio del producto")


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    nombre: Optional[str] = Field(None, min_length=1, description="Nuevo nombre del producto")
    precio: Optional[float] = Field(None, description="Nuevo precio del producto")


class ProductResponse(ProductBase):
    id: int

    model_config = ConfigDict(from_attributes=True)
