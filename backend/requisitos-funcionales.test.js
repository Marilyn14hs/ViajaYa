
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    crearReservacion
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
