# Layered (N-Layer) Architecture

Sistema de gestión de **Productos** desarrollado en Python con **FastAPI**, aplicando una **Arquitectura Web en N-Capas (3 Capas)** y los principios **SoC (Separation of Concerns)** y **DIP (Dependency Inversion Principle)**.

**Autor:** Piero Adrian Delgado Chipana

---

## ¿Qué es la Arquitectura en N-Capas?

Es un patrón de diseño de software que organiza la aplicación en capas horizontales, donde cada capa tiene una única responsabilidad y solo se comunica con la capa inmediatamente adyacente. Esto permite que el sistema sea mantenible, testeable y escalable, ya que los cambios en una capa (por ejemplo, cambiar de almacenamiento en memoria a una base de datos) no afectan a las demás.

En este proyecto se implementan **3 capas** + un módulo transversal de **modelos**:

```
Petición HTTP
     │
     ▼
┌─────────────────────────┐
│  Capa de Presentación   │  app/controllers
│  (Controllers / Routes) │
└───────────┬─────────────┘
            │ invoca
            ▼
┌─────────────────────────┐
│  Capa de Negocio        │  app/services
│  (Services)             │
└───────────┬─────────────┘
            │ invoca (a través de una interfaz)
            ▼
┌─────────────────────────┐
│  Capa de Datos          │  app/repositories
│  (Repositories)         │
└───────────┬─────────────┘
            │ usa
            ▼
┌─────────────────────────┐
│  Modelos / Entidades    │  app/models
└─────────────────────────┘
```

---

## Detalle de cada capa

### 1. Capa de Presentación — `app/controllers/`

- Responsabilidad: recibir las peticiones HTTP (`GET`, `POST`, `PUT`, `DELETE`), extraer parámetros/body, invocar a la capa de negocio y devolver la respuesta en formato JSON con el código de estado adecuado.
- **No contiene** lógica de negocio ni accede directamente a los datos.
- Aquí se resuelve la inyección de dependencias: FastAPI provee el `ProductService` (que a su vez ya trae inyectado el repositorio) usando `Depends`.

### 2. Capa de Negocio — `app/services/`

- Responsabilidad: contener las **reglas de negocio y validaciones** (ej. el precio debe ser mayor a 0, el nombre no puede estar vacío, el ID debe ser positivo).
- Recibe el repositorio por **inyección de dependencias** en su constructor, dependiendo de una **interfaz** (`ProductRepositoryInterface`) y no de una implementación concreta. Esto es el principio **DIP**.
- No sabe cómo ni dónde se guardan los datos, solo delega esa tarea al repositorio.

### 3. Capa de Datos — `app/repositories/` (implementación en memoria).

- Responsabilidad: realizar la interacción con los datos (altas, bajas, consultas, actualizaciones). En este proyecto se usa un diccionario en memoria, pero al depender de una interfaz, podría reemplazarse por una conexión real a base de datos (SQL, MongoDB, etc.) sin modificar las capas superiores.
- **No contiene** validaciones de negocio.

### 4. Modelos — `app/models/`

- Define el esquema de la entidad `Producto` (`id`, `nombre`, `precio`) mediante clases Pydantic (`ProductCreate`, `ProductUpdate`, `ProductResponse`), usadas para validar los datos de entrada/salida en toda la aplicación.

---

## Principios aplicados

- **SoC (Separation of Concerns):** cada capa tiene una única responsabilidad y no se mezclan preocupaciones (HTTP, reglas de negocio y persistencia están completamente separadas).
- **DIP (Dependency Inversion Principle):** las capas de alto nivel (controllers, services) no dependen de implementaciones concretas, sino de abstracciones (`ProductRepositoryInterface`). El repositorio se inyecta en el servicio, y el servicio se inyecta en el controlador mediante el sistema de dependencias de FastAPI (`Depends`).

---

## Estructura del Proyecto

```text
AW/
├── app/
│   ├── models/
│   │   └── product.py             # Entidad Producto
│   ├── repositories/
│   │   ├── base.py                # Interfaz (contrato) del repositorio
│   │   └── product_repository.py  # Implementación en memoria
│   ├── services/
│   │   └── product_service.py     # Reglas de negocio y validaciones
│   └── controllers/
│       └── product_controller.py  # Endpoints HTTP (rutas)
├── static/                        # Frontend básico (HTML/CSS/JS) para probar la API
├── main.py                        # Punto de entrada de la aplicación
├── requirements.txt
└── .gitignore
```

---

## Cómo ejecutar el proyecto

```
python -m venv .venv
source .venv/Scripts/activate
pip install -r requirements.txt
python main.py
```

### 4. Pruebas

- **Frontend:** abre `http://127.0.0.1:8000` en el navegador para gestionar productos desde una interfaz web simple.
- **Documentación interactiva (Swagger):** `http://127.0.0.1:8000/docs`.
- **API REST:** base en `http://127.0.0.1:8000/api/productos`.
