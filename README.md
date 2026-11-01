# ViajaYa – Sistema de Reservas Turísticas

## Descripción del proyecto

ViajaYa es una aplicación web para la gestión de reservas turísticas en Costa Rica. Permite a los clientes consultar destinos, cotizar excursiones, realizar reservaciones con pagos simulados y administrar sus reservas.

También cuenta con un módulo administrativo para gestionar destinos turísticos, reservaciones y estados de pago.

El proyecto fue desarrollado siguiendo la metodología Rational Unified Process (RUP), como parte de un proyecto académico de ingeniería de software.

## Tecnologías utilizadas

**Frontend**
- React
- Vite
- JavaScript
- HTML y CSS

**Backend**
- Node.js
- Express
- JavaScript

**Base de datos**
- PostgreSQL
- Supabase

**Control de versiones**
- Git y GitHub

## Funcionalidades principales

### Módulo de clientes
- Búsqueda de destinos por fecha y cantidad de personas.
- Cotización automática de excursiones.
- Creación de reservaciones con pago simulado.
- Generación de un código único de confirmación.
- Consulta de reservaciones mediante código y correo electrónico.
- Modificación de fechas.
- Cancelación de reservaciones.

### Módulo de administración
- Creación, edición, listado y desactivación de destinos turísticos.
- Gestión de reservaciones.
- Consulta y modificación de estados de pagos simulados.

## Reglas de negocio

- **RN-01 – Control de cupos:** no se permiten reservas que superen la capacidad diaria del destino.
- **RN-02 – Restricción de 48 horas:** las modificaciones y cancelaciones deben realizarse con más de 48 horas de anticipación.
- **RN-03 – Cálculo de tarifas:** el monto total incluye un 13 % de IVA.
- **RN-04 – Simulación de pagos:** las tarjetas simuladas terminadas en dígito par generan pagos aprobados; las terminadas en dígito impar generan pagos rechazados.

## Estructura del proyecto

```text
ViajaYa/
├── backend/
│   ├── middleware/
│   ├── services/
│   ├── database.js
│   ├── server.js
│   └── reservaciones.test.js
├── frontend/
│   ├── public/
│   └── src/
└── README.md
```

## Ejecución del proyecto

Se requiere tener instalado Node.js y configurar las variables de entorno del backend para conectarse a la base de datos PostgreSQL.

**1. Iniciar el backend**

```bash
cd backend
npm install
node server.js
```

El backend se ejecuta en `http://localhost:3001`.

**2. Iniciar el frontend**

Desde otra terminal:

```bash
cd frontend
npm install
npm run dev
```

El frontend se puede abrir en `http://localhost:5173`.

## Pruebas automatizadas

El proyecto incluye pruebas unitarias automatizadas para verificar las reglas de negocio RN-01, RN-02, RN-03 y RN-04.

Para ejecutarlas:

```bash
cd backend
npm test
```

**Último resultado verificado:** 7 pruebas aprobadas y 0 fallidas.

## Seguridad

Las credenciales y variables de entorno se mantienen fuera del repositorio mediante archivos `.env`, protegidos por `.gitignore`.

## Estado del proyecto

Prototipo funcional desarrollado para la fase de Construcción de la metodología RUP.