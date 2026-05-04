# Viajero API

Base inicial del API en PHP para XAMPP/Apache.

## Configuracion

El proyecto usa archivo `.env` para entorno local y `.env.example` como referencia para produccion.

Variables principales:

- `PROD_DB_HOST`
- `PROD_DB_PORT`
- `PROD_DB_DATABASE`
- `PROD_DB_USERNAME`
- `PROD_DB_PASSWORD`
- `LOCAL_DB_HOST`
- `LOCAL_DB_PORT`
- `LOCAL_DB_DATABASE`
- `LOCAL_DB_USERNAME`
- `LOCAL_DB_PASSWORD`
- `ALLOWED_ORIGINS`

Ejemplo de origen permitido para dashboard:

- `http://dashboard.viajerocr.com`
- `https://dashboard.viajerocr.com`

## Local actual

Configurado para intentar primero produccion y luego fallback local:

- produccion hostinger:
  - host: `localhost`
  - base de datos: `u768363471_viajerocr`
  - usuario: `u768363471_viajerocr`

- local XAMPP:

- host: `127.0.0.1`
- puerto: `3306`
- base de datos: `viajero_cr`
- usuario: `root`
- clave: vacia

## Rutas disponibles

- `GET /ViajeroSistem/api/health`
- `GET /ViajeroSistem/api/auth/me`
- `POST /ViajeroSistem/api/auth/login`
- `POST /ViajeroSistem/api/auth/logout`

## Estructura

- `index.php`: punto de entrada
- `config/`: configuracion general
- `database/`: scripts SQL
- `src/Core/`: utilidades base
- `src/Controllers/`: controladores
