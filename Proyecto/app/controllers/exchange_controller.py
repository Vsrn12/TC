from fastapi import APIRouter
from app.services.exchange_rate_service import ExchangeRateService

router = APIRouter(prefix="/api/tipo-cambio", tags=["Tipo de cambio"])

_exchange_rate_service = ExchangeRateService(moneda_origen="USD", moneda_destino="PEN")


@router.get("", status_code=200)
def obtener_tipo_cambio() -> dict:
    """Capa de Presentación: expone el tipo de cambio USD -> PEN obtenido de la API externa Frankfurter."""
    return _exchange_rate_service.obtener_tasa_cambio()
