# Viajero API

Base inicial del API en PHP para XAMPP/Apache.

## Configuracion

El API ya no usa `.env`.

Ahora la configuracion vive en archivos PHP:

- `config/app.php`: nombre de app, cookies, CORS y TTL
- `config/database.php`: conexion local por defecto y orden de conexiones
- `config/database.production.php`: credenciales reales de Hostinger, archivo privado no versionado
- `config/database.production.example.php`: plantilla para produccion

## Local

El archivo `config/database.php` usa local primero cuando el host no es productivo:

- host: `127.0.0.1`
- puerto: `3306`
- base de datos: `viajero_cr`
- usuario: `root`
- clave: vacia

## Produccion

Cuando la solicitud llega desde:

- `api.viajerocr.com`
- `send-form.viajerocr.com`

el API intenta primero la conexion de produccion.

Para activarla, crea este archivo privado en el servidor:

`config/database.production.php`

Tomando como base `config/database.production.example.php`.

## Rutas disponibles

- `GET /ViajeroSistem/api/health`
- `GET /ViajeroSistem/api/auth/me`
- `POST /ViajeroSistem/api/auth/login`
- `POST /ViajeroSistem/api/auth/refresh`
- `POST /ViajeroSistem/api/auth/logout`
- `GET /ViajeroSistem/api/test-db.php`

## Estructura

- `index.php`: punto de entrada
- `config/`: configuracion general y conexiones
- `database/`: scripts SQL
- `src/Core/`: utilidades base
- `src/Controllers/`: controladores
