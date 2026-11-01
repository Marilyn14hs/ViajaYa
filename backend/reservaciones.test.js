
const test = require('node:test');
const assert = require('node:assert/strict');

const {
    calcularEstadoPago,
    calcularTotal,
    hayCupoDisponible,
    permiteModificarOCancelar
} = require('./services/reservacionesService');

// Prueba 1 - RN-04: Tarjeta terminada en número par
test('RN-04: aprueba un pago con último dígito par', () => {
    const resultado = calcularEstadoPago(8);

    assert.equal(resultado, 'Aprobado');
});

// Prueba 2 - RN-04: Tarjeta terminada en número impar
test('RN-04: rechaza un pago con último dígito impar', () => {
    const resultado = calcularEstadoPago(7);

    assert.equal(resultado, 'Rechazado');
});


// Prueba 3 - RN-04: Rechazar dígitos inválidos
test('RN-04: rechaza un último dígito inválido', () => {
    assert.throws(
        () => calcularEstadoPago(12),
        /El último dígito de la tarjeta debe estar entre 0 y 9/
    );
});

// Prueba 4 - RN-03: Calcular subtotal, IVA y total
test('RN-03: calcula correctamente el IVA del 13%', () => {
    const resultado = calcularTotal(35000, 2);

    assert.deepEqual(resultado, {
        subtotal: '70000.00',
        iva: '9100.00',
        total: '79100.00'
    });
});


// Prueba 5 - RN-01: Evitar reservaciones que superen el cupo
test('RN-01: rechaza una reservación cuando no hay cupo suficiente', () => {
    const capacidad = 10;
    const ocupados = 8;
    const personas = 3;

    const resultado = hayCupoDisponible(
        capacidad,
        ocupados,
        personas
    );

    assert.equal(resultado, false);
});


// Prueba 6 - RN-02: Restricción de 48 horas
test('RN-02: impide modificar o cancelar dentro de las 48 horas', () => {
    const fechaActual = new Date('2026-11-01T10:00:00-06:00');
    const fechaExcursion = new Date('2026-11-02T10:00:00-06:00');

    const resultado = permiteModificarOCancelar(
        fechaExcursion,
        fechaActual
    );

    assert.equal(resultado, false);
});

// Prueba 7 - RN-02: Permitir cambios con más de 48 horas
test('RN-02: permite modificar o cancelar con más de 48 horas', () => {
    const fechaActual = new Date('2026-11-01T10:00:00-06:00');
    const fechaExcursion = new Date('2026-11-04T10:00:00-06:00');

    const resultado = permiteModificarOCancelar(
        fechaExcursion,
        fechaActual
    );

    assert.equal(resultado, true);
});
