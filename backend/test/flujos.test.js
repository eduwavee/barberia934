/**
 * Tests de los flujos donde un error cuesta plata: turnos, puntos y caja.
 *
 * Correr con: npm test
 */
const test = require('node:test');
const assert = require('node:assert/strict');
const {
  arrancar,
  apagar,
  pedir,
  sembrar,
  crearCliente,
  tokenDueño,
  enDias,
  db,
} = require('./ayuda');

let cliente;
let dueño;

test.before(async () => {
  await arrancar();
  sembrar();
  cliente = await crearCliente();
  dueño = await tokenDueño();
});

test.after(async () => {
  await apagar();
});

// ---------------------------------------------------------------- turnos ----

test('un horario no se puede reservar dos veces', async () => {
  const fecha = enDias(3);

  const primera = await pedir('POST', '/turnos', {
    token: cliente.token,
    cuerpo: { servicio_id: 1, fecha, hora: '15:00' },
  });
  assert.equal(primera.estado, 201);

  const otro = await crearCliente('otro@test.com');
  const segunda = await pedir('POST', '/turnos', {
    token: otro.token,
    cuerpo: { servicio_id: 1, fecha, hora: '15:00' },
  });

  assert.equal(segunda.estado, 409, 'el segundo intento tiene que rebotar');
  const activos = db
    .prepare("SELECT COUNT(*) AS c FROM turnos WHERE fecha = ? AND hora = '15:00' AND estado IN ('pendiente','confirmado')")
    .get(fecha).c;
  assert.equal(activos, 1, 'no puede quedar más de un turno activo en el mismo horario');
});

test('un horario cancelado se puede volver a reservar', async () => {
  const fecha = enDias(4);

  const reserva = await pedir('POST', '/turnos', {
    token: cliente.token,
    cuerpo: { servicio_id: 1, fecha, hora: '16:00' },
  });
  assert.equal(reserva.estado, 201);

  const cancelacion = await pedir('DELETE', `/turnos/${reserva.datos.id}`, { token: cliente.token });
  assert.equal(cancelacion.estado, 200);

  // Tiene que volver a figurar entre los libres…
  const disponibilidad = await pedir('GET', `/turnos/disponibilidad?fecha=${fecha}`);
  assert.ok(
    disponibilidad.datos.horarios.includes('16:00'),
    'el horario cancelado tiene que volver a estar libre',
  );

  // …y además dejarse reservar de verdad
  const nueva = await pedir('POST', '/turnos', {
    token: cliente.token,
    cuerpo: { servicio_id: 1, fecha, hora: '16:00' },
  });
  assert.equal(nueva.estado, 201, 'reservar un horario liberado no puede fallar');
});

test('un día bloqueado no acepta reservas', async () => {
  const fecha = enDias(5);
  const bloqueo = await pedir('POST', '/agenda/bloqueos', {
    token: dueño,
    cuerpo: { fecha, motivo: 'Feriado' },
  });
  assert.equal(bloqueo.estado, 201);

  const disponibilidad = await pedir('GET', `/turnos/disponibilidad?fecha=${fecha}`);
  assert.deepEqual(disponibilidad.datos.horarios, []);

  const intento = await pedir('POST', '/turnos', {
    token: cliente.token,
    cuerpo: { servicio_id: 1, fecha, hora: '17:00' },
  });
  assert.equal(intento.estado, 409);
});

test('bloquear un día cancela los turnos que ya había', async () => {
  const fecha = enDias(6);
  const reserva = await pedir('POST', '/turnos', {
    token: cliente.token,
    cuerpo: { servicio_id: 1, fecha, hora: '18:00' },
  });

  const bloqueo = await pedir('POST', '/agenda/bloqueos', {
    token: dueño,
    cuerpo: { fecha, motivo: 'Vacaciones' },
  });
  assert.equal(bloqueo.datos.turnos_cancelados, 1);

  const turno = db.prepare('SELECT estado FROM turnos WHERE id = ?').get(reserva.datos.id);
  assert.equal(turno.estado, 'cancelado');
});

// ----------------------------------------------------------- plata y puntos --

test('completar un turno acredita los puntos y registra el ingreso una sola vez', async () => {
  const fecha = enDias(7);
  const reserva = await pedir('POST', '/turnos', {
    token: cliente.token,
    cuerpo: { servicio_id: 1, fecha, hora: '19:00' },
  });

  const antes = db.prepare('SELECT puntos FROM usuarios WHERE id = ?').get(cliente.id).puntos;

  await pedir('PUT', `/turnos/${reserva.datos.id}/estado`, {
    token: dueño,
    cuerpo: { estado: 'completado' },
  });

  const despues = db.prepare('SELECT puntos FROM usuarios WHERE id = ?').get(cliente.id).puntos;
  assert.equal(despues, antes + 100, 'tiene que sumar los puntos del servicio');

  const caja = db
    .prepare("SELECT COUNT(*) AS c, SUM(monto) AS total FROM movimientos_caja WHERE turno_id = ?")
    .get(reserva.datos.id);
  assert.equal(caja.c, 1);
  assert.equal(caja.total, 6000, 'el ingreso tiene que ser el precio del servicio');

  // Marcarlo completado otra vez no puede duplicar nada
  await pedir('PUT', `/turnos/${reserva.datos.id}/estado`, {
    token: dueño,
    cuerpo: { estado: 'completado' },
  });

  const puntosFinales = db.prepare('SELECT puntos FROM usuarios WHERE id = ?').get(cliente.id).puntos;
  const cajaFinal = db
    .prepare('SELECT COUNT(*) AS c FROM movimientos_caja WHERE turno_id = ?')
    .get(reserva.datos.id);

  assert.equal(puntosFinales, despues, 'los puntos no se pueden acreditar dos veces');
  assert.equal(cajaFinal.c, 1, 'el ingreso no se puede registrar dos veces');
});

test('canjear descuenta puntos y stock, y no deja canjear sin saldo', async () => {
  const puntosAntes = db.prepare('SELECT puntos FROM usuarios WHERE id = ?').get(cliente.id).puntos;
  const stockAntes = db.prepare('SELECT stock FROM productos_canje WHERE id = 1').get().stock;
  assert.ok(puntosAntes >= 100, 'el test necesita que el cliente llegue con puntos');

  const canje = await pedir('POST', '/puntos/canjear', {
    token: cliente.token,
    cuerpo: { producto_id: 1 },
  });
  assert.equal(canje.estado, 200);

  const despues = db.prepare('SELECT puntos FROM usuarios WHERE id = ?').get(cliente.id);
  const stock = db.prepare('SELECT stock FROM productos_canje WHERE id = 1').get();
  assert.equal(despues.puntos, puntosAntes - 100, 'tiene que descontar los puntos del producto');
  assert.equal(stock.stock, stockAntes - 1, 'tiene que descontar una unidad del stock');

  // Ya sin saldo, el canje tiene que rebotar y no tocar el stock
  const sinSaldo = await pedir('POST', '/puntos/canjear', {
    token: cliente.token,
    cuerpo: { producto_id: 1 },
  });
  assert.notEqual(sinSaldo.estado, 200, 'no se puede canjear sin puntos suficientes');
  assert.equal(
    db.prepare('SELECT stock FROM productos_canje WHERE id = 1').get().stock,
    stock.stock,
    'un canje rechazado no puede mover el stock',
  );
});

test('el resumen de caja descuenta los gastos', async () => {
  await pedir('POST', '/ingresos', {
    token: dueño,
    cuerpo: { tipo: 'gasto', concepto: 'Insumos', monto: 1000 },
  });

  const { datos } = await pedir('GET', '/ingresos/resumen', { token: dueño });
  assert.equal(
    datos.mes.neto,
    datos.mes.ingresos - datos.mes.gastos,
    'el neto tiene que ser ingresos menos gastos',
  );
  assert.ok(datos.mes.gastos >= 1000);
});

// -------------------------------------------------------------- permisos ----

test('un cliente no puede tocar lo del dueño', async () => {
  const listado = await pedir('GET', '/turnos', { token: cliente.token });
  assert.equal(listado.estado, 403);

  const caja = await pedir('GET', '/ingresos/resumen', { token: cliente.token });
  assert.equal(caja.estado, 403);

  const agenda = await pedir('PUT', '/agenda/horarios/1', {
    token: cliente.token,
    cuerpo: { abierto: false },
  });
  assert.equal(agenda.estado, 403);
});

test('un cliente no puede cancelar el turno de otro', async () => {
  const fecha = enDias(8);
  const mio = await pedir('POST', '/turnos', {
    token: cliente.token,
    cuerpo: { servicio_id: 2, fecha, hora: '15:00' },
  });

  const intruso = await crearCliente('intruso@test.com');
  const intento = await pedir('DELETE', `/turnos/${mio.datos.id}`, { token: intruso.token });

  assert.equal(intento.estado, 403);
  assert.equal(
    db.prepare('SELECT estado FROM turnos WHERE id = ?').get(mio.datos.id).estado,
    'pendiente',
  );
});

test('sin token no se accede a nada privado', async () => {
  assert.equal((await pedir('GET', '/turnos/mios')).estado, 401);
  assert.equal((await pedir('GET', '/puntos/mis-puntos')).estado, 401);
  assert.equal((await pedir('GET', '/notificaciones')).estado, 401);
});
