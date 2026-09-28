import re
from pathlib import Path

import uvicorn
from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from app.controllers.product_controller import router as product_router
from app.controllers.exchange_controller import router as exchange_router

app = FastAPI(
    title="Sistema de Gestión de Productos",
    description="API REST desarrollada con Arquitectura en N-Capas (3 Capas) aplicando SoC y DIP.",
    version="1.0.0",
)


@app.middleware("http")
async def revalidar_frontend(request: Request, call_next):
    # El navegador debe consultar siempre si el HTML/CSS/JS cambió, para no mostrar versiones viejas.
    response = await call_next(request)
    path = request.url.path
    if path in ("/", "/carrito") or path.startswith("/static/"):
        response.headers["Cache-Control"] = "no-cache"
    return response


# Registro de la capa de controladores/rutas
app.include_router(product_router)
app.include_router(exchange_router)

# Frontend estático (HTML/CSS/JS) para probar la API sin Postman
app.mount("/static", StaticFiles(directory="static"), name="static")


STATIC_DIR = Path(__file__).resolve().parent / "static"
_ASSET_REF = re.compile(r'/static/([\w.-]+\.(?:css|js))"')


def _pagina(nombre: str) -> HTMLResponse:
    """Sirve un HTML agregando la fecha de modificación a sus CSS/JS (styles.css?v=...).

    Así, cuando un archivo cambia su URL cambia y el navegador nunca reutiliza una copia vieja.
    """
    html = (STATIC_DIR / nombre).read_text(encoding="utf-8")

    def con_version(match: re.Match) -> str:
        archivo = match.group(1)
        return f'/static/{archivo}?v={int((STATIC_DIR / archivo).stat().st_mtime)}"'

    return HTMLResponse(_ASSET_REF.sub(con_version, html))


@app.get("/", tags=["General"])
def root():
    return _pagina("index.html")


@app.get("/carrito", tags=["General"])
def carrito_page():
    return _pagina("carrito.html")


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
