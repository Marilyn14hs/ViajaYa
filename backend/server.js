const express = require('express');
const cors = require('cors');
const pool = require('./database');
const {
    crearReservacion,
    cambiarFechaReservacion,
    cancelarReservacion
} = require('./services/reservacionesService');
require('dotenv').config();

const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { timingSafeEqual } = require('crypto');
const verificarAdmin = require('./middleware/authAdmin');

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración del servidor
app.use(cors());
app.use(express.json());

// Ruta para comprobar que el servidor funciona
app.get('/api', (req, res) => {
    res.json({
        mensaje: '¡Bienvenido al servidor de ViajaYa!',
        estado: 'Funcionando correctamente'
    });
});

// Ruta para obtener los destinos turísticos activos
app.get('/api/destinos', async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT
                id,
                nombre,
                descripcion,
                ubicacion,
                precio_base,
                capacidad_diaria,
                imagen_url
             FROM destinos
             WHERE activo = TRUE
             ORDER BY id ASC`
        );

        res.json(resultado.rows);

    } catch (error) {
        console.error('Error al obtener destinos:', error.message);

        res.status(500).json({
            mensaje: 'No se pudieron obtener los destinos turísticos'
        });
    }
});

// Buscar destinos disponibles según fecha y cantidad de personas
app.get('/api/destinos/disponibles', async (req, res) => {
    try {
        const { fecha, personas } = req.query;

        // Validar que se envíen los datos necesarios
        if (!fecha || !personas) {
            return res.status(400).json({
                mensaje: 'Debes indicar una fecha y la cantidad de personas'
            });
        }

        // Validar formato y existencia de la fecha
        const fechaValida =
            /^\d{4}-\d{2}-\d{2}$/.test(fecha) &&
            !Number.isNaN(Date.parse(`${fecha}T00:00:00Z`)) &&
            new Date(`${fecha}T00:00:00Z`).toISOString().slice(0, 10) === fecha;

        if (!fechaValida) {
            return res.status(400).json({
                mensaje: 'La fecha no es válida'
            });
        }

        // Validar cantidad de personas
        const cantidad = Number(personas);

        if (!Number.isSafeInteger(cantidad) || cantidad <= 0) {
            return res.status(400).json({
                mensaje: 'La cantidad de personas debe ser un número entero positivo'
            });
        }

        // Consultar disponibilidad real en PostgreSQL
        const resultado = await pool.query(
            `SELECT
                d.id,
                d.nombre,
                d.descripcion,
                d.ubicacion,
                d.precio_base,
                d.capacidad_diaria,
                d.imagen_url,
                d.capacidad_diaria - COALESCE(SUM(
                    CASE
                        WHEN r.estado = 'Confirmada'
                         AND p.estado = 'Aprobado'
                         AND r.eliminada = FALSE
                        THEN r.cantidad_personas
                        ELSE 0
                    END
                ), 0) AS espacios_disponibles
             FROM destinos d
             LEFT JOIN reservaciones r
                ON r.destino_id = d.id
               AND r.fecha_excursion = $1
             LEFT JOIN pagos p
                ON p.reservacion_id = r.id
             WHERE d.activo = TRUE
             GROUP BY d.id
             HAVING d.capacidad_diaria - COALESCE(SUM(
                 CASE
                     WHEN r.estado = 'Confirmada'
                      AND p.estado = 'Aprobado'
                      AND r.eliminada = FALSE
                     THEN r.cantidad_personas
                     ELSE 0
                 END
             ), 0) >= $2
             ORDER BY d.id ASC`,
            [fecha, cantidad]
        );

        res.json(resultado.rows);

    } catch (error) {
        console.error('Error al buscar destinos:', error.message);

        res.status(500).json({
            mensaje: 'No se pudo realizar la búsqueda de destinos'
        });
    }
});
// Cotizar una experiencia turística
app.post('/api/cotizaciones', async (req, res) => {
    try {
        const { destino_id, personas } = req.body;

        const idDestino = Number(destino_id);
        const cantidad = Number(personas);

        // Validar los datos recibidos
        if (
            !Number.isSafeInteger(idDestino) ||
            idDestino <= 0 ||
            !Number.isSafeInteger(cantidad) ||
            cantidad <= 0
        ) {
            return res.status(400).json({
                mensaje: 'Debes indicar un destino y una cantidad válida de personas'
            });
        }

        // Obtener el precio directamente desde PostgreSQL
        const resultado = await pool.query(
            `SELECT id, nombre, precio_base
             FROM destinos
             WHERE id = $1 AND activo = TRUE`,
            [idDestino]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'El destino no existe o no está disponible'
            });
        }

        const destino = resultado.rows[0];

        // Calcular los montos en céntimos para evitar errores de redondeo
        const precioCentimos = Math.round(Number(destino.precio_base) * 100);
        const subtotalCentimos = precioCentimos * cantidad;
        const ivaCentimos = Math.round(subtotalCentimos * 0.13);
        const totalCentimos = subtotalCentimos + ivaCentimos;

        res.json({
            destino_id: destino.id,
            destino: destino.nombre,
            personas: cantidad,
            precio_unitario: (precioCentimos / 100).toFixed(2),
            subtotal: (subtotalCentimos / 100).toFixed(2),
            iva: (ivaCentimos / 100).toFixed(2),
            total: (totalCentimos / 100).toFixed(2)
        });

    } catch (error) {
        console.error('Error al calcular cotización:', error.message);

        res.status(500).json({
            mensaje: 'No se pudo calcular la cotización'
        });
    }
});
// RF-03: Crear una reservación con pago simulado
app.post('/api/reservaciones', async (req, res) => {
    try {
        const resultado = await crearReservacion(req.body);

        res.status(201).json({
            mensaje:
                resultado.estado_pago === 'Aprobado'
                    ? 'Reservación confirmada correctamente'
                    : 'El pago fue rechazado. La reservación no fue confirmada',
            reservacion: resultado
        });

    } catch (error) {
        console.error('Error al crear reservación:', error.message);

        const mensajesValidacion = [
            'El destino o la cantidad de personas no es válida',
            'Debes ingresar un nombre válido',
            'Debes ingresar un correo electrónico válido',
            'La fecha o la hora de la excursión no es válida',
            'La excursión debe programarse para una fecha y hora futuras',
            'El último dígito de la tarjeta debe estar entre 0 y 9',
            'El destino no existe o no está disponible'
        ];

        const esErrorValidacion =
            mensajesValidacion.includes(error.message) ||
            error.message.startsWith('No hay suficientes espacios.');

        res.status(esErrorValidacion ? 400 : 500).json({
            mensaje: esErrorValidacion
                ? error.message
                : 'No se pudo procesar la reservación'
        });
    }
});
// RF-04: Consultar una reservación por código y correo
app.get('/api/reservaciones/consultar', async (req, res) => {
    try {
        const { codigo, correo } = req.query;

        // Validar que se ingresaron ambos datos
        if (
            typeof codigo !== 'string' ||
            typeof correo !== 'string' ||
            !codigo.trim() ||
            !correo.trim()
        ) {
            return res.status(400).json({
                mensaje: 'Debes ingresar el código de confirmación y el correo electrónico'
            });
        }

        // Buscar la reservación y su pago
        const resultado = await pool.query(
            `SELECT
                r.codigo_confirmacion,
                r.nombre_cliente,
                r.correo_cliente,
                r.fecha_excursion,
                r.hora_excursion,
                r.cantidad_personas,
                r.subtotal,
                r.iva,
                r.total,
                r.estado AS estado_reservacion,
                p.estado AS estado_pago,
                d.nombre AS destino,
                d.ubicacion
             FROM reservaciones r
             INNER JOIN destinos d ON d.id = r.destino_id
             INNER JOIN pagos p ON p.reservacion_id = r.id
             WHERE r.codigo_confirmacion = $1
               AND LOWER(r.correo_cliente) = LOWER($2)
               AND r.eliminada = FALSE`,
            [
                codigo.trim().toUpperCase(),
                correo.trim()
            ]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                mensaje: 'No se encontró una reservación con ese código y correo electrónico'
            });
        }

        res.json({
            mensaje: 'Reservación encontrada correctamente',
            reservacion: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al consultar reservación:', error);

        res.status(500).json({
            mensaje: 'No se pudo consultar la reservación'
        });
    }
});
// RF-05: Cambiar la fecha de una reservación
app.patch('/api/reservaciones/cambiar-fecha', async (req, res) => {
    try {
        const resultado = await cambiarFechaReservacion(req.body);

        res.json({
            mensaje: 'La fecha de la reservación se modificó correctamente',
            reservacion: resultado
        });

    } catch (error) {
        console.error('Error al cambiar fecha:', error.message);

        const mensajesValidacion = [
            'Debes indicar el código y el correo electrónico',
            'La nueva fecha no es válida',
            'No se encontró la reservación',
            'Solo se pueden modificar reservaciones confirmadas',
            'Solo puedes modificar la reservación con más de 48 horas de anticipación',
            'La nueva fecha debe ser diferente a la actual',
            'La nueva fecha debe ser futura',
            'El destino ya no está disponible'
        ];

        const esErrorValidacion =
            mensajesValidacion.includes(error.message) ||
            error.message.startsWith('No hay suficientes espacios');

        res.status(esErrorValidacion ? 400 : 500).json({
            mensaje: esErrorValidacion
                ? error.message
                : 'No se pudo modificar la fecha de la reservación'
        });
    }
});
// RF-06: Cancelar una reservación
app.patch('/api/reservaciones/cancelar', async (req, res) => {
    try {
        const resultado = await cancelarReservacion(req.body);

        res.json({
            mensaje: 'La reservación se canceló correctamente',
            reservacion: resultado
        });

    } catch (error) {
        console.error(
            'Error al cancelar reservación:',
            error.message
        );

        const mensajesValidacion = [
            'Debes indicar el código y el correo electrónico',
            'No se encontró la reservación',
            'Solo se pueden cancelar reservaciones confirmadas',
            'Solo puedes cancelar la reservación con más de 48 horas de anticipación'
        ];

        const esErrorValidacion =
            mensajesValidacion.includes(error.message);

        res.status(esErrorValidacion ? 400 : 500).json({
            mensaje: esErrorValidacion
                ? error.message
                : 'No se pudo cancelar la reservación'
        });
    }
});
// Limitar los intentos de inicio de sesión
const limitarIntentosAdmin = rateLimit({
    windowMs: 2 * 60 * 1000,
    limit: 5,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: {
        mensaje: 'Demasiados intentos. Intenta nuevamente en 2 minutos'
    }
});

// Comparar dos textos sin revelar diferencias de tiempo
function compararSeguro(valorIngresado, valorEsperado) {
    const primero = Buffer.from(String(valorIngresado));
    const segundo = Buffer.from(String(valorEsperado));

    if (primero.length !== segundo.length) {
        return false;
    }

    return timingSafeEqual(primero, segundo);
}

// Inicio de sesión del administrador

app.post(
    '/api/admin/login',
    ...(process.env.NODE_ENV === 'production' ? [limitarIntentosAdmin] : []),
    (req, res) => {


        const { usuario, clave } = req.body || {};

        const usuarioCorrecto = process.env.ADMIN_USUARIO;
        const claveCorrecta = process.env.ADMIN_CLAVE;
        const secreto = process.env.JWT_SECRETO;

        if (!usuarioCorrecto || !claveCorrecta || !secreto) {
            console.error('Faltan variables de configuración del administrador');

            return res.status(500).json({
                mensaje: 'El acceso administrativo no está configurado'
            });
        }

        if (typeof usuario !== 'string' || typeof clave !== 'string') {
            return res.status(400).json({
                mensaje: 'Debes ingresar usuario y contraseña'
            });
        }

        const credencialesValidas =
            compararSeguro(usuario, usuarioCorrecto) &&
            compararSeguro(clave, claveCorrecta);

        if (!credencialesValidas) {
            return res.status(401).json({
                mensaje: 'Usuario o contraseña incorrectos'
            });
        }

        const token = jwt.sign(
            {
                rol: 'admin',
                usuario: usuarioCorrecto
            },
            secreto,
            {
                expiresIn: '2h',
                algorithm: 'HS256'
            }
        );

        res.json({
            mensaje: 'Inicio de sesión exitoso',
            token,
            usuario: usuarioCorrecto
        });
    });

// Comprobar que la sesión del administrador sigue siendo válida
app.get('/api/admin/verificar', verificarAdmin, (req, res) => {
    res.json({
        mensaje: 'Sesión de administrador válida',
        usuario: req.admin.usuario
    });
});
// RF-07: Consultar todos los destinos desde administración
app.get('/api/admin/destinos', verificarAdmin, async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT
                id,
                nombre,
                descripcion,
                ubicacion,
                precio_base,
                capacidad_diaria,
                imagen_url,
                activo,
                fecha_creacion
             FROM destinos
             ORDER BY id ASC`
        );

        res.json({
            mensaje: 'Destinos obtenidos correctamente',
            destinos: resultado.rows
        });

    } catch (error) {
        console.error(
            'Error al consultar destinos administrativos:',
            error.message
        );

        res.status(500).json({
            mensaje: 'No se pudieron obtener los destinos'
        });
    }
});

// RF-07: Agregar un nuevo destino turístico
app.post('/api/admin/destinos', verificarAdmin, async (req, res) => {
    try {
        const {
            nombre,
            descripcion,
            ubicacion,
            precio_base,
            capacidad_diaria,
            imagen_url
        } = req.body || {};

        // Validar nombre y ubicación
        if (
            typeof nombre !== 'string' ||
            !nombre.trim() ||
            nombre.trim().length > 150 ||
            typeof ubicacion !== 'string' ||
            !ubicacion.trim() ||
            ubicacion.trim().length > 200
        ) {
            return res.status(400).json({
                mensaje: 'Debes ingresar un nombre y una ubicación válidos'
            });
        }

        // Validar precio
        const precio = Number(precio_base);

        if (
            precio_base === '' ||
            precio_base === null ||
            precio_base === undefined ||
            !Number.isFinite(precio) ||
            precio < 0
        ) {
            return res.status(400).json({
                mensaje: 'El precio debe ser un número mayor o igual a cero'
            });
        }

        // Validar capacidad
        const capacidad = Number(capacidad_diaria);

        if (
            capacidad_diaria === '' ||
            capacidad_diaria === null ||
            capacidad_diaria === undefined ||
            !Number.isSafeInteger(capacidad) ||
            capacidad <= 0
        ) {
            return res.status(400).json({
                mensaje: 'La capacidad debe ser un número entero mayor que cero'
            });
        }

        // Validar campos opcionales
        if (
            descripcion !== undefined &&
            descripcion !== null &&
            typeof descripcion !== 'string'
        ) {
            return res.status(400).json({
                mensaje: 'La descripción no es válida'
            });
        }

        if (
            imagen_url !== undefined &&
            imagen_url !== null &&
            typeof imagen_url !== 'string'
        ) {
            return res.status(400).json({
                mensaje: 'La URL de imagen no es válida'
            });
        }

        // Guardar el destino en Supabase
        const resultado = await pool.query(
            `INSERT INTO destinos (
                nombre,
                descripcion,
                ubicacion,
                precio_base,
                capacidad_diaria,
                imagen_url,
                activo
            )
            VALUES ($1, $2, $3, $4, $5, $6, TRUE)
            RETURNING
                id,
                nombre,
                descripcion,
                ubicacion,
                precio_base,
                capacidad_diaria,
                imagen_url,
                activo`,
            [
                nombre.trim(),
                typeof descripcion === 'string'
                    ? descripcion.trim()
                    : '',
                ubicacion.trim(),
                precio,
                capacidad,
                typeof imagen_url === 'string' && imagen_url.trim()
                    ? imagen_url.trim()
                    : null
            ]
        );

        res.status(201).json({
            mensaje: 'Destino turístico agregado correctamente',
            destino: resultado.rows[0]
        });

    } catch (error) {
        console.error('Error al agregar destino:', error.message);

        res.status(500).json({
            mensaje: 'No se pudo agregar el destino turístico'
        });
    }
});

// RF-07: Editar un destino turístico desde administración
app.patch('/api/admin/destinos/:id', verificarAdmin, async (req, res) => {
    const cliente = await pool.connect();

    try {
        const id = Number(req.params.id);

        const {
            nombre,
            descripcion,
            ubicacion,
            precio_base,
            capacidad_diaria,
            imagen_url
        } = req.body || {};

        // Validar identificador
        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: 'El identificador del destino no es válido'
            });
        }

        // Validar nombre y ubicación
        if (
            typeof nombre !== 'string' ||
            !nombre.trim() ||
            nombre.trim().length > 150 ||
            typeof ubicacion !== 'string' ||
            !ubicacion.trim() ||
            ubicacion.trim().length > 200
        ) {
            return res.status(400).json({
                mensaje: 'Debes ingresar un nombre y una ubicación válidos'
            });
        }

        const precio = Number(precio_base);
        const capacidad = Number(capacidad_diaria);

        // Validar precio
        if (
            precio_base === '' ||
            precio_base === null ||
            precio_base === undefined ||
            !Number.isFinite(precio) ||
            precio < 0
        ) {
            return res.status(400).json({
                mensaje: 'El precio debe ser un número mayor o igual a cero'
            });
        }

        // Validar capacidad
        if (
            capacidad_diaria === '' ||
            capacidad_diaria === null ||
            capacidad_diaria === undefined ||
            !Number.isSafeInteger(capacidad) ||
            capacidad <= 0
        ) {
            return res.status(400).json({
                mensaje: 'La capacidad debe ser un número entero mayor que cero'
            });
        }

        // Validar campos opcionales
        if (
            descripcion !== undefined &&
            descripcion !== null &&
            typeof descripcion !== 'string'
        ) {
            return res.status(400).json({
                mensaje: 'La descripción no es válida'
            });
        }

        if (
            imagen_url !== undefined &&
            imagen_url !== null &&
            typeof imagen_url !== 'string'
        ) {
            return res.status(400).json({
                mensaje: 'La URL de imagen no es válida'
            });
        }

        await cliente.query('BEGIN');

        // Bloquear el destino mientras se actualiza
        const destinoActual = await cliente.query(
            `SELECT id
             FROM destinos
             WHERE id = $1
             FOR UPDATE`,
            [id]
        );

        if (destinoActual.rows.length === 0) {
            await cliente.query('ROLLBACK');

            return res.status(404).json({
                mensaje: 'El destino turístico no existe'
            });
        }

        // Calcular la mayor ocupación registrada en un día
        const ocupacion = await cliente.query(
            `SELECT COALESCE(MAX(personas_reservadas), 0) AS maximo_ocupado
             FROM (
                 SELECT
                     r.fecha_excursion,
                     SUM(r.cantidad_personas) AS personas_reservadas
                 FROM reservaciones r
                 INNER JOIN pagos p
                     ON p.reservacion_id = r.id
                 WHERE r.destino_id = $1
                   AND r.estado = 'Confirmada'
                   AND p.estado = 'Aprobado'
                   AND r.eliminada = FALSE
                 GROUP BY r.fecha_excursion
             ) AS ocupacion_diaria`,
            [id]
        );

        const maximoOcupado = Number(
            ocupacion.rows[0].maximo_ocupado
        );

        // Evitar reducir la capacidad por debajo de las reservas existentes
        if (capacidad < maximoOcupado) {
            await cliente.query('ROLLBACK');

            return res.status(400).json({
                mensaje:
                    `No puedes establecer una capacidad de ${capacidad} personas. ` +
                    `Ya existen días con ${maximoOcupado} personas reservadas.`
            });
        }

        // Actualizar el destino
        const resultado = await cliente.query(
            `UPDATE destinos
             SET
                 nombre = $1,
                 descripcion = $2,
                 ubicacion = $3,
                 precio_base = $4,
                 capacidad_diaria = $5,
                 imagen_url = $6
             WHERE id = $7
             RETURNING
                 id,
                 nombre,
                 descripcion,
                 ubicacion,
                 precio_base,
                 capacidad_diaria,
                 imagen_url,
                 activo`,
            [
                nombre.trim(),
                typeof descripcion === 'string'
                    ? descripcion.trim()
                    : '',
                ubicacion.trim(),
                precio,
                capacidad,
                typeof imagen_url === 'string' && imagen_url.trim()
                    ? imagen_url.trim()
                    : null,
                id
            ]
        );

        await cliente.query('COMMIT');

        res.json({
            mensaje: 'Destino turístico actualizado correctamente',
            destino: resultado.rows[0]
        });

    } catch (error) {
        await cliente.query('ROLLBACK');

        console.error(
            'Error al actualizar destino:',
            error.message
        );

        res.status(500).json({
            mensaje: 'No se pudo actualizar el destino turístico'
        });

    } finally {
        cliente.release();
    }
});

// RF-07: Activar o desactivar destinos turísticos
app.patch('/api/admin/destinos/:id/estado', verificarAdmin, async (req, res) => {
    const cliente = await pool.connect();

    try {
        const id = Number(req.params.id);
        const { activo } = req.body || {};

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: 'El identificador del destino no es válido'
            });
        }

        if (typeof activo !== 'boolean') {
            return res.status(400).json({
                mensaje: 'El estado debe ser verdadero o falso'
            });
        }

        await cliente.query('BEGIN');

        const resultado = await cliente.query(
            `UPDATE destinos
       SET activo = $1
       WHERE id = $2
       RETURNING id, nombre, activo`,
            [activo, id]
        );

        if (resultado.rows.length === 0) {
            await cliente.query('ROLLBACK');

            return res.status(404).json({
                mensaje: 'El destino turístico no existe'
            });
        }

        await cliente.query('COMMIT');

        res.json({
            mensaje: activo
                ? 'Destino turístico activado correctamente'
                : 'Destino turístico desactivado correctamente',
            destino: resultado.rows[0]
        });

    } catch (error) {
        await cliente.query('ROLLBACK');

        console.error('Error al cambiar estado del destino:', error.message);

        res.status(500).json({
            mensaje: 'No se pudo cambiar el estado del destino'
        });

    } finally {
        cliente.release();
    }
});

// RF-08: Consultar todas las reservaciones desde administración
app.get('/api/admin/reservaciones', verificarAdmin, async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT
          r.id,
          r.codigo_confirmacion,
          r.nombre_cliente,
          r.correo_cliente,
          r.fecha_excursion,
          r.hora_excursion,
          r.cantidad_personas,
          r.subtotal,
          r.iva,
          r.total,
          r.estado,
          r.eliminada,
          r.fecha_creacion,
          d.nombre AS nombre_destino,
          p.estado AS estado_pago
       FROM reservaciones r
       INNER JOIN destinos d
         ON d.id = r.destino_id
       LEFT JOIN pagos p
         ON p.reservacion_id = r.id
       ORDER BY r.fecha_creacion DESC, r.id DESC`
        );

        res.json({
            mensaje: 'Reservaciones obtenidas correctamente',
            reservaciones: resultado.rows
        });

    } catch (error) {
        console.error(
            'Error al consultar reservaciones administrativas:',
            error.message
        );

        res.status(500).json({
            mensaje: 'No se pudieron obtener las reservaciones'
        });
    }
});

// RF-08: Cancelar una reservación desde administración
app.patch(
    '/api/admin/reservaciones/:id/cancelar',
    verificarAdmin,
    async (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: 'El identificador de la reservación no es válido'
            });
        }

        let cliente;

        try {
            cliente = await pool.connect();

            await cliente.query('BEGIN');

            const resultado = await cliente.query(
                `UPDATE reservaciones
         SET estado = 'Cancelada',
             fecha_actualizacion = NOW()
         WHERE id = $1
           AND estado = 'Confirmada'
           AND eliminada = FALSE
         RETURNING id, codigo_confirmacion, estado`,
                [id]
            );

            if (resultado.rows.length === 0) {
                await cliente.query('ROLLBACK');

                return res.status(400).json({
                    mensaje: 'La reservación no existe, está eliminada o ya no está confirmada'
                });
            }

            await cliente.query('COMMIT');

            res.json({
                mensaje: 'Reservación cancelada correctamente',
                reservacion: resultado.rows[0]
            });

        } catch (error) {
            if (cliente) {
                await cliente.query('ROLLBACK');
            }

            console.error(
                'Error al cancelar reservación administrativa:',
                error.message
            );

            res.status(500).json({
                mensaje: 'No se pudo cancelar la reservación'
            });

        } finally {
            if (cliente) {
                cliente.release();
            }
        }
    }
);

// RF-08: Eliminar lógicamente una reservación
app.patch(
    '/api/admin/reservaciones/:id/eliminar',
    verificarAdmin,
    async (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: 'El identificador de la reservación no es válido'
            });
        }

        try {
            const resultado = await pool.query(
                `UPDATE reservaciones
         SET eliminada = TRUE,
             fecha_actualizacion = NOW()
         WHERE id = $1
           AND estado = 'Cancelada'
           AND eliminada = FALSE
         RETURNING id, codigo_confirmacion, estado, eliminada`,
                [id]
            );

            if (resultado.rows.length === 0) {
                return res.status(400).json({
                    mensaje: 'La reservación no existe, ya fue eliminada o todavía no está cancelada'
                });
            }

            res.json({
                mensaje: 'Reservación eliminada lógicamente correctamente',
                reservacion: resultado.rows[0]
            });

        } catch (error) {
            console.error(
                'Error al eliminar reservación:',
                error.message
            );

            res.status(500).json({
                mensaje: 'No se pudo eliminar la reservación'
            });
        }
    }
);

// RF-08: Aprobar reservaciones pendientes desde administración
app.patch(
    '/api/admin/reservaciones/:id/aprobar',
    verificarAdmin,
    async (req, res) => {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: 'El identificador de la reservación no es válido'
            });
        }

        let cliente;

        try {
            cliente = await pool.connect();
            await cliente.query('BEGIN');

            // Consultar los datos necesarios de la reservación
            const consulta = await cliente.query(
                `SELECT destino_id, fecha_excursion, cantidad_personas
         FROM reservaciones
         WHERE id = $1`,
                [id]
            );

            if (consulta.rows.length === 0) {
                await cliente.query('ROLLBACK');
                return res.status(404).json({
                    mensaje: 'La reservación no existe'
                });
            }

            const reserva = consulta.rows[0];

            // Bloquear el destino para evitar sobreventas
            const destinoResultado = await cliente.query(
                `SELECT capacidad_diaria
         FROM destinos
         WHERE id = $1
         FOR UPDATE`,
                [reserva.destino_id]
            );

            if (destinoResultado.rows.length === 0) {
                await cliente.query('ROLLBACK');
                return res.status(404).json({
                    mensaje: 'El destino no existe'
                });
            }

            // Bloquear y verificar nuevamente la reservación y el pago
            const reservaResultado = await cliente.query(
                `SELECT r.id, r.estado, r.eliminada,
                r.destino_id, r.fecha_excursion,
                r.cantidad_personas, p.estado AS estado_pago
         FROM reservaciones r
         INNER JOIN pagos p ON p.reservacion_id = r.id
         WHERE r.id = $1
         FOR UPDATE OF r, p`,
                [id]
            );

            const pendiente = reservaResultado.rows[0];

            if (
                !pendiente ||
                pendiente.estado !== 'Pendiente' ||
                pendiente.eliminada ||
                pendiente.estado_pago !== 'Aprobado' ||
                Number(pendiente.destino_id) !== Number(reserva.destino_id)
            ) {
                await cliente.query('ROLLBACK');
                return res.status(400).json({
                    mensaje: 'Solo se pueden aprobar reservaciones pendientes, no eliminadas y con pago aprobado'
                });
            }

            // Comprobar la capacidad disponible
            const ocupacionResultado = await cliente.query(
                `SELECT COALESCE(SUM(r.cantidad_personas), 0) AS ocupados
         FROM reservaciones r
         INNER JOIN pagos p ON p.reservacion_id = r.id
         WHERE r.destino_id = $1
           AND r.fecha_excursion = $2
           AND r.estado = 'Confirmada'
           AND r.eliminada = FALSE
           AND p.estado = 'Aprobado'`,
                [pendiente.destino_id, pendiente.fecha_excursion]
            );

            const ocupados = Number(ocupacionResultado.rows[0].ocupados);
            const capacidad = Number(destinoResultado.rows[0].capacidad_diaria);

            if (ocupados + Number(pendiente.cantidad_personas) > capacidad) {
                await cliente.query('ROLLBACK');
                return res.status(400).json({
                    mensaje: 'No hay suficientes espacios disponibles para aprobar esta reservación'
                });
            }

            // Confirmar la reservación
            const resultado = await cliente.query(
                `UPDATE reservaciones
         SET estado = 'Confirmada',
             fecha_actualizacion = NOW()
         WHERE id = $1
         RETURNING id, codigo_confirmacion, estado`,
                [id]
            );

            await cliente.query('COMMIT');

            res.json({
                mensaje: 'Reservación aprobada correctamente',
                reservacion: resultado.rows[0]
            });

        } catch (error) {
            if (cliente) {
                await cliente.query('ROLLBACK');
            }

            console.error('Error al aprobar reservación:', error.message);

            res.status(500).json({
                mensaje: 'No se pudo aprobar la reservación'
            });

        } finally {
            if (cliente) {
                cliente.release();
            }
        }
    }
);

// RF-09: Consultar pagos simulados desde administración
app.get('/api/admin/pagos', verificarAdmin, async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT
         p.id,
         p.reservacion_id,
         p.monto,
         p.ultimo_digito_tarjeta,
         p.estado,
         p.fecha_pago,
         p.fecha_creacion,
         r.codigo_confirmacion,
         r.nombre_cliente,
         r.estado AS estado_reservacion,
         r.eliminada,
         d.nombre AS nombre_destino
       FROM pagos p
       INNER JOIN reservaciones r
         ON r.id = p.reservacion_id
       INNER JOIN destinos d
         ON d.id = r.destino_id
       ORDER BY p.fecha_creacion DESC, p.id DESC`
        );

        res.json({
            mensaje: 'Pagos obtenidos correctamente',
            pagos: resultado.rows
        });

    } catch (error) {
        console.error('Error al consultar pagos:', error.message);

        res.status(500).json({
            mensaje: 'No se pudieron consultar los pagos'
        });
    }
});

// RF-09: Cambiar el estado de un pago simulado
app.patch(
    '/api/admin/pagos/:id/estado',
    verificarAdmin,
    async (req, res) => {
        const id = Number(req.params.id);
        const { estado } = req.body;

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                mensaje: 'El identificador del pago no es válido'
            });
        }

        if (!['Pendiente', 'Aprobado', 'Rechazado'].includes(estado)) {
            return res.status(400).json({
                mensaje: 'El estado del pago no es válido'
            });
        }

        let cliente;

        try {
            cliente = await pool.connect();
            await cliente.query('BEGIN');

            // Obtener el destino asociado al pago
            const consulta = await cliente.query(
                `SELECT r.destino_id
         FROM pagos p
         INNER JOIN reservaciones r ON r.id = p.reservacion_id
         WHERE p.id = $1`,
                [id]
            );

            if (consulta.rows.length === 0) {
                await cliente.query('ROLLBACK');
                return res.status(404).json({
                    mensaje: 'El pago no existe'
                });
            }

            // Bloquear el destino para coordinar cambios de capacidad
            const destinoResultado = await cliente.query(
                `SELECT id
         FROM destinos
         WHERE id = $1
         FOR UPDATE`,
                [consulta.rows[0].destino_id]
            );

            if (destinoResultado.rows.length === 0) {
                await cliente.query('ROLLBACK');
                return res.status(404).json({
                    mensaje: 'El destino no existe'
                });
            }

            // Bloquear el pago y su reservación
            const resultado = await cliente.query(
                `SELECT
           p.id,
           p.estado AS estado_pago,
           r.id AS reservacion_id,
           r.estado AS estado_reservacion,
           r.eliminada,
           r.destino_id
         FROM pagos p
         INNER JOIN reservaciones r ON r.id = p.reservacion_id
         WHERE p.id = $1
         FOR UPDATE OF p, r`,
                [id]
            );

            const pago = resultado.rows[0];

            if (!pago || pago.eliminada) {
                await cliente.query('ROLLBACK');
                return res.status(400).json({
                    mensaje: 'No se pueden modificar pagos de reservaciones eliminadas'
                });
            }

            if (Number(pago.destino_id) !== Number(consulta.rows[0].destino_id)) {
                await cliente.query('ROLLBACK');
                return res.status(409).json({
                    mensaje: 'La reservación cambió durante la operación. Intenta nuevamente'
                });
            }

            // No reactivar reservaciones canceladas automáticamente
            if (
                pago.estado_reservacion === 'Cancelada' &&
                estado === 'Aprobado'
            ) {
                await cliente.query('ROLLBACK');
                return res.status(400).json({
                    mensaje: 'No se puede aprobar el pago de una reservación cancelada'
                });
            }

            // Actualizar el estado del pago
            const pagoActualizado = await cliente.query(
                `UPDATE pagos
         SET estado = $1,
             fecha_actualizacion = NOW()
         WHERE id = $2
         RETURNING id, estado`,
                [estado, id]
            );

            // Una reservación confirmada pierde su confirmación
            // si el pago deja de estar aprobado
            if (
                pago.estado_reservacion === 'Confirmada' &&
                estado !== 'Aprobado'
            ) {
                await cliente.query(
                    `UPDATE reservaciones
           SET estado = 'Pendiente',
               fecha_actualizacion = NOW()
           WHERE id = $1`,
                    [pago.reservacion_id]
                );
            }

            await cliente.query('COMMIT');

            res.json({
                mensaje: 'Estado del pago actualizado correctamente',
                pago: pagoActualizado.rows[0]
            });

        } catch (error) {
            if (cliente) {
                await cliente.query('ROLLBACK');
            }

            console.error('Error al cambiar estado del pago:', error.message);

            res.status(500).json({
                mensaje: 'No se pudo actualizar el estado del pago'
            });

        } finally {
            if (cliente) {
                cliente.release();
            }
        }
    }
);


// Iniciar servidor solamente cuando se ejecuta directamente
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Servidor de ViajaYa funcionando en el puerto ${PORT}`);
    });
}

// Permitir que las pruebas utilicen las rutas de Express
module.exports = app;
