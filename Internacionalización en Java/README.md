# Cuestionario internacionalizado en Java

Aplicación web desarrollada con **Java**, **Spring Boot**, **Spring MVC** y **Thymeleaf**. Muestra un cuestionario de tres preguntas y cambia el idioma mediante el parámetro `lang` de la URL.

**Autor:** Piero Adrian Delgado Chipana

## Funcionalidad

- Muestra tres preguntas: nombre, edad y ciudad.
- Permite responderlas mediante un formulario.
- Incluye traducciones en español e inglés.
- Cambia el idioma con `?lang=es` o `?lang=en`.
- Muestra la fecha actual en la esquina del formulario: `dd/MM/yyyy` en español y `MM/dd/yyyy` en inglés de Estados Unidos.
- Conserva el idioma seleccionado en una cookie durante la navegación.

## Estructura del proyecto

```text
Internacionalización en Java/
├── src/
│   ├── main/
│   │   ├── java/com/example/demo/
│   │   │   ├── DemoApplication.java       # Punto de entrada
│   │   │   ├── HomeController.java        # Rutas del cuestionario
│   │   │   └── MvcConfigurer.java         # Configuración de idioma
│   │   └── resources/
│   │       ├── templates/home.html        # Formulario
│   │       ├── messages.properties        # Inglés
│   │       └── messages_es.properties     # Español
│   └── test/                              # Pruebas del contexto
├── pom.xml
├── mvnw
└── mvnw.cmd
```

## Requisitos

- JDK 8 o superior.
- Maven 3.5 o superior, opcional si se utiliza el Maven Wrapper incluido.

## Cómo ejecutar

Abre una terminal en esta carpeta:

```bash
cd "Internacionalización en Java"
```

### Windows

```powershell
./mvnw.cmd spring-boot:run
```

### Linux o macOS

```bash
./mvnw spring-boot:run
```

También se puede ejecutar con Maven instalado:

```bash
mvn spring-boot:run
```

La aplicación quedará disponible en `http://localhost:8080`.

## Seleccionar el idioma

Idioma predeterminado, inglés:

```text
http://localhost:8080/?lang=en
```

Español:

```text
http://localhost:8080/?lang=es
```

El parámetro `lang` es procesado por `LocaleChangeInterceptor` y el idioma se conserva en una cookie. Si no se especifica, se utiliza el idioma predeterminado en inglés.

## Ejecutar las pruebas

Windows:

```powershell
./mvnw.cmd test
```

Linux o macOS:

```bash
./mvnw test
```
