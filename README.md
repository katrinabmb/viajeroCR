# Viajero API

Base inicial del API en PHP para XAMPP/Apache.

## Configuracion

El proyecto usa archivo `.env` para entorno local y `.env.example` como referencia para produccion.

Variables principales:

- `DB_HOST`
- `DB_PORT`
- `DB_DATABASE`
- `DB_USERNAME`
- `DB_PASSWORD`
- `ALLOWED_ORIGINS`

## Local actual

Configurado para XAMPP local:

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
