# Viajero API

Base inicial de API en PHP para XAMPP/Apache.

## Rutas disponibles

- `GET /ViajeroSistem/api/health`
- `POST /ViajeroSistem/api/auth/login`

## CORS

El origen permitido actualmente es:

- `http://localhost:5173`

## Estructura

- `index.php`: punto de entrada
- `config/`: configuracion general
- `src/Core/`: utilidades base
- `src/Controllers/`: controladores

## Siguiente paso sugerido

Agregar conexion a base de datos, validacion de peticiones y autenticacion real.
