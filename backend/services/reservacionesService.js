const { randomBytes } = require('crypto');
const pool = require('../database');

// RN-03: Calcular subtotal, IVA y total de una reservación
function calcularTotal(precioBase, personas) {
    const precioCentimos = Math.round(Number(precioBase) * 100);
    const subtotalCentimos = precioCentimos * Number(personas);
    const ivaCentimos = Math.round(subtotalCentimos * 0.13);
    const totalCentimos = subtotalCentimos + ivaCentimos;

    return {
        subtotal: (subtotalCentimos / 100).toFixed(2),
        iva: (ivaCentimos / 100).toFixed(2),
        total: (totalCentimos / 100).toFixed(2)
    };
}


// RN-01: Verificar que existan suficientes espacios
function hayCupoDisponible(capacidad, ocupados, personas) {
    const disponibles = Number(capacidad) - Number(ocupados);

    return Number(personas) <= disponibles;
}


// RN-02: Verificar que falten más de 48 horas
function permiteModificarOCancelar(fechaHoraExcursion, fechaActual = new Date()) {
    const horasRestantes =
        (new Date(fechaHoraExcursion).getTime() -
            new Date(fechaActual).getTime()) /
        (1000 * 60 * 60);

    return horasRestantes > 48;
}


// RN-04: Simular el resultado del pago
function calcularEstadoPago(ultimoDigito) {
    const digito = Number(ultimoDigito);

    if (
        ultimoDigito === '' ||
        ultimoDigito === null ||
        ultimoDigito === undefined ||
        !Number.isInteger(digito) ||
        digito < 0 ||
        digito > 9
    ) {
        throw new Error('El último dígito de la tarjeta debe estar entre 0 y 9');
    }

    return digito % 2 === 0 ? 'Aprobado' : 'Rechazado';
}

// Generar un código de confirmación aleatorio
function generarCodigoConfirmacion() {
    return `VY-${randomBytes(6).toString('hex').toUpperCase()}`;
}

// Validar una fecha real con formato AAAA-MM-DD
function fechaValida(fecha) {
    if (
        typeof fecha !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(fecha)
    ) {
        return false;
    }

    const fechaConvertida = new Date(`${fecha}T00:00:00Z`);

    return (
        !Number.isNaN(fechaConvertida.getTime()) &&
        fechaConvertida.toISOString().slice(0, 10) === fecha
    );
}

// Validar una hora con formato HH:MM
function horaValida(hora) {
    return (
        typeof hora === 'string' &&
        /^([01]\d|2[0-3]):[0-5]\d$/.test(hora)
    );
}

// RF-03: Crear una reservación en PostgreSQL
async function crearReservacion(datos) {
    const {
        destino_id,
        nombre,
        correo,
        fecha,
        hora,
        personas,
        ultimoDigitoTarjeta
    } = datos;

    const idDestino = Number(destino_id);
    const cantidad = Number(personas);

    // Validar los datos básicos
    if (
        !Number.isSafeInteger(idDestino) ||
        idDestino <= 0 ||
        !Number.isSafeInteger(cantidad) ||
        cantidad <= 0
    ) {
        throw new Error('El destino o la cantidad de personas no es válida');
    }

    if (
        typeof nombre !== 'string' ||
        nombre.trim().length < 2 ||
        nombre.trim().length > 150
    ) {
        throw new Error('Debes ingresar un nombre válido');
    }

    if (
        typeof correo !== 'string' ||
        correo.trim().length > 200 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo.trim())
    ) {
        throw new Error('Debes ingresar un correo electrónico válido');
    }

    if (!fechaValida(fecha) || !horaValida(hora)) {
        throw new Error('La fecha o la hora de la excursión no es válida');
    }

    // Comprobar que la excursión sea futura
    // Costa Rica utiliza UTC-6
    const fechaExcursion = new Date(`${fecha}T${hora}:00-06:00`);

    if (fechaExcursion <= new Date()) {
        throw new Error(
            'La excursión debe programarse para una fecha y hora futuras'
        );
    }

    // RN-04: Determinar el estado del pago
    const estadoPago = calcularEstadoPago(ultimoDigitoTarjeta);

    // Obtener conexión a PostgreSQL
    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');

        // Bloquear el destino para evitar sobreventas
        const destinoResultado = await cliente.query(
            `SELECT
                id,
                nombre,
                precio_base,
                capacidad_diaria
             FROM destinos
             WHERE id = $1
               AND activo = TRUE
             FOR UPDATE`,
            [idDestino]
        );

        if (destinoResultado.rows.length === 0) {
            throw new Error('El destino no existe o no está disponible');
        }

        const destino = destinoResultado.rows[0];

        // Consultar espacios ocupados en la fecha solicitada
        const ocupacionResultado = await cliente.query(
            `SELECT
                COALESCE(SUM(r.cantidad_personas), 0) AS ocupados
             FROM reservaciones r
             INNER JOIN pagos p
                ON p.reservacion_id = r.id
             WHERE r.destino_id = $1
               AND r.fecha_excursion = $2
               AND r.estado = 'Confirmada'
               AND r.eliminada = FALSE
               AND p.estado = 'Aprobado'`,
            [idDestino, fecha]
        );

        const ocupados = Number(ocupacionResultado.rows[0].ocupados);
        const capacidad = Number(destino.capacidad_diaria);
        const disponibles = capacidad - ocupados;

        // RN-01: Comprobar disponibilidad
        if (
            estadoPago === 'Aprobado' &&
            !hayCupoDisponible(capacidad, ocupados, cantidad)
        ) {
            throw new Error(
                `No hay suficientes espacios. Solo quedan ${disponibles} disponibles`
            );
        }


        // RN-03: Calcular subtotal, IVA y total
        const precioUnitario = Number(destino.precio_base).toFixed(2);

        const { subtotal, iva, total } = calcularTotal(
            destino.precio_base,
            cantidad
        );


        // Determinar el estado de la reservación
        const estadoReservacion =
            estadoPago === 'Aprobado'
                ? 'Confirmada'
                : 'Cancelada';

        // Generar código único
        const codigo = generarCodigoConfirmacion();

        // Guardar reservación
        const reservacionResultado = await cliente.query(
            `INSERT INTO reservaciones (
                destino_id,
                codigo_confirmacion,
                nombre_cliente,
                correo_cliente,
                fecha_excursion,
                hora_excursion,
                cantidad_personas,
                precio_unitario,
                subtotal,
                iva,
                total,
                estado
            )
            VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9, $10, $11, $12
            )
            RETURNING
                id,
                codigo_confirmacion,
                estado`,
            [
                idDestino,
                codigo,
                nombre.trim(),
                correo.trim().toLowerCase(),
                fecha,
                hora,
                cantidad,
                precioUnitario,
                subtotal,
                iva,
                total,
                estadoReservacion
            ]
        );

        const reservacion = reservacionResultado.rows[0];

        // Guardar el pago simulado
        await cliente.query(
            `INSERT INTO pagos (
                reservacion_id,
                monto,
                ultimo_digito_tarjeta,
                estado,
                fecha_pago
            )
            VALUES ($1, $2, $3, $4, NOW())`,
            [
                reservacion.id,
                total,
                Number(ultimoDigitoTarjeta),
                estadoPago
            ]
        );

        // Confirmar los cambios
        await cliente.query('COMMIT');

        return {
            codigo_confirmacion: reservacion.codigo_confirmacion,
            destino: destino.nombre,
            fecha,
            hora,
            personas: cantidad,
            subtotal,
            iva,
            total,
            estado_reservacion: estadoReservacion,
            estado_pago: estadoPago
        };

    } catch (error) {
        await cliente.query('ROLLBACK');
        throw error;

    } finally {
        cliente.release();
    }
}

// RF-05: Cambiar la fecha de una reservación
async function cambiarFechaReservacion(datos) {
    const { codigo, correo, nuevaFecha } = datos;

    // Validar código y correo
    if (
        typeof codigo !== 'string' ||
        !codigo.trim() ||
        typeof correo !== 'string' ||
        !correo.trim()
    ) {
        throw new Error(
            'Debes indicar el código y el correo electrónico'
        );
    }

    // Validar la nueva fecha
    if (!fechaValida(nuevaFecha)) {
        throw new Error('La nueva fecha no es válida');
    }

    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');

        // Buscar la reservación y bloquearla
        const resultadoReserva = await cliente.query(
            `SELECT
                r.id,
                r.destino_id,
                r.fecha_excursion::TEXT AS fecha_anterior,
                r.hora_excursion::TEXT AS hora_anterior,
                r.cantidad_personas,
                r.estado,
                p.estado AS estado_pago
             FROM reservaciones r
             INNER JOIN pagos p
                ON p.reservacion_id = r.id
             WHERE r.codigo_confirmacion = $1
               AND LOWER(r.correo_cliente) = LOWER($2)
               AND r.eliminada = FALSE
             FOR UPDATE OF r`,
            [
                codigo.trim().toUpperCase(),
                correo.trim()
            ]
        );

        if (resultadoReserva.rows.length === 0) {
            throw new Error('No se encontró la reservación');
        }

        const reserva = resultadoReserva.rows[0];

        // Solo modificar reservaciones confirmadas
        if (
            reserva.estado !== 'Confirmada' ||
            reserva.estado_pago !== 'Aprobado'
        ) {
            throw new Error(
                'Solo se pueden modificar reservaciones confirmadas'
            );
        }

        // Obtener fecha y hora sin problemas de zona horaria
        const fechaAnteriorTexto = reserva.fecha_anterior;
        const horaAnterior = reserva.hora_anterior.slice(0, 5);

        // Calcular la fecha y hora originales en Costa Rica
        const fechaHoraAnterior = new Date(
            `${fechaAnteriorTexto}T${horaAnterior}:00-06:00`
        );

        // RN-02: Deben faltar más de 48 horas
        const horasRestantes =
            (fechaHoraAnterior.getTime() - Date.now()) /
            (1000 * 60 * 60);

        if (!permiteModificarOCancelar(fechaHoraAnterior)) {
            throw new Error(
                'Solo puedes modificar la reservación con más de 48 horas de anticipación'
            );
        }

        // La nueva fecha debe ser diferente
        if (nuevaFecha === fechaAnteriorTexto) {
            throw new Error(
                'La nueva fecha debe ser diferente a la actual'
            );
        }

        // La nueva fecha también debe ser futura
        const nuevaFechaHora = new Date(
            `${nuevaFecha}T${horaAnterior}:00-06:00`
        );

        if (nuevaFechaHora <= new Date()) {
            throw new Error('La nueva fecha debe ser futura');
        }

        // RN-02: La nueva excursión también debe quedar
        // a más de 48 horas del momento de la solicitud.
        const horasHastaNuevaFecha =
            (nuevaFechaHora.getTime() - Date.now()) /
            (1000 * 60 * 60);

        if (!permiteModificarOCancelar(nuevaFechaHora)) {
            throw new Error(
                'La nueva fecha debe tener más de 48 horas de anticipación'
            );
        }

        // Bloquear el destino para comprobar su capacidad
        const resultadoDestino = await cliente.query(
            `SELECT
                id,
                capacidad_diaria,
                activo
             FROM destinos
             WHERE id = $1
             FOR UPDATE`,
            [reserva.destino_id]
        );

        const destino = resultadoDestino.rows[0];

        if (!destino || !destino.activo) {
            throw new Error('El destino ya no está disponible');
        }

        // Consultar espacios ocupados en la nueva fecha
        const resultadoOcupacion = await cliente.query(
            `SELECT
                COALESCE(SUM(r.cantidad_personas), 0) AS ocupados
             FROM reservaciones r
             INNER JOIN pagos p
                ON p.reservacion_id = r.id
             WHERE r.destino_id = $1
               AND r.fecha_excursion = $2
               AND r.estado = 'Confirmada'
               AND r.eliminada = FALSE
               AND p.estado = 'Aprobado'`,
            [
                reserva.destino_id,
                nuevaFecha
            ]
        );

        const ocupados = Number(resultadoOcupacion.rows[0].ocupados);
        const disponibles =
            Number(destino.capacidad_diaria) - ocupados;

        // RN-01: Evitar superar la capacidad
        if (Number(reserva.cantidad_personas) > disponibles) {
            throw new Error(
                `No hay suficientes espacios en la nueva fecha. Disponibles: ${disponibles}`
            );
        }

        // Actualizar la fecha de la reservación
        await cliente.query(
            `UPDATE reservaciones
             SET fecha_excursion = $1,
                 fecha_actualizacion = NOW()
             WHERE id = $2`,
            [
                nuevaFecha,
                reserva.id
            ]
        );

        // Guardar el cambio
        await cliente.query('COMMIT');

        return {
            codigo_confirmacion: codigo.trim().toUpperCase(),
            fecha_anterior: fechaAnteriorTexto,
            fecha_nueva: nuevaFecha,
            hora: horaAnterior,
            estado: 'Confirmada',
            mensaje:
                'La fecha de la reservación se modificó correctamente'
        };

    } catch (error) {
        await cliente.query('ROLLBACK');
        throw error;

    } finally {
        cliente.release();
    }
}

// RF-06: Cancelar una reservación
async function cancelarReservacion(datos) {
    const { codigo, correo } = datos;

    // Validar los datos
    if (
        typeof codigo !== 'string' ||
        !codigo.trim() ||
        typeof correo !== 'string' ||
        !correo.trim()
    ) {
        throw new Error(
            'Debes indicar el código y el correo electrónico'
        );
    }

    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');

        // Buscar la reservación y bloquearla
        const resultado = await cliente.query(
            `SELECT
                r.id,
                r.codigo_confirmacion,
                r.fecha_excursion::TEXT AS fecha_excursion,
                r.hora_excursion::TEXT AS hora_excursion,
                r.estado,
                p.estado AS estado_pago
             FROM reservaciones r
             INNER JOIN pagos p
                ON p.reservacion_id = r.id
             WHERE r.codigo_confirmacion = $1
               AND LOWER(r.correo_cliente) = LOWER($2)
               AND r.eliminada = FALSE
             FOR UPDATE OF r`,
            [
                codigo.trim().toUpperCase(),
                correo.trim()
            ]
        );

        if (resultado.rows.length === 0) {
            throw new Error('No se encontró la reservación');
        }

        const reserva = resultado.rows[0];

        // Solo cancelar reservaciones confirmadas
        if (
            reserva.estado !== 'Confirmada' ||
            reserva.estado_pago !== 'Aprobado'
        ) {
            throw new Error(
                'Solo se pueden cancelar reservaciones confirmadas'
            );
        }

        // Calcular cuánto tiempo falta para la excursión
        // Utilizamos la zona horaria de Costa Rica (UTC-6)
        const hora = reserva.hora_excursion.slice(0, 5);

        const fechaHoraExcursion = new Date(
            `${reserva.fecha_excursion}T${hora}:00-06:00`
        );

        const horasRestantes =
            (fechaHoraExcursion.getTime() - Date.now()) /
            (1000 * 60 * 60);

        // RN-02: Deben faltar más de 48 horas
        if (!permiteModificarOCancelar(fechaHoraExcursion)) {
            throw new Error(
                'Solo puedes cancelar la reservación con más de 48 horas de anticipación'
            );
        }

        // Cambiar el estado de la reservación
        await cliente.query(
            `UPDATE reservaciones
             SET estado = 'Cancelada',
                 fecha_actualizacion = NOW()
             WHERE id = $1`,
            [reserva.id]
        );

        await cliente.query('COMMIT');

        return {
            codigo_confirmacion: reserva.codigo_confirmacion,
            estado: 'Cancelada',
            mensaje: 'La reservación se canceló correctamente'
        };

    } catch (error) {
        await cliente.query('ROLLBACK');
        throw error;

    } finally {
        cliente.release();
    }
}

// Exportar funciones para utilizarlas en server.js
module.exports = {
    calcularEstadoPago,
    calcularTotal,
    hayCupoDisponible,
    permiteModificarOCancelar,
    crearReservacion,
    cambiarFechaReservacion,
    cancelarReservacion
};

