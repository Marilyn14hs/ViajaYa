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
│   ├── schema.sql
│   ├── reservaciones.test.js
│   └── requisitos-funcionales.test.js
├── frontend/
│   ├── public/
│   └── src/
└── README.md
```

## Ejecución del proyecto

Se requiere tener instalado **Node.js**, **npm** y acceso a una base de datos **PostgreSQL**.

### 1. Preparar la base de datos

El proyecto incluye el archivo `backend/schema.sql`, que contiene la estructura de las tablas:

- `destinos`
- `reservaciones`
- `pagos`

Para realizar una instalación independiente, crear una base de datos PostgreSQL de pruebas y ejecutar allí el archivo `schema.sql`.

**Importante:** no ejecutar este archivo sobre una base de datos que ya contenga información, porque está diseñado para crear las tablas de una instalación nueva.

El archivo contiene la estructura de las tablas, pero no incluye datos iniciales de destinos.

### 2. Configurar las variables de entorno del backend

Dentro de la carpeta `backend`, crear un archivo llamado `.env` con las variables correspondientes a la base de datos de pruebas:

```env
DB_HOST=servidor_postgresql
DB_PORT=5432
DB_NAME=nombre_base_de_datos
DB_USER=usuario_postgresql
DB_PASSWORD=contrasena_postgresql
DB_SSL=false
PORT=3001
NODE_ENV=development
JWT_SECRETO=clave_secreta_de_desarrollo
```

Reemplazar los valores de ejemplo con los datos de la instalación correspondiente. La configuración de `DB_SSL` depende del servidor PostgreSQL utilizado.

**No utilizar las credenciales de producción ni publicar el archivo `.env` en GitHub.**

### 3. Instalar e iniciar el backend

Desde la carpeta principal del proyecto:

```bash
cd backend
npm install
node server.js
```

Con `PORT=3001`, el backend se ejecuta en `http://localhost:3001`.

### 4. Configurar el frontend para desarrollo local

Dentro de la carpeta `frontend`, crear un archivo `.env.local` con el siguiente contenido:

```env
VITE_API_URL=http://localhost:3001
```

Esto permite que el frontend utilice el backend local en lugar del servidor publicado en Render. Reiniciar el servidor de desarrollo de Vite después de modificar este archivo.

### 5. Instalar e iniciar el frontend

Abrir otra terminal y ejecutar, desde la carpeta principal del proyecto:

```bash
cd frontend
npm install
npm run dev
```

El frontend estará disponible normalmente en `http://localhost:5173` (o en el puerto que indique Vite).

### 6. Ejecutar las pruebas automatizadas

El proyecto incluye **17 pruebas automatizadas**, distribuidas en dos archivos:

- `reservaciones.test.js`: 7 pruebas de las reglas de negocio RN-01, RN-02, RN-03 y RN-04.
- `requisitos-funcionales.test.js`: 10 pruebas de validaciones y respuestas de error relacionadas con los requisitos RF-01 al RF-06.

Para ejecutar las pruebas, desde la carpeta principal del proyecto:

```bash
cd backend
npm test
```

**Último resultado verificado:** 17 pruebas aprobadas y 0 fallidas.

Estas pruebas verifican reglas de negocio y validaciones de los requisitos funcionales; no sustituyen las pruebas completas de todos los flujos de usuario.

## Seguridad

Los archivos `.env` y `.env.local` deben mantenerse fuera del repositorio mediante `.gitignore`.

Las credenciales reales, contraseñas y claves secretas no deben compartirse ni incluirse en el código fuente.

El proyecto utiliza pagos simulados para fines académicos y no debe utilizarse para procesar tarjetas bancarias reales.

## Estado del proyecto

Prototipo funcional de ViajaYa, desarrollado para la fase de Construcción de la metodología RUP.

Incluye módulos de clientes y administración, persistencia en PostgreSQL, reglas de negocio y pruebas automatizadas.
