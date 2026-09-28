import httpx

# Frankfurter (api.frankfurter.app) solo cubre las divisas de referencia del Banco Central
# Europeo y no incluye el sol peruano (PEN), así que se usa Open Exchange Rates (open.er-api.com):
# es gratuita, no requiere API key y sí publica la tasa USD -> PEN.
EXCHANGE_RATE_URL = "https://open.er-api.com/v6/latest/{moneda_origen}"

# Tipo de cambio de respaldo (soles por 1 dólar), usado únicamente si la API externa no responde
# (por ejemplo, sin conexión a internet).
TASA_RESPALDO = 3.75


class ExchangeRateService:
    """Obtiene el tipo de cambio entre dos monedas desde la API externa Open Exchange Rates."""

    def __init__(self, moneda_origen: str = "USD", moneda_destino: str = "PEN") -> None:
        self._moneda_origen = moneda_origen
        self._moneda_destino = moneda_destino

    def obtener_tasa_cambio(self) -> dict:
        try:
            respuesta = httpx.get(
                EXCHANGE_RATE_URL.format(moneda_origen=self._moneda_origen),
                timeout=5.0,
                follow_redirects=True,
            )
            respuesta.raise_for_status()
            datos = respuesta.json()
            return {
                "moneda_origen": self._moneda_origen,
                "moneda_destino": self._moneda_destino,
                "tasa": datos["rates"][self._moneda_destino],
                "fecha": datos["time_last_update_utc"],
                "fuente": "open-er-api",
            }
        except (httpx.HTTPError, KeyError):
            return {
                "moneda_origen": self._moneda_origen,
                "moneda_destino": self._moneda_destino,
                "tasa": TASA_RESPALDO,
                "fecha": None,
                "fuente": "respaldo",
            }
