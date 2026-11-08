
const test = require('node:test');
const assert = require('node:assert/strict');

// Protección para las pruebas que utilizan PostgreSQL
function verificarBaseDePruebas() {
    if (
        process.env.DB_HOST !== 'localhost' ||
        process.env.DB_PORT !== '5433' ||
        process.env.DB_NAME !== 'viajaya_prueba' ||
        process.env.DB_SSL !== 'false'
    ) {
        throw new Error(
            'SEGURIDAD: Las pruebas con base de datos solo pueden ejecutarse en viajaya_prueba local'
        );
    }
}

const {
    crearReservacion,
    calcularTotal
} = require('./services/reservacionesService');

// Prueba funcional 1 - RF-03
test('RF-03: rechaza una reservación con cantidad de personas inválida', async () => {
    await assert.rejects(
        crearReservacion({
            destino_id: 1,
            nombre: 'Cliente Prueba',
            correo: 'prueba@ejemplo.com',
            fecha: '2027-12-15',
            hora: '10:00',
            personas: 0,
            ultimoDigitoTarjeta: 8
        }),
        /El destino o la cantidad de personas no es válida/
    );
});

// Prueba funcional 2 - RF-03
test('RF-03: rechaza una reservación con correo electrónico inválido', async () => {
    await assert.rejects(
        crearReservacion({
            destino_id: 1,
            nombre: 'Cliente Prueba',
            correo: 'correo-invalido',
            fecha: '2027-12-15',
            hora: '10:00',
            personas: 2,
            ultimoDigitoTarjeta: 8
        }),
        /Debes ingresar un correo electrónico válido/
    );
});


const {
    cambiarFechaReservacion
} = require('./services/reservacionesService');

// Prueba funcional 3 - RF-05
test('RF-05: rechaza cambiar fecha sin código de confirmación', async () => {
    await assert.rejects(
        cambiarFechaReservacion({
            codigo: '',
            correo: 'prueba@ejemplo.com',
            nuevaFecha: '2027-12-20'
        }),
        /Debes indicar el código y el correo electrónico/
    );
});

// Prueba funcional 4 - RF-05
test('RF-05: rechaza cambiar fecha con una fecha inválida', async () => {
    await assert.rejects(
        cambiarFechaReservacion({
            codigo: 'VY-PRUEBA123',
            correo: 'prueba@ejemplo.com',
            nuevaFecha: '2027-02-30'
        }),
        /La nueva fecha no es válida/
    );
});

const {
    cancelarReservacion
} = require('./services/reservacionesService');

// Prueba funcional 5 - RF-06
test('RF-06: rechaza cancelar una reservación sin código', async () => {
    await assert.rejects(
        cancelarReservacion({
            codigo: '',
            correo: 'prueba@ejemplo.com'
        }),
        /Debes indicar el código y el correo electrónico/
    );
});

// Prueba funcional 6 - RF-06
test('RF-06: rechaza cancelar una reservación sin correo', async () => {
    await assert.rejects(
        cancelarReservacion({
            codigo: 'VY-PRUEBA123',
            correo: ''
        }),
        /Debes indicar el código y el correo electrónico/
    );
});

const app = require('./server');

// Función auxiliar para probar las rutas sin iniciar otro servidor
async function probarRuta(metodo, ruta) {
    const servidor = app.listen(0);

    try {
        await new Promise((resolve) => {
            if (servidor.listening) return resolve();
            servidor.once('listening', resolve);
        });

        const direccion = servidor.address();
        const respuesta = await fetch(
            `http://127.0.0.1:${direccion.port}${ruta}`,
            { method: metodo }
        );

        return {
            estado: respuesta.status,
            datos: await respuesta.json()
        };
    } finally {
        await new Promise((resolve, reject) => {
            servidor.close((error) => {
                if (error) reject(error);
                else resolve();
            });
        });
    }
}

// Prueba funcional 7 - RF-01
test('RF-01: rechaza búsqueda sin fecha', async () => {
    const resultado = await probarRuta(
        'GET',
        '/api/destinos/disponibles?personas=2'
    );

    assert.equal(resultado.estado, 400);
    assert.match(resultado.datos.mensaje, /Debes indicar una fecha/);
});

// Prueba funcional 8 - RF-01
test('RF-01: rechaza búsqueda con cantidad de personas inválida', async () => {
    const resultado = await probarRuta(
        'GET',
        '/api/destinos/disponibles?fecha=2027-12-15&personas=0'
    );

    assert.equal(resultado.estado, 400);
    assert.match(
        resultado.datos.mensaje,
        /La cantidad de personas debe ser un número entero positivo/
    );
});

// Prueba funcional 9 - RF-02
test('RF-02: rechaza una cotización con cantidad de personas inválida', async () => {
    const servidor = app.listen(0);

    try {
        await new Promise(resolve => {
            if (servidor.listening) return resolve();
            servidor.once('listening', resolve);
        });

        const respuesta = await fetch(
            `http://127.0.0.1:${servidor.address().port}/api/cotizaciones`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    destino_id: 1,
                    personas: 0
                })
            }
        );

        const datos = await respuesta.json();

        assert.equal(respuesta.status, 400);
        assert.match(datos.mensaje, /cantidad válida de personas/);
    } finally {
        await new Promise(resolve => servidor.close(resolve));
    }
});

// Prueba funcional 10 - RF-04
test('RF-04: rechaza consultar una reservación sin código', async () => {
    const resultado = await probarRuta(
        'GET',
        '/api/reservaciones/consultar?correo=prueba@ejemplo.com'
    );

    assert.equal(resultado.estado, 400);
    assert.match(
        resultado.datos.mensaje,
        /Debes ingresar el código de confirmación/
    );
});

// Prueba funcional 11 - RF-02: cotización exitosa
test('RF-02: calcula correctamente una cotización', async () => {
    verificarBaseDePruebas();

    const pool = require('./database');

    const resultado = await pool.query(
        `SELECT id, precio_base
         FROM destinos
         WHERE activo = TRUE
         LIMIT 1`
    );

    assert.ok(
        resultado.rows.length > 0,
        'Debe existir un destino activo en la base de pruebas'
    );

    const destino = resultado.rows[0];

    const cotizacion = calcularTotal(
        Number(destino.precio_base),
        2
    );

    const subtotalEsperado = Number(destino.precio_base) * 2;

    assert.equal(Number(cotizacion.subtotal), subtotalEsperado);
    assert.equal(Number(cotizacion.iva), subtotalEsperado * 0.13);
    assert.equal(
        Number(cotizacion.total),
        Number((subtotalEsperado * 1.13).toFixed(2))
    );
});

// Prueba funcional 12 - RF-01: búsqueda exitosa
test('RF-01: encuentra destinos disponibles para una fecha válida', async () => {
    verificarBaseDePruebas();

    const resultado = await probarRuta(
        'GET',
        '/api/destinos/disponibles?fecha=2027-12-15&personas=2'
    );

    assert.equal(resultado.estado, 200);
    assert.ok(Array.isArray(resultado.datos));

    assert.ok(
        resultado.datos.length > 0,
        'Debe existir al menos un destino disponible en la base de pruebas'
    );

    for (const destino of resultado.datos) {
        assert.ok(Number(destino.espacios_disponibles) >= 2);
    }
});

// Prueba funcional 13 - RF-03: creación exitosa
test('RF-03: crea una reservación con pago aprobado', async () => {
    verificarBaseDePruebas();

    const pool = require('./database');
    const correo = 'rf03-automatico@ejemplo.com';
    let codigo = null;

    try {
        const resultado = await crearReservacion({
            destino_id: 1,
            nombre: 'Cliente Automatico',
            correo,
            fecha: '2027-12-15',
            hora: '10:00',
            personas: 2,
            ultimoDigitoTarjeta: 8
        });

        codigo = resultado.codigo_confirmacion;

        assert.ok(codigo);
        assert.equal(resultado.estado_reservacion, 'Confirmada');
        assert.equal(resultado.estado_pago, 'Aprobado');

        const consulta = await pool.query(
            `SELECT r.estado AS reserva, p.estado AS pago
             FROM reservaciones r
             INNER JOIN pagos p ON p.reservacion_id = r.id
             WHERE r.codigo_confirmacion = $1`,
            [codigo]
        );

        assert.equal(consulta.rows.length, 1);
        assert.equal(consulta.rows[0].reserva, 'Confirmada');
        assert.equal(consulta.rows[0].pago, 'Aprobado');

    } finally {
        // Eliminar únicamente la reservación creada por esta prueba
        if (codigo) {
            const reserva = await pool.query(
                `SELECT id FROM reservaciones
                 WHERE codigo_confirmacion = $1
                   AND correo_cliente = $2`,
                [codigo, correo]
            );

            if (reserva.rows.length === 1) {
                const id = reserva.rows[0].id;

                await pool.query(
                    'DELETE FROM pagos WHERE reservacion_id = $1',
                    [id]
                );

                await pool.query(
                    'DELETE FROM reservaciones WHERE id = $1',
                    [id]
                );
            }
        }
    }
});

// Prueba funcional 14 - RF-04: consulta exitosa de reservación
test('RF-04: consulta correctamente una reservación existente', async () => {
    verificarBaseDePruebas();

    const pool = require('./database');

    // Utilizar una reservación existente en la base local
    const consulta = await pool.query(
        `SELECT codigo_confirmacion, correo_cliente
         FROM reservaciones
         WHERE eliminada = FALSE
         LIMIT 1`
    );

    assert.ok(
        consulta.rows.length > 0,
        'Debe existir una reservación en la base de pruebas'
    );

    const reserva = consulta.rows[0];

    const ruta =
        '/api/reservaciones/consultar?codigo=' +
        encodeURIComponent(reserva.codigo_confirmacion) +
        '&correo=' +
        encodeURIComponent(reserva.correo_cliente);

    const resultado = await probarRuta('GET', ruta);

    assert.equal(resultado.estado, 200);

    assert.equal(
        resultado.datos.reservacion.codigo_confirmacion,
        reserva.codigo_confirmacion
    );

    assert.equal(
        resultado.datos.reservacion.correo_cliente,
        reserva.correo_cliente
    );

    assert.ok(resultado.datos.reservacion.destino);
    assert.ok(resultado.datos.reservacion.estado_pago);
});