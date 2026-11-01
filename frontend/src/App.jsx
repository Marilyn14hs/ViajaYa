import { useState, useEffect } from 'react';
import './App.css'

function App() {
  const [destinos, setDestinos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorDestinos, setErrorDestinos] = useState('');

  // RF-07: Agregar destinos turísticos
  const [mostrarFormularioDestino, setMostrarFormularioDestino] = useState(false);

  const [nuevoDestino, setNuevoDestino] = useState({
    nombre: '',
    descripcion: '',
    ubicacion: '',
    precio_base: '',
    capacidad_diaria: '',
    imagen_url: ''
  });

  const [guardandoDestino, setGuardandoDestino] = useState(false);
  const [errorNuevoDestino, setErrorNuevoDestino] = useState('');
  const [mensajeNuevoDestino, setMensajeNuevoDestino] = useState('');
  // RF-07: Edición de destinos turísticos
  const [destinoEditando, setDestinoEditando] = useState(null);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [errorEdicion, setErrorEdicion] = useState('');
  const [mensajeEdicion, setMensajeEdicion] = useState('');
  // RF-08: Administración de reservaciones
  const [reservacionesAdmin, setReservacionesAdmin] = useState([]);
  const [cargandoReservacionesAdmin, setCargandoReservacionesAdmin] = useState(false);
  const [errorReservacionesAdmin, setErrorReservacionesAdmin] = useState('');
  // RF-08: Cancelación administrativa
  const [cancelandoReservaAdmin, setCancelandoReservaAdmin] = useState(null);
  const [mensajeReservaAdmin, setMensajeReservaAdmin] = useState('');
  // RF-08: Eliminación lógica de reservaciones
  const [eliminandoReservaAdmin, setEliminandoReservaAdmin] = useState(null);
  // RF-08: Aprobación administrativa de reservaciones
  const [aprobandoReservaAdmin, setAprobandoReservaAdmin] = useState(null);
  // RF-09: Administración de pagos simulados
  const [pagosAdmin, setPagosAdmin] = useState([]);
  const [cargandoPagosAdmin, setCargandoPagosAdmin] = useState(false);
  const [errorPagosAdmin, setErrorPagosAdmin] = useState('');
  const [pagosConsultados, setPagosConsultados] = useState(false);
  // RF-09: Modificación de estados de pago
  const [cambiandoEstadoPago, setCambiandoEstadoPago] = useState(null);
  const [mensajePagosAdmin, setMensajePagosAdmin] = useState('');

  useEffect(() => {
    async function cargarDestinos() {
      try {
        const respuesta = await fetch('http://localhost:3001/api/destinos');

        if (!respuesta.ok) {
          throw new Error('No se pudieron cargar los destinos');
        }

        const datos = await respuesta.json();

        setDestinos(datos);
      } catch (error) {
        console.error('Error al cargar destinos:', error);
        setErrorDestinos('No pudimos cargar los destinos. Intenta nuevamente.');
      } finally {
        setCargando(false);
      }
    }

    cargarDestinos();
  }, []);
  const [fecha, setFecha] = useState('')
  const [personas, setPersonas] = useState(2)
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [cotizacion, setCotizacion] = useState(null);
  const [cotizando, setCotizando] = useState(false);
  const [errorCotizacion, setErrorCotizacion] = useState('');
  const [mostrarFormularioReserva, setMostrarFormularioReserva] = useState(false);

  const [datosReserva, setDatosReserva] = useState({
    nombre: '',
    correo: '',
    fecha: '',
    hora: '08:00',
    ultimoDigitoTarjeta: ''
  });
  const [procesandoReserva, setProcesandoReserva] = useState(false);
  const [errorReserva, setErrorReserva] = useState('');
  const [resultadoReserva, setResultadoReserva] = useState(null);

  // RF-04: Consulta de reservaciones
  const [mostrarConsulta, setMostrarConsulta] = useState(false);

  const [datosConsulta, setDatosConsulta] = useState({
    codigo: '',
    correo: ''
  });

  const [consultandoReserva, setConsultandoReserva] = useState(false);
  const [errorConsulta, setErrorConsulta] = useState('');
  const [reservaConsultada, setReservaConsultada] = useState(null);
  // RF-05: Cambio de fecha de reservaciones
  const [mostrarCambioFecha, setMostrarCambioFecha] = useState(false);
  const [nuevaFechaReserva, setNuevaFechaReserva] = useState('');
  const [cambiandoFecha, setCambiandoFecha] = useState(false);
  const [errorCambioFecha, setErrorCambioFecha] = useState('');
  const [mensajeCambioFecha, setMensajeCambioFecha] = useState('');
  // RF-06: Cancelación de reservaciones
  const [cancelandoReserva, setCancelandoReserva] = useState(false);
  const [errorCancelacion, setErrorCancelacion] = useState('');
  const [mensajeCancelacion, setMensajeCancelacion] = useState('');
  // RF-07, RF-08 y RF-09: Administración
  const [mostrarLoginAdmin, setMostrarLoginAdmin] = useState(false);
  const [datosAdmin, setDatosAdmin] = useState({
    usuario: '',
    clave: ''
  });
  const [tokenAdmin, setTokenAdmin] = useState('');
  const [errorLoginAdmin, setErrorLoginAdmin] = useState('');
  const [iniciandoSesionAdmin, setIniciandoSesionAdmin] = useState(false);
  const [mostrarPanelAdmin, setMostrarPanelAdmin] = useState(false);
  const [pestanaAdmin, setPestanaAdmin] = useState('destinos');
  // RF-07: Gestión de destinos turísticos
  const [destinosAdmin, setDestinosAdmin] = useState([]);
  const [cargandoDestinosAdmin, setCargandoDestinosAdmin] = useState(false);
  const [errorDestinosAdmin, setErrorDestinosAdmin] = useState('');


  const buscarDestinos = async (evento) => {
    evento.preventDefault();

    if (!fecha) {
      alert('Selecciona una fecha para tu viaje');
      return;
    }

    setBuscando(true);
    setErrorDestinos('');

    try {
      const respuesta = await fetch(
        `http://localhost:3001/api/destinos/disponibles?fecha=${encodeURIComponent(fecha)}&personas=${personas}`
      );

      if (!respuesta.ok) {
        const error = await respuesta.json();
        throw new Error(error.mensaje || 'No se pudo realizar la búsqueda');
      }

      const datos = await respuesta.json();

      setDestinos(datos);
      setBusquedaRealizada(true);

      // Desplazar la pantalla hacia los resultados
      document.getElementById('destinos')?.scrollIntoView({
        behavior: 'smooth'
      });

    } catch (error) {
      console.error('Error al buscar destinos:', error);
      setErrorDestinos(error.message);
    } finally {
      setBuscando(false);
    }
  };
  const cotizarDestino = async (destino) => {
    setCotizando(true);
    setErrorCotizacion('');
    setCotizacion(null);

    try {
      const respuesta = await fetch(
        'http://localhost:3001/api/cotizaciones',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            destino_id: destino.id,
            personas: personas
          })
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo calcular la cotización'
        );
      }

      setCotizacion(datos);

    } catch (error) {
      console.error('Error al cotizar:', error);
      setErrorCotizacion(error.message);
    } finally {
      setCotizando(false);
    }
  };

  const cerrarCotizacion = () => {
    setCotizacion(null);
    setErrorCotizacion('');
  };

  const abrirFormularioReserva = () => {
    setDatosReserva({
      nombre: '',
      correo: '',
      fecha: fecha || '',
      hora: '08:00',
      ultimoDigitoTarjeta: ''
    });

    setMostrarFormularioReserva(true);
  };

  const confirmarReservacion = async (evento) => {
    evento.preventDefault();

    if (procesandoReserva || !cotizacion) {
      return;
    }

    setProcesandoReserva(true);
    setErrorReserva('');

    try {
      const respuesta = await fetch(
        'http://localhost:3001/api/reservaciones',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            destino_id: cotizacion.destino_id,
            nombre: datosReserva.nombre,
            correo: datosReserva.correo,
            fecha: datosReserva.fecha,
            hora: datosReserva.hora,
            personas: cotizacion.personas,
            ultimoDigitoTarjeta: datosReserva.ultimoDigitoTarjeta
          })
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo procesar la reservación'
        );
      }

      setResultadoReserva(datos.reservacion);
      setMostrarFormularioReserva(false);

    } catch (error) {
      console.error('Error al confirmar reservación:', error);
      setErrorReserva(error.message);

    } finally {
      setProcesandoReserva(false);
    }
  };
  // Consultar reservación por código y correo
  const consultarReservacion = async (evento) => {
    evento.preventDefault();

    setConsultandoReserva(true);
    setErrorConsulta('');
    setReservaConsultada(null);

    try {
      const parametros = new URLSearchParams({
        codigo: datosConsulta.codigo.trim(),
        correo: datosConsulta.correo.trim()
      });

      const respuesta = await fetch(
        `http://localhost:3001/api/reservaciones/consultar?${parametros}`
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo consultar la reservación'
        );
      }

      setReservaConsultada(datos.reservacion);

    } catch (error) {
      console.error('Error al consultar reservación:', error);
      setErrorConsulta(error.message);

    } finally {
      setConsultandoReserva(false);
    }
  };
  // RF-05: Enviar solicitud para cambiar la fecha
  const cambiarFecha = async (evento) => {
    evento.preventDefault();

    if (cambiandoFecha || !reservaConsultada) {
      return;
    }

    setCambiandoFecha(true);
    setErrorCambioFecha('');
    setMensajeCambioFecha('');

    try {
      const respuesta = await fetch(
        'http://localhost:3001/api/reservaciones/cambiar-fecha',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            codigo: reservaConsultada.codigo_confirmacion,
            correo: reservaConsultada.correo_cliente,
            nuevaFecha: nuevaFechaReserva
          })
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo cambiar la fecha'
        );
      }

      // Actualizar la fecha que aparece en pantalla
      setReservaConsultada((reservaAnterior) => ({
        ...reservaAnterior,
        fecha_excursion: datos.reservacion.fecha_nueva
      }));

      setMensajeCambioFecha(
        '¡La fecha de tu reservación se modificó correctamente!'
      );

      setMostrarCambioFecha(false);
      setNuevaFechaReserva('');

    } catch (error) {
      setErrorCambioFecha(error.message);

    } finally {
      setCambiandoFecha(false);
    }
  };
  // RF-06: Cancelar una reservación
  const cancelarReserva = async () => {
    if (!reservaConsultada || cancelandoReserva) {
      return;
    }

    // Pedir confirmación antes de cancelar
    const confirmar = window.confirm(
      '¿Estás seguro de que deseas cancelar esta reservación? Esta acción no se puede deshacer.'
    );

    if (!confirmar) {
      return;
    }

    setCancelandoReserva(true);
    setErrorCancelacion('');
    setMensajeCancelacion('');

    try {
      const respuesta = await fetch(
        'http://localhost:3001/api/reservaciones/cancelar',
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            codigo: reservaConsultada.codigo_confirmacion,
            correo: reservaConsultada.correo_cliente
          })
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo cancelar la reservación'
        );
      }

      // Actualizar el estado mostrado en la página
      setReservaConsultada((reservaAnterior) => ({
        ...reservaAnterior,
        estado_reservacion: 'Cancelada'
      }));

      // Ocultar el formulario de cambio de fecha
      setMostrarCambioFecha(false);
      setNuevaFechaReserva('');
      setErrorCambioFecha('');
      setMensajeCambioFecha('');

      setMensajeCancelacion(
        '¡Tu reservación se canceló correctamente!'
      );

    } catch (error) {
      setErrorCancelacion(error.message);

    } finally {
      setCancelandoReserva(false);
    }
  };

  // Iniciar sesión como administrador
  const iniciarSesionAdmin = async (evento) => {
    evento.preventDefault();

    if (iniciandoSesionAdmin) {
      return;
    }

    setIniciandoSesionAdmin(true);
    setErrorLoginAdmin('');

    try {
      const respuesta = await fetch(
        'http://localhost:3001/api/admin/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(datosAdmin)
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo iniciar sesión'
        );
      }

      // Guardar el token solamente mientras la página esté abierta
      setTokenAdmin(datos.token);

      // No conservar la contraseña en el formulario
      setDatosAdmin({
        usuario: '',
        clave: ''
      });

      setMostrarLoginAdmin(false);
      setMostrarPanelAdmin(true);
      // Cargar destinos al entrar al panel
      cargarDestinosAdmin(datos.token);

    } catch (error) {
      setErrorLoginAdmin(error.message);

    } finally {
      setIniciandoSesionAdmin(false);
    }
  };

  // Cerrar la sesión del administrador
  const cerrarSesionAdmin = () => {
    setTokenAdmin('');
    setMostrarPanelAdmin(false);
    setMostrarLoginAdmin(false);
    setDatosAdmin({
      usuario: '',
      clave: ''
    });
    setErrorLoginAdmin('');
  };
  // RF-07: Consultar todos los destinos como administrador
  const cargarDestinosAdmin = async (token) => {
    setCargandoDestinosAdmin(true);
    setErrorDestinosAdmin('');

    try {
      const respuesta = await fetch(
        'http://localhost:3001/api/admin/destinos',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudieron cargar los destinos'
        );
      }

      setDestinosAdmin(datos.destinos);

    } catch (error) {
      setErrorDestinosAdmin(error.message);

    } finally {
      setCargandoDestinosAdmin(false);
    }
  };
  // RF-07: Registrar un destino desde el panel administrativo
  const agregarDestino = async (evento) => {
    evento.preventDefault();
    if (guardandoDestino) return;

    setGuardandoDestino(true);
    setErrorNuevoDestino('');
    setMensajeNuevoDestino('');

    try {
      const respuesta = await fetch('http://localhost:3001/api/admin/destinos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokenAdmin}`
        },
        body: JSON.stringify(nuevoDestino)
      });
      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(datos.mensaje || 'No se pudo agregar el destino turístico');
      }

      // El registro ya se guardó; avisar aunque falle una actualización posterior.
      setMensajeNuevoDestino('¡El destino turístico se agregó correctamente!');
      setNuevoDestino({
        nombre: '',
        descripcion: '',
        ubicacion: '',
        precio_base: '',
        capacidad_diaria: '',
        imagen_url: ''
      });
      setMostrarFormularioDestino(false);

      // Actualizar el panel y la página pública.
      await cargarDestinosAdmin(tokenAdmin);
      try {
        const respuestaPublica = await fetch('http://localhost:3001/api/destinos');
        if (respuestaPublica.ok) {
          setDestinos(await respuestaPublica.json());
          setBusquedaRealizada(false);
        }
      } catch (errorActualizacion) {
        console.error('No se pudo actualizar la lista pública:', errorActualizacion);
      }
    } catch (error) {
      setErrorNuevoDestino(error.message);
    } finally {
      setGuardandoDestino(false);
    }
  };

  // Seleccionar un destino para editar
  const seleccionarDestinoEditar = (destino) => {
    setDestinoEditando({
      id: destino.id,
      nombre: destino.nombre,
      descripcion: destino.descripcion || '',
      ubicacion: destino.ubicacion,
      precio_base: destino.precio_base,
      capacidad_diaria: destino.capacidad_diaria,
      imagen_url: destino.imagen_url || ''
    });

    setErrorEdicion('');
    setMensajeEdicion('');
    setMostrarFormularioDestino(false);
  };

  // RF-07: Guardar los cambios de un destino turístico
  const guardarEdicionDestino = async (evento) => {
    evento.preventDefault();

    if (!destinoEditando || guardandoEdicion) {
      return;
    }

    setGuardandoEdicion(true);
    setErrorEdicion('');
    setMensajeEdicion('');

    try {
      const respuesta = await fetch(
        `http://localhost:3001/api/admin/destinos/${destinoEditando.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenAdmin}`
          },
          body: JSON.stringify(destinoEditando)
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo actualizar el destino'
        );
      }

      setMensajeEdicion('¡Destino turístico actualizado correctamente!');

      // Cerrar el formulario de edición
      setDestinoEditando(null);

      // Actualizar la lista del administrador
      await cargarDestinosAdmin(tokenAdmin);

      // Actualizar los destinos de la página pública
      const respuestaPublica = await fetch(
        'http://localhost:3001/api/destinos'
      );

      if (respuestaPublica.ok) {
        const destinosActualizados = await respuestaPublica.json();
        setDestinos(destinosActualizados);
      }

    } catch (error) {
      setErrorEdicion(error.message);

    } finally {
      setGuardandoEdicion(false);
    }
  };

  // RF-07: Activar o desactivar un destino turístico
  const cambiarEstadoDestino = async (destino) => {
    const nuevoEstado = !destino.activo;

    const confirmar = window.confirm(
      nuevoEstado
        ? `¿Deseas activar el destino "${destino.nombre}"?`
        : `¿Deseas desactivar el destino "${destino.nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    setErrorEdicion('');
    setMensajeEdicion('');

    try {
      const respuesta = await fetch(
        `http://localhost:3001/api/admin/destinos/${destino.id}/estado`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenAdmin}`
          },
          body: JSON.stringify({
            activo: nuevoEstado
          })
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo cambiar el estado del destino'
        );
      }

      setMensajeEdicion(datos.mensaje);

      // Actualizar la lista del administrador
      await cargarDestinosAdmin(tokenAdmin);

      // Actualizar los destinos de la página pública
      const respuestaPublica = await fetch(
        'http://localhost:3001/api/destinos'
      );

      if (respuestaPublica.ok) {
        const destinosActualizados = await respuestaPublica.json();
        setDestinos(destinosActualizados);
      }

    } catch (error) {
      setErrorEdicion(error.message);
    }
  };

  // RF-08: Cargar reservaciones para el administrador
  const cargarReservacionesAdmin = async () => {
    setCargandoReservacionesAdmin(true);
    setErrorReservacionesAdmin('');

    try {
      const respuesta = await fetch(
        'http://localhost:3001/api/admin/reservaciones',
        {
          headers: {
            Authorization: `Bearer ${tokenAdmin}`
          }
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudieron consultar las reservaciones'
        );
      }

      setReservacionesAdmin(datos.reservaciones || []);

    } catch (error) {
      setErrorReservacionesAdmin(error.message);

    } finally {
      setCargandoReservacionesAdmin(false);
    }
  };

  // RF-08: Cancelar una reservación desde administración
  const cancelarReservacionAdmin = async (reservacion) => {
    if (cancelandoReservaAdmin !== null) return;

    const confirmar = window.confirm(
      `¿Deseas cancelar la reservación "${reservacion.codigo_confirmacion}"?\n\n` +
      'Esta acción no se puede deshacer.'
    );

    if (!confirmar) return;

    setCancelandoReservaAdmin(reservacion.id);
    setErrorReservacionesAdmin('');
    setMensajeReservaAdmin('');

    try {
      const respuesta = await fetch(
        `http://localhost:3001/api/admin/reservaciones/${reservacion.id}/cancelar`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${tokenAdmin}`
          }
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo cancelar la reservación'
        );
      }

      setMensajeReservaAdmin(
        `La reservación ${reservacion.codigo_confirmacion} se canceló correctamente.`
      );

      // Actualizar la lista con los estados guardados en Supabase
      await cargarReservacionesAdmin();

    } catch (error) {
      setErrorReservacionesAdmin(error.message);

    } finally {
      setCancelandoReservaAdmin(null);
    }
  };

  // RF-08: Eliminar lógicamente una reservación
  const eliminarReservacionAdmin = async (reservacion) => {
    if (eliminandoReservaAdmin !== null) return;

    const confirmar = window.confirm(
      `¿Deseas eliminar la reservación "${reservacion.codigo_confirmacion}"?\n\n` +
      'La reservación se conservará en la base de datos como eliminada.'
    );

    if (!confirmar) return;

    setEliminandoReservaAdmin(reservacion.id);
    setErrorReservacionesAdmin('');
    setMensajeReservaAdmin('');

    try {
      const respuesta = await fetch(
        `http://localhost:3001/api/admin/reservaciones/${reservacion.id}/eliminar`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${tokenAdmin}`
          }
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo eliminar la reservación'
        );
      }

      setMensajeReservaAdmin(
        `La reservación ${reservacion.codigo_confirmacion} fue eliminada lógicamente.`
      );

      // Actualizar la lista de reservaciones
      await cargarReservacionesAdmin();

    } catch (error) {
      setErrorReservacionesAdmin(error.message);

    } finally {
      setEliminandoReservaAdmin(null);
    }
  };

  // RF-08: Aprobar una reservación desde administración
  const aprobarReservacionAdmin = async (reservacion) => {
    if (aprobandoReservaAdmin !== null) return;

    const confirmar = window.confirm(
      `¿Deseas aprobar la reservación "${reservacion.codigo_confirmacion}"?`
    );

    if (!confirmar) return;

    setAprobandoReservaAdmin(reservacion.id);
    setErrorReservacionesAdmin('');
    setMensajeReservaAdmin('');

    try {
      const respuesta = await fetch(
        `http://localhost:3001/api/admin/reservaciones/${reservacion.id}/aprobar`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${tokenAdmin}`
          }
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo aprobar la reservación'
        );
      }

      setMensajeReservaAdmin(
        `La reservación ${reservacion.codigo_confirmacion} fue aprobada correctamente.`
      );

      await cargarReservacionesAdmin();

    } catch (error) {
      setErrorReservacionesAdmin(error.message);

    } finally {
      setAprobandoReservaAdmin(null);
    }
  };

  // RF-09: Consultar pagos simulados desde administración
  const cargarPagosAdmin = async () => {
    setCargandoPagosAdmin(true);
    setErrorPagosAdmin('');

    try {
      const respuesta = await fetch(
        'http://localhost:3001/api/admin/pagos',
        {
          headers: {
            Authorization: `Bearer ${tokenAdmin}`
          }
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudieron consultar los pagos'
        );
      }

      setPagosAdmin(datos.pagos || []);
      setPagosConsultados(true);

    } catch (error) {
      setErrorPagosAdmin(error.message);

    } finally {
      setCargandoPagosAdmin(false);
    }
  };

  // RF-09: Cambiar estado de un pago simulado
  const cambiarEstadoPagoAdmin = async (pago, nuevoEstado) => {
    if (cambiandoEstadoPago !== null) return;

    if (nuevoEstado === pago.estado) return;

    const confirmar = window.confirm(
      `¿Deseas cambiar el pago #${pago.id} de "${pago.estado}" a "${nuevoEstado}"?`
    );

    if (!confirmar) return;

    setCambiandoEstadoPago(pago.id);
    setErrorPagosAdmin('');
    setMensajePagosAdmin('');

    try {
      const respuesta = await fetch(
        `http://localhost:3001/api/admin/pagos/${pago.id}/estado`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenAdmin}`
          },
          body: JSON.stringify({
            estado: nuevoEstado
          })
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.mensaje || 'No se pudo actualizar el pago'
        );
      }

      setMensajePagosAdmin(
        `El pago #${pago.id} cambió a "${nuevoEstado}" correctamente.`
      );

      // Actualizar pagos y reservaciones
      await cargarPagosAdmin();
      await cargarReservacionesAdmin();

    } catch (error) {
      setErrorPagosAdmin(error.message);

    } finally {
      setCambiandoEstadoPago(null);
    }
  };

  return (
    <div className="app">
      {/* MENÚ PRINCIPAL */}
      <header className="navbar">
        <div className="navbar-contenido">
          <a href="#" className="logo">
            <span className="logo-icono">✈</span>
            Viaja<span>Ya</span>
          </a>

          <nav className="menu">
            <a href="#inicio">Inicio</a>
            <a href="#destinos">Destinos</a>
            <a href="#nosotros">Nosotros</a>
          </nav>

          <button
            className="boton-reservas"
            onClick={() => {
              setMostrarConsulta(true);
              setErrorConsulta('');
              setReservaConsultada(null);
            }}
          >
            Mis reservaciones
          </button>
          <button
            type="button"
            className="boton-administracion"
            onClick={() => {
              setErrorLoginAdmin('');

              if (tokenAdmin) {
                setMostrarPanelAdmin(true);
                setPestanaAdmin('destinos');
                cargarDestinosAdmin(tokenAdmin);
              } else {
                setMostrarLoginAdmin(true);
              }
            }}
          >
            Administración
          </button>
        </div>
      </header>

      {/* PORTADA */}
      <section className="hero" id="inicio">
        <div className="hero-contenido">
          <div className="etiqueta">
            🌿 DESCUBRE COSTA RICA
          </div>

          <h1>
            Tu próxima aventura
            <br />
            <span>comienza aquí.</span>
          </h1>

          <p className="hero-descripcion">
            Explora destinos increíbles, vive experiencias
            inolvidables y reserva tu próxima aventura
            de manera fácil y segura.
          </p>

          <a href="#destinos" className="boton-explorar">
            Explorar destinos →
          </a>
        </div>
      </section>

      {/* BUSCADOR */}
      <section className="buscador-seccion">
        <form className="buscador" onSubmit={buscarDestinos}>
          <div className="buscador-titulo">
            <span>🌎</span>
            <div>
              <h2>Encuentra tu próxima experiencia</h2>
              <p>¿Cuándo quieres viajar?</p>
            </div>
          </div>

          <div className="buscador-campos">
            <div className="campo">
              <label htmlFor="fecha">Fecha del viaje</label>
              <input
                id="fecha"
                type="date"
                value={fecha}
                min={new Date().toLocaleDateString('en-CA')}
                onChange={(e) => setFecha(e.target.value)}
                required
              />
            </div>

            <div className="campo">
              <label htmlFor="personas">Personas</label>
              <select
                id="personas"
                value={personas}
                onChange={(e) => setPersonas(Number(e.target.value))}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((numero) => (
                  <option key={numero} value={numero}>
                    {numero} {numero === 1 ? 'persona' : 'personas'}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="boton-buscar"
              disabled={buscando}
            >
              {buscando ? 'Buscando aventuras...' : 'Buscar aventuras →'}
            </button>
          </div>
        </form>
      </section>

      {/* DESTINOS */}
      <section className="destinos-seccion" id="destinos">
        <div className="seccion-encabezado">
          <span className="seccion-etiqueta">
            EXPERIENCIAS INOLVIDABLES
          </span>

          <h2>
            {busquedaRealizada
              ? 'Experiencias disponibles para tu viaje'
              : 'Destinos que te enamorarán'}
          </h2>

          <p>
            {busquedaRealizada
              ? `Resultados para ${personas} persona(s) el ${fecha}`
              : 'Descubre algunos de los lugares más hermosos de Costa Rica.'}
          </p>
        </div>

        <div className="destinos-grid">

          {cargando && (
            <p>Cargando destinos turísticos...</p>
          )}

          {errorDestinos && (
            <p>{errorDestinos}</p>
          )}

          {!cargando && !errorDestinos && destinos.length === 0 && (
            <p>No hay destinos disponibles en este momento.</p>
          )}

          {!cargando && !errorDestinos && destinos.map((destino) => (
            <article className="destino-card" key={destino.id}>

              <div
                className={`destino-imagen ${destino.nombre.includes('Arenal')
                  ? 'destino-arenal'
                  : destino.nombre.includes('Manuel Antonio')
                    ? 'destino-manuel'
                    : destino.nombre.includes('Monteverde')
                      ? 'destino-monteverde'
                      : ''
                  }`}
                style={
                  destino.imagen_url
                    ? { backgroundImage: `url("${destino.imagen_url}")` }
                    : undefined
                }
              >
                <span className="destino-badge">
                  🌿 Costa Rica
                </span>
              </div>

              <div className="destino-info">

                <span className="destino-ubicacion">
                  📍 {destino.ubicacion}
                </span>

                <h3>{destino.nombre}</h3>

                <p>{destino.descripcion}</p>
                {busquedaRealizada && destino.espacios_disponibles !== undefined && (
                  <p>
                    🟢 {destino.espacios_disponibles} espacios disponibles
                  </p>
                )}

                <p>
                  <strong>
                    Desde ₡{Number(destino.precio_base).toLocaleString('es-CR')}
                  </strong>
                  {' '}por persona
                </p>

                <button
                  className="boton-destino"
                  onClick={() => cotizarDestino(destino)}
                  disabled={cotizando}
                >
                  {cotizando ? 'Calculando...' : 'Ver experiencia →'}
                </button>
              </div>

            </article>
          ))}

        </div>
        {errorCotizacion && (
          <div className="cotizacion-error">
            <p>{errorCotizacion}</p>
            <button onClick={cerrarCotizacion}>Cerrar</button>
          </div>
        )}

        {cotizacion && !mostrarFormularioReserva && !resultadoReserva && (
          <div className="modal-fondo" onClick={cerrarCotizacion}>
            <div
              className="modal-cotizacion"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-cotizacion"
              onClick={(evento) => evento.stopPropagation()}
            >
              <button
                className="modal-cerrar"
                onClick={cerrarCotizacion}
                aria-label="Cerrar cotización"
              >
                ×
              </button>

              <span className="seccion-etiqueta">
                TU PRÓXIMA AVENTURA
              </span>

              <h2 id="titulo-cotizacion">Cotización de tu experiencia</h2>

              <h3>{cotizacion.destino}</h3>

              <div className="cotizacion-detalles">
                <div>
                  <span>Personas</span>
                  <strong>{cotizacion.personas}</strong>
                </div>

                <div>
                  <span>Precio por persona</span>
                  <strong>
                    ₡{Number(cotizacion.precio_unitario).toLocaleString('es-CR')}
                  </strong>
                </div>

                <div>
                  <span>Subtotal</span>
                  <strong>
                    ₡{Number(cotizacion.subtotal).toLocaleString('es-CR')}
                  </strong>
                </div>

                <div>
                  <span>IVA (13 %)</span>
                  <strong>
                    ₡{Number(cotizacion.iva).toLocaleString('es-CR')}
                  </strong>
                </div>

                <div className="cotizacion-total">
                  <span>Total</span>
                  <strong>
                    ₡{Number(cotizacion.total).toLocaleString('es-CR')}
                  </strong>
                </div>
              </div>

              <p className="cotizacion-aviso">
                Esta cotización es informativa y todavía no constituye una reservación.
              </p>

              <button
                className="boton-confirmar-cotizacion"
                onClick={abrirFormularioReserva}
              >
                Continuar con la reservación →
              </button>
            </div>
          </div>
        )}
        {mostrarFormularioReserva && cotizacion && (
          <div className="modal-fondo">
            <div
              className="modal-cotizacion"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-reserva"
            >
              <button
                type="button"
                className="modal-cerrar"
                onClick={() => setMostrarFormularioReserva(false)}
                aria-label="Cerrar formulario"
              >
                ×
              </button>

              <span className="seccion-etiqueta">
                ESTÁS A UN PASO DE TU AVENTURA
              </span>

              <h2 id="titulo-reserva">Datos de tu reservación</h2>

              <h3>{cotizacion.destino}</h3>

              <form
                className="formulario-reserva"
                onSubmit={confirmarReservacion}
              >
                <label htmlFor="reserva-nombre">
                  Nombre completo
                </label>
                <input
                  id="reserva-nombre"
                  type="text"
                  value={datosReserva.nombre}
                  onChange={(evento) =>
                    setDatosReserva({
                      ...datosReserva,
                      nombre: evento.target.value
                    })
                  }
                  placeholder="Escribe tu nombre completo"
                  required
                />

                <label htmlFor="reserva-correo">
                  Correo electrónico
                </label>
                <input
                  id="reserva-correo"
                  type="email"
                  value={datosReserva.correo}
                  onChange={(evento) =>
                    setDatosReserva({
                      ...datosReserva,
                      correo: evento.target.value
                    })
                  }
                  placeholder="ejemplo@correo.com"
                  required
                />

                <label htmlFor="reserva-fecha">
                  Fecha de la excursión
                </label>
                <input
                  id="reserva-fecha"
                  type="date"
                  value={datosReserva.fecha}
                  min={new Date().toLocaleDateString('en-CA')}
                  onChange={(evento) =>
                    setDatosReserva({
                      ...datosReserva,
                      fecha: evento.target.value
                    })
                  }
                  required
                />

                <label htmlFor="reserva-hora">
                  Hora de la excursión
                </label>
                <input
                  id="reserva-hora"
                  type="time"
                  value={datosReserva.hora}
                  onChange={(evento) =>
                    setDatosReserva({
                      ...datosReserva,
                      hora: evento.target.value
                    })
                  }
                  required
                />

                <label htmlFor="reserva-tarjeta">
                  Último dígito de la tarjeta (pago simulado)
                </label>
                <select
                  id="reserva-tarjeta"
                  value={datosReserva.ultimoDigitoTarjeta}
                  onChange={(evento) =>
                    setDatosReserva({
                      ...datosReserva,
                      ultimoDigitoTarjeta: evento.target.value
                    })
                  }
                  required
                >
                  <option value="">Selecciona un dígito</option>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((digito) => (
                    <option key={digito} value={digito}>
                      {digito}
                    </option>
                  ))}
                </select>

                <div className="reserva-resumen">
                  <p>
                    <strong>Personas:</strong> {cotizacion.personas}
                  </p>

                  <p>
                    <strong>Total con IVA:</strong>{' '}
                    ₡{Number(cotizacion.total).toLocaleString('es-CR')}
                  </p>
                </div>

                {errorReserva && (
                  <p role="alert" style={{ color: '#b91c1c' }}>
                    {errorReserva}
                  </p>
                )}

                <button
                  type="submit"
                  className="boton-confirmar-cotizacion"
                  disabled={procesandoReserva}
                >
                  {procesandoReserva
                    ? 'Procesando reservación...'
                    : 'Confirmar reservación →'}
                </button>
              </form>
            </div>
          </div>
        )}
        {resultadoReserva && (
          <div className="modal-fondo">
            <div
              className="modal-cotizacion"
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-resultado-reserva"
            >
              <span className="seccion-etiqueta">
                VIAJAYA
              </span>

              <h2 id="titulo-resultado-reserva">
                {resultadoReserva.estado_pago === 'Aprobado'
                  ? '¡Reservación confirmada!'
                  : 'Pago rechazado'}
              </h2>

              <h3>{resultadoReserva.destino}</h3>

              <div className="cotizacion-detalles">
                <div>
                  <span>Fecha</span>
                  <strong>{resultadoReserva.fecha}</strong>
                </div>

                <div>
                  <span>Hora</span>
                  <strong>{resultadoReserva.hora}</strong>
                </div>

                <div>
                  <span>Personas</span>
                  <strong>{resultadoReserva.personas}</strong>
                </div>

                <div>
                  <span>Estado del pago</span>
                  <strong>{resultadoReserva.estado_pago}</strong>
                </div>

                <div>
                  <span>Estado de la reservación</span>
                  <strong>{resultadoReserva.estado_reservacion}</strong>
                </div>

                <div className="cotizacion-total">
                  <span>Total</span>
                  <strong>
                    ₡{Number(resultadoReserva.total).toLocaleString('es-CR')}
                  </strong>
                </div>
              </div>

              {resultadoReserva.estado_pago === 'Aprobado' ? (
                <>
                  <p className="cotizacion-aviso">
                    Guarda tu código de confirmación. Lo necesitarás
                    para consultar o modificar tu reservación.
                  </p>

                  <div className="codigo-confirmacion">
                    {resultadoReserva.codigo_confirmacion}
                  </div>
                </>
              ) : (
                <p className="cotizacion-aviso">
                  Tu pago simulado fue rechazado y la reservación
                  no quedó confirmada. No se ocuparon espacios.
                </p>
              )}

              <button
                className="boton-confirmar-cotizacion"
                onClick={() => {
                  setResultadoReserva(null);
                  setCotizacion(null);
                  setErrorReserva('');
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SOBRE NOSOTROS */}
      <section className="nosotros" id="nosotros">
        <span className="seccion-etiqueta">VIAJA CON NOSOTROS</span>

        <h2>Experiencias que se convierten en recuerdos</h2>

        <p>
          En ViajaYa queremos ayudarte a descubrir
          la belleza de Costa Rica y disfrutar cada aventura.
        </p>
      </section>

      {/* PIE DE PÁGINA */}
      <footer className="footer">
        <div className="footer-contenido">
          <div className="footer-logo">
            ✈ ViajaYa
          </div>

          <p>Descubre, explora y vive nuevas aventuras.</p>

          <span>© 2026 ViajaYa</span>
        </div>
      </footer>
      {/* RF-04: Ventana para consultar reservaciones */}
      {mostrarConsulta && (
        <div className="modal-fondo">
          <div
            className="modal-cotizacion vy-modal-consulta"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-consulta"
          >
            <button type="button" className="modal-cerrar" aria-label="Cerrar" onClick={() => { setMostrarConsulta(false); setReservaConsultada(null); }}>×</button>
            <div className="vy-modal-icono" aria-hidden="true">🗓️</div>
            <span className="seccion-etiqueta">
              VIAJAYA
            </span>

            <h2 id="titulo-consulta">
              Mis reservaciones
            </h2>

            <p className="cotizacion-aviso">
              Ingresa tu código de confirmación y el correo
              electrónico utilizado al reservar.
            </p>

            <form
              className="formulario-reserva"
              onSubmit={consultarReservacion}
            >
              <label>
                Código de confirmación

                <input
                  type="text"
                  placeholder="Ejemplo: VY-123456789ABC"
                  value={datosConsulta.codigo}
                  onChange={(evento) =>
                    setDatosConsulta({
                      ...datosConsulta,
                      codigo: evento.target.value
                    })
                  }
                  required
                />
              </label>

              <label>
                Correo electrónico

                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={datosConsulta.correo}
                  onChange={(evento) =>
                    setDatosConsulta({
                      ...datosConsulta,
                      correo: evento.target.value
                    })
                  }
                  required
                />
              </label>

              {errorConsulta && (
                <p role="alert" style={{ color: '#b91c1c' }}>
                  {errorConsulta}
                </p>
              )}

              <button
                type="submit"
                className="boton-confirmar-cotizacion"
                disabled={consultandoReserva}
              >
                {consultandoReserva
                  ? 'Buscando reservación...'
                  : 'Consultar reservación'}
              </button>
            </form>

            {reservaConsultada && (
              <div className="resultado-consulta">
                <h3>Reservación encontrada</h3>

                <div className="cotizacion-detalles">
                  <div>
                    <span>Código</span>
                    <strong>
                      {reservaConsultada.codigo_confirmacion}
                    </strong>
                  </div>

                  <div>
                    <span>Cliente</span>
                    <strong>
                      {reservaConsultada.nombre_cliente}
                    </strong>
                  </div>

                  <div>
                    <span>Destino</span>
                    <strong>
                      {reservaConsultada.destino}
                    </strong>
                  </div>

                  <div>
                    <span>Fecha</span>
                    <strong>
                      {String(reservaConsultada.fecha_excursion).slice(0, 10)}
                    </strong>
                  </div>

                  <div>
                    <span>Hora</span>
                    <strong>
                      {reservaConsultada.hora_excursion}
                    </strong>
                  </div>

                  <div>
                    <span>Personas</span>
                    <strong>
                      {reservaConsultada.cantidad_personas}
                    </strong>
                  </div>

                  <div>
                    <span>Estado</span>
                    <strong>
                      {reservaConsultada.estado_reservacion}
                    </strong>
                  </div>

                  <div>
                    <span>Pago</span>
                    <strong>
                      {reservaConsultada.estado_pago}
                    </strong>
                  </div>

                  <div className="cotizacion-total">
                    <span>Total</span>
                    <strong>
                      ₡{Number(reservaConsultada.total).toLocaleString('es-CR')}
                    </strong>
                  </div>
                  {reservaConsultada.estado_reservacion === 'Confirmada' && (
                    <button
                      type="button"
                      className="boton-confirmar-cotizacion"
                      onClick={() => {
                        setMostrarCambioFecha(true);
                        setNuevaFechaReserva('');
                        setErrorCambioFecha('');
                        setMensajeCambioFecha('');
                      }}
                    >
                      Cambiar fecha de reservación
                    </button>
                  )}
                </div>

                {mostrarCambioFecha && (
                  <form
                    className="formulario-reserva"
                    onSubmit={cambiarFecha}
                  >
                    <h3>Selecciona una nueva fecha</h3>

                    <label>
                      Nueva fecha de la excursión

                      <input
                        type="date"
                        value={nuevaFechaReserva}
                        onChange={(evento) =>
                          setNuevaFechaReserva(evento.target.value)
                        }
                        required
                      />
                    </label>

                    {errorCambioFecha && (
                      <p role="alert" style={{ color: '#b91c1c' }}>
                        {errorCambioFecha}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="boton-confirmar-cotizacion"
                      disabled={cambiandoFecha}
                    >
                      {cambiandoFecha
                        ? 'Guardando cambio...'
                        : 'Guardar nueva fecha'}
                    </button>

                    <button
                      type="button"
                      className="boton-cerrar-consulta"
                      onClick={() => {
                        setMostrarCambioFecha(false);
                        setErrorCambioFecha('');
                      }}
                    >
                      Volver
                    </button>
                  </form>
                )}

                {mensajeCambioFecha && (
                  <p role="status" style={{ color: '#047857', marginTop: '15px' }}>
                    {mensajeCambioFecha}
                  </p>
                )}

                {reservaConsultada.estado_reservacion === 'Confirmada' && (
                  <button
                    type="button"
                    className="boton-cancelar-reservacion"
                    onClick={cancelarReserva}
                    disabled={cancelandoReserva}
                  >
                    {cancelandoReserva
                      ? 'Cancelando reservación...'
                      : 'Cancelar reservación'}
                  </button>
                )}

                {errorCancelacion && (
                  <p role="alert" style={{ color: '#b91c1c', marginTop: '12px' }}>
                    {errorCancelacion}
                  </p>
                )}

                {mensajeCancelacion && (
                  <p role="status" style={{ color: '#047857', marginTop: '12px' }}>
                    {mensajeCancelacion}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              className="boton-cerrar-consulta"
              onClick={() => {
                setMostrarConsulta(false);
                setReservaConsultada(null);
                setErrorConsulta('');
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
      {/* Inicio de sesión del administrador */}
      {mostrarLoginAdmin && (
        <div className="modal-fondo">
          <div className="modal-cotizacion vy-modal-login">
            <button type="button" className="modal-cerrar" aria-label="Cerrar" onClick={() => setMostrarLoginAdmin(false)}>×</button>
            <div className="vy-modal-icono" aria-hidden="true">⚙️</div>
            <h2>Administración de ViajaYa</h2>

            <p>
              Ingresa tus credenciales para acceder al panel
              de administración.
            </p>

            <form
              className="formulario-reserva"
              onSubmit={iniciarSesionAdmin}
            >
              <label>
                Usuario

                <input
                  type="text"
                  value={datosAdmin.usuario}
                  onChange={(evento) =>
                    setDatosAdmin({
                      ...datosAdmin,
                      usuario: evento.target.value
                    })
                  }
                  autoComplete="username"
                  required
                />
              </label>

              <label>
                Contraseña

                <input
                  type="password"
                  value={datosAdmin.clave}
                  onChange={(evento) =>
                    setDatosAdmin({
                      ...datosAdmin,
                      clave: evento.target.value
                    })
                  }
                  autoComplete="current-password"
                  required
                />
              </label>

              {errorLoginAdmin && (
                <p role="alert" style={{ color: '#b91c1c' }}>
                  {errorLoginAdmin}
                </p>
              )}

              <button
                type="submit"
                className="boton-confirmar-cotizacion"
                disabled={iniciandoSesionAdmin}
              >
                {iniciandoSesionAdmin
                  ? 'Ingresando...'
                  : 'Iniciar sesión'}
              </button>

              <button
                type="button"
                className="boton-cerrar-consulta"
                onClick={() => {
                  setMostrarLoginAdmin(false);
                  setDatosAdmin({
                    usuario: '',
                    clave: ''
                  });
                  setErrorLoginAdmin('');
                }}
              >
                Volver
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Panel principal del administrador */}
      {mostrarPanelAdmin && tokenAdmin && (
        <div className="modal-fondo">
          <div className="modal-cotizacion panel-admin-amplio">
            <button type="button" className="modal-cerrar" aria-label="Cerrar panel" onClick={() => setMostrarPanelAdmin(false)}>×</button>
            <div className="vy-admin-cabecera">
              <span className="vy-admin-simbolo">▥</span>
              <div>
                <h2>Panel de administración</h2>
                <p>¡Bienvenido al panel administrativo de ViajaYa!</p>
              </div>
            </div>
            <div className="vy-admin-tabs" role="tablist" aria-label="Secciones de administración">
              <button type="button" role="tab" aria-selected={pestanaAdmin === 'destinos'} className={pestanaAdmin === 'destinos' ? 'activo' : ''} onClick={() => setPestanaAdmin('destinos')}>Destinos</button>
              <button type="button" role="tab" aria-selected={pestanaAdmin === 'reservaciones'} className={pestanaAdmin === 'reservaciones' ? 'activo' : ''} onClick={() => { setPestanaAdmin('reservaciones'); cargarReservacionesAdmin(); }}>Reservaciones</button>
              <button type="button" role="tab" aria-selected={pestanaAdmin === 'pagos'} className={pestanaAdmin === 'pagos' ? 'activo' : ''} onClick={() => { setPestanaAdmin('pagos'); cargarPagosAdmin(); }}>Pagos simulados</button>
            </div>
            {pestanaAdmin === 'destinos' && (
              <div className="admin-secciones vy-seccion-destinos" role="tabpanel">
                <h3>Gestión de destinos turísticos</h3>

                <button
                  type="button"
                  className="boton-confirmar-cotizacion"
                  onClick={() => {
                    setMostrarFormularioDestino(!mostrarFormularioDestino);
                    setErrorNuevoDestino('');
                  }}
                >
                  {mostrarFormularioDestino ? 'Cerrar formulario' : '+ Agregar nuevo destino'}
                </button>

                {mostrarFormularioDestino && (
                  <form className="formulario-destino-admin" onSubmit={agregarDestino}>
                    <h3>Registrar nuevo destino turístico</h3>

                    <label>
                      Nombre del destino
                      <input
                        type="text"
                        maxLength={150}
                        required
                        value={nuevoDestino.nombre}
                        onChange={(evento) => setNuevoDestino({ ...nuevoDestino, nombre: evento.target.value })}
                      />
                    </label>

                    <label>
                      Descripción
                      <textarea
                        rows={3}
                        value={nuevoDestino.descripcion}
                        onChange={(evento) => setNuevoDestino({ ...nuevoDestino, descripcion: evento.target.value })}
                      />
                    </label>

                    <label>
                      Ubicación
                      <input
                        type="text"
                        maxLength={200}
                        required
                        value={nuevoDestino.ubicacion}
                        onChange={(evento) => setNuevoDestino({ ...nuevoDestino, ubicacion: evento.target.value })}
                      />
                    </label>

                    <label>
                      Precio base (₡)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        required
                        value={nuevoDestino.precio_base}
                        onChange={(evento) => setNuevoDestino({ ...nuevoDestino, precio_base: evento.target.value })}
                      />
                    </label>

                    <label>
                      Capacidad diaria (personas)
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={nuevoDestino.capacidad_diaria}
                        onChange={(evento) => setNuevoDestino({ ...nuevoDestino, capacidad_diaria: evento.target.value })}
                      />
                    </label>

                    <label>
                      URL de imagen (opcional)
                      <input
                        type="url"
                        placeholder="https://..."
                        value={nuevoDestino.imagen_url}
                        onChange={(evento) => setNuevoDestino({ ...nuevoDestino, imagen_url: evento.target.value })}
                      />
                    </label>

                    {errorNuevoDestino && (
                      <p role="alert" style={{ color: '#b91c1c' }}>{errorNuevoDestino}</p>
                    )}

                    <button
                      type="submit"
                      className="boton-confirmar-cotizacion"
                      disabled={guardandoDestino}
                    >
                      {guardandoDestino ? 'Guardando destino...' : 'Guardar destino'}
                    </button>
                  </form>
                )}

                {mensajeNuevoDestino && (
                  <p role="status" style={{ color: '#047857', marginTop: '15px' }}>
                    {mensajeNuevoDestino}
                  </p>
                )}

                {/* RF-07: Formulario para editar destinos turísticos */}
                {destinoEditando && (
                  <form
                    className="formulario-destino-admin"
                    onSubmit={guardarEdicionDestino}
                  >
                    <h3> Editar destino turístico</h3>

                    <label>
                      Nombre del destino
                      <input
                        type="text"
                        value={destinoEditando.nombre}
                        onChange={(evento) =>
                          setDestinoEditando({
                            ...destinoEditando,
                            nombre: evento.target.value
                          })
                        }
                        maxLength={150}
                        required
                      />
                    </label>

                    <label>
                      Descripción
                      <textarea
                        value={destinoEditando.descripcion}
                        onChange={(evento) =>
                          setDestinoEditando({
                            ...destinoEditando,
                            descripcion: evento.target.value
                          })
                        }
                        rows={3}
                      />
                    </label>

                    <label>
                      Ubicación
                      <input
                        type="text"
                        value={destinoEditando.ubicacion}
                        onChange={(evento) =>
                          setDestinoEditando({
                            ...destinoEditando,
                            ubicacion: evento.target.value
                          })
                        }
                        maxLength={200}
                        required
                      />
                    </label>

                    <label>
                      Precio base (₡)
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={destinoEditando.precio_base}
                        onChange={(evento) =>
                          setDestinoEditando({
                            ...destinoEditando,
                            precio_base: evento.target.value
                          })
                        }
                        required
                      />
                    </label>

                    <label>
                      Capacidad diaria (personas)
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={destinoEditando.capacidad_diaria}
                        onChange={(evento) =>
                          setDestinoEditando({
                            ...destinoEditando,
                            capacidad_diaria: evento.target.value
                          })
                        }
                        required
                      />
                    </label>

                    <label>
                      URL de imagen (opcional)
                      <input
                        type="url"
                        value={destinoEditando.imagen_url}
                        onChange={(evento) =>
                          setDestinoEditando({
                            ...destinoEditando,
                            imagen_url: evento.target.value
                          })
                        }
                        placeholder="https://..."
                      />
                    </label>

                    {errorEdicion && (
                      <p role="alert" style={{ color: '#b91c1c' }}>
                        {errorEdicion}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="boton-confirmar-cotizacion"
                      disabled={guardandoEdicion}
                    >
                      {guardandoEdicion
                        ? 'Guardando cambios...'
                        : 'Guardar cambios'}
                    </button>

                    <button
                      type="button"
                      className="boton-cerrar-consulta"
                      disabled={guardandoEdicion}
                      onClick={() => {
                        setDestinoEditando(null);
                        setErrorEdicion('');
                      }}
                    >
                      Cancelar edición
                    </button>
                  </form>
                )}

                {mensajeEdicion && (
                  <p
                    role="status"
                    style={{
                      color: '#047857',
                      textAlign: 'center',
                      width: '100%'
                    }}
                  >
                    {mensajeEdicion}
                  </p>
                )}

                <button
                  type="button"
                  className="boton-confirmar-cotizacion"
                  onClick={() => cargarDestinosAdmin(tokenAdmin)}
                  disabled={cargandoDestinosAdmin}
                >
                  {cargandoDestinosAdmin
                    ? 'Cargando destinos...'
                    : 'Actualizar lista de destinos'}
                </button>

                {errorDestinosAdmin && (
                  <p role="alert" style={{ color: '#b91c1c' }}>
                    {errorDestinosAdmin}
                  </p>
                )}

                {!cargandoDestinosAdmin && destinosAdmin.length === 0 && (
                  <p>No hay destinos para mostrar.</p>
                )}

                <div className="lista-destinos-admin">
                  {destinosAdmin.map((destino) => (
                    <div
                      className="tarjeta-destino-admin"
                      key={destino.id}
                    >
                      <div className="vy-destino-cabecera">
                        <div className={`vy-admin-imagen ${destino.nombre.includes('Arenal') ? 'destino-arenal' : destino.nombre.includes('Manuel Antonio') ? 'destino-manuel' : destino.nombre.includes('Monteverde') ? 'destino-monteverde' : ''}`} style={destino.imagen_url ? { backgroundImage: `url("${destino.imagen_url}")` } : undefined} aria-hidden="true" />
                        <div><h4>{destino.nombre}</h4><span>📍 {destino.ubicacion}</span></div>
                      </div>

                      <p>
                        <strong>Precio base:</strong> ₡
                        {Number(destino.precio_base).toLocaleString('es-CR')}
                      </p>

                      <p>
                        <strong>Capacidad diaria:</strong>{' '}
                        {destino.capacidad_diaria} personas
                      </p>

                      <p>
                        <strong>Estado:</strong>{' '}
                        <span
                          className={
                            destino.activo
                              ? 'estado-destino-activo'
                              : 'estado-destino-inactivo'
                          }
                        >
                          {destino.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </p>
                      <button
                        type="button"
                        className="boton-confirmar-cotizacion"
                        onClick={() => seleccionarDestinoEditar(destino)}
                      >
                        Editar destino
                      </button>

                      <button
                        type="button"
                        className="boton-confirmar-cotizacion"
                        onClick={() => cambiarEstadoDestino(destino)}
                      >
                        {destino.activo
                          ? '🔴 Desactivar destino'
                          : '🟢 Activar destino'}
                      </button>


                    </div>
                  ))}
                </div>

              </div>
            )}
            {/* RF-08: Lista de reservaciones administrativas */}
            {pestanaAdmin === 'reservaciones' && (
              <section className="admin-secciones vy-seccion-reservaciones" role="tabpanel">
                <h3> Gestión de reservaciones</h3>

                {cargandoReservacionesAdmin && <p role="status">Cargando reservaciones...</p>}

                {mensajeReservaAdmin && (
                  <p role="status" style={{ color: '#047857' }}>
                    {mensajeReservaAdmin}
                  </p>
                )}

                {errorReservacionesAdmin && (
                  <p role="alert" style={{ color: '#b91c1c' }}>
                    {errorReservacionesAdmin}
                  </p>
                )}

                {reservacionesAdmin.length === 0 &&
                  !cargandoReservacionesAdmin &&
                  !errorReservacionesAdmin && (
                    <p>
                      No hay reservaciones registradas.
                    </p>
                  )}

                {reservacionesAdmin.map((reservacion) => (
                  <div
                    key={reservacion.id}
                    className="tarjeta-destino-admin"
                  >
                    <h4>🎫 {reservacion.codigo_confirmacion}</h4>

                    <p>
                      <strong>Cliente:</strong> {reservacion.nombre_cliente}
                    </p>

                    <p>
                      <strong>Correo:</strong> {reservacion.correo_cliente}
                    </p>

                    <p>
                      <strong>Destino:</strong> {reservacion.nombre_destino}
                    </p>

                    <p>
                      <strong>Fecha de excursión:</strong>{' '}
                      {String(reservacion.fecha_excursion).slice(0, 10)}
                    </p>

                    <p>
                      <strong>Hora:</strong> {reservacion.hora_excursion}
                    </p>

                    <p>
                      <strong>Personas:</strong> {reservacion.cantidad_personas}
                    </p>

                    <p>
                      <strong>Total:</strong> ₡
                      {Number(reservacion.total).toLocaleString('es-CR')}
                    </p>

                    <p>
                      <strong>Estado de reservación:</strong> {reservacion.estado}
                    </p>

                    <p>
                      <strong>Estado de pago:</strong>{' '}
                      {reservacion.estado_pago || 'Sin pago registrado'}
                    </p>

                    <p>
                      <strong>Eliminada:</strong>{' '}
                      {reservacion.eliminada ? 'Sí' : 'No'}
                    </p>

                    {reservacion.estado === 'Confirmada' && !reservacion.eliminada && (
                      <button
                        type="button"
                        className="boton-cancelar-reservacion"
                        onClick={() => cancelarReservacionAdmin(reservacion)}
                        disabled={cancelandoReservaAdmin !== null}
                      >
                        {cancelandoReservaAdmin === reservacion.id
                          ? 'Cancelando reservación...'
                          : 'Cancelar reservación'}
                      </button>
                    )}

                    {reservacion.estado === 'Cancelada' && !reservacion.eliminada && (
                      <button
                        type="button"
                        className="boton-cancelar-reservacion"
                        onClick={() => eliminarReservacionAdmin(reservacion)}
                        disabled={eliminandoReservaAdmin !== null}
                      >
                        {eliminandoReservaAdmin === reservacion.id
                          ? 'Eliminando reservación...'
                          : 'Eliminar reservación'}
                      </button>
                    )}

                    {reservacion.estado === 'Pendiente' &&
                      reservacion.estado_pago === 'Aprobado' &&
                      !reservacion.eliminada && (
                        <button
                          type="button"
                          className="boton-confirmar-cotizacion"
                          onClick={() => aprobarReservacionAdmin(reservacion)}
                          disabled={aprobandoReservaAdmin !== null}
                        >
                          {aprobandoReservaAdmin === reservacion.id
                            ? 'Aprobando reservación...'
                            : '✅ Aprobar reservación'}
                        </button>
                      )}
                  </div>
                ))}
              </section>
            )}

            {/* RF-09: Administración de pagos simulados */}
            {pestanaAdmin === 'pagos' && (
              <section className="admin-secciones vy-seccion-pagos" role="tabpanel">
                <h3> Gestión de pagos simulados</h3>

                {cargandoPagosAdmin && <p role="status">Cargando pagos...</p>}

                {mensajePagosAdmin && (
                  <p role="status" style={{ color: '#047857' }}>
                    {mensajePagosAdmin}
                  </p>
                )}

                {errorPagosAdmin && (
                  <p role="alert" style={{ color: '#b91c1c' }}>
                    {errorPagosAdmin}
                  </p>
                )}

                {pagosConsultados &&
                  pagosAdmin.length === 0 &&
                  !cargandoPagosAdmin &&
                  !errorPagosAdmin && (
                    <p>No hay pagos registrados.</p>
                  )}

                {pagosAdmin.map((pago) => (
                  <div
                    key={pago.id}
                    className="tarjeta-destino-admin"
                  >
                    <h4>💳 Pago #{pago.id}</h4>

                    <p>
                      <strong>Reservación:</strong>{' '}
                      {pago.codigo_confirmacion}
                    </p>

                    <p>
                      <strong>Cliente:</strong>{' '}
                      {pago.nombre_cliente}
                    </p>

                    <p>
                      <strong>Destino:</strong>{' '}
                      {pago.nombre_destino}
                    </p>

                    <p>
                      <strong>Monto:</strong>{' '}
                      ₡{Number(pago.monto).toLocaleString('es-CR')}
                    </p>

                    <p>
                      <strong>Estado del pago:</strong>{' '}
                      {pago.estado}
                    </p>

                    <p>
                      <strong>Estado de reservación:</strong>{' '}
                      {pago.estado_reservacion}
                    </p>

                    <p>
                      <strong>Último dígito de tarjeta:</strong>{' '}
                      {pago.ultimo_digito_tarjeta}
                    </p>

                    <p>
                      <strong>Reservación eliminada:</strong>{' '}
                      {pago.eliminada ? 'Sí' : 'No'}
                    </p>

                    {!pago.eliminada && (
                      <div>
                        <label htmlFor={`estado-pago-${pago.id}`}>
                          <strong>Cambiar estado del pago:</strong>
                        </label>

                        <select
                          id={`estado-pago-${pago.id}`}
                          value={pago.estado}
                          disabled={cambiandoEstadoPago !== null}
                          onChange={(evento) =>
                            cambiarEstadoPagoAdmin(pago, evento.target.value)
                          }
                        >
                          <option value="Pendiente">Pendiente</option>
                          <option
                            value="Aprobado"
                            disabled={pago.estado_reservacion === 'Cancelada'}
                          >
                            Aprobado
                          </option>
                          <option value="Rechazado">Rechazado</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </section>
            )}
            <div className="vy-admin-acciones">
              <button
                type="button"
                className="boton-confirmar-cotizacion"
                onClick={() => setMostrarPanelAdmin(false)}
              >
                Volver a ViajaYa
              </button>

              <button
                type="button"
                className="boton-cerrar-consulta"
                onClick={cerrarSesionAdmin}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App