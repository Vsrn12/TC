import uvicorn
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.controllers.product_controller import router as product_router

app = FastAPI(
    title="Sistema de Gestión de Productos",
    description="API REST desarrollada con Arquitectura en N-Capas (3 Capas) aplicando SoC y DIP.",
    version="1.0.0",
)

# Registro de la capa de controladores/rutas
app.include_router(product_router)

# Frontend estático (HTML/CSS/JS) para probar la API sin Postman
app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/", tags=["General"])
def root():
    return FileResponse("static/index.html")


@app.get("/carrito", tags=["General"])
def carrito_page():
    return FileResponse("static/carrito.html")


if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
