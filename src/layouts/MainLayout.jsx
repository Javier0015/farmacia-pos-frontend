import { useEffect, useRef, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, LogOut, Bell, MessageCircle, Send } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const rolesDisponibles = [
  { value: 'SUPER_ADMIN', label: 'Super administrador' },
  { value: 'CAJERO', label: 'Cajero' },
  { value: 'DOCTOR', label: 'Doctor' },
  { value: 'DOCTOR_SHADDAI', label: 'Doctor Shaddai' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { usuario } = auth;

  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false);

  const [totalAlertas, setTotalAlertas] = useState(0);
  const [alertas, setAlertas] = useState([]);
  const [mostrarAlertas, setMostrarAlertas] = useState(false);

  const alertasMovilRef = useRef(null);
  const alertasEscritorioRef = useRef(null);

  const [totalMensajes, setTotalMensajes] = useState(0);
  const [mensajesChat, setMensajesChat] = useState([]);
  const [mostrarChat, setMostrarChat] = useState(false);
  const [mensajeChat, setMensajeChat] = useState('');
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);

  const [tipoDestinoChat, setTipoDestinoChat] = useState('TODOS');
  const [destinoRolChat, setDestinoRolChat] = useState('');
  const [destinoSucursalChat, setDestinoSucursalChat] = useState('');
  const [destinoUsuarioChat, setDestinoUsuarioChat] = useState('');

  const [sucursalesChat, setSucursalesChat] = useState([]);
  const [usuariosChat, setUsuariosChat] = useState([]);

  const chatMovilRef = useRef(null);
  const chatEscritorioRef = useRef(null);

  const cerrarSesion = () => {
    if (typeof auth.logout === 'function') {
      auth.logout();
    } else if (typeof auth.cerrarSesion === 'function') {
      auth.cerrarSesion();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      localStorage.removeItem('farmacia_usuario');
      localStorage.removeItem('farmacia_token');
    }

    navigate('/', { replace: true });
  };

  const cargarTotalAlertas = async () => {
    try {
      const { data } = await api.get('/alertas/no-leidas');

      if (data.ok) {
        setTotalAlertas(data.total || 0);
      }
    } catch (error) {
      console.error('Error al cargar total de alertas:', error);
    }
  };

  const cargarMisAlertas = async () => {
    try {
      const { data } = await api.get('/alertas/mis-alertas');

      if (data.ok) {
        setAlertas(data.alertas || []);
      }
    } catch (error) {
      console.error('Error al cargar alertas:', error);
    }
  };

  const abrirAlertas = async () => {
    const nuevoEstado = !mostrarAlertas;

    setMostrarAlertas(nuevoEstado);

    if (nuevoEstado) {
      setMostrarChat(false);
      await cargarMisAlertas();
      await cargarTotalAlertas();
    }
  };

  const marcarComoLeida = async (idAlerta) => {
    try {
      await api.put(`/alertas/${idAlerta}/leer`);

      setAlertas((prev) =>
        prev.map((alerta) =>
          alerta.id_alerta === idAlerta
            ? { ...alerta, leida: true }
            : alerta
        )
      );

      await cargarTotalAlertas();
    } catch (error) {
      console.error('Error al marcar alerta como leída:', error);
    }
  };

  const clasePrioridad = (prioridad) => {
    switch (prioridad) {
      case 'URGENTE':
        return 'bg-red-50 text-red-700 border-red-100';
      case 'IMPORTANTE':
        return 'bg-amber-50 text-amber-700 border-amber-100';
      default:
        return 'bg-sky-50 text-sky-700 border-sky-100';
    }
  };

  const cargarTotalMensajes = async () => {
    try {
      const { data } = await api.get('/chat/no-leidos');

      if (data.ok) {
        setTotalMensajes(data.total || 0);
      }
    } catch (error) {
      console.error('Error al cargar total de mensajes:', error);
    }
  };

  const cargarMensajesChat = async () => {
    try {
      const { data } = await api.get('/chat/mensajes');

      if (data.ok) {
        setMensajesChat(data.mensajes || []);
      }
    } catch (error) {
      console.error('Error al cargar mensajes del chat:', error);
    }
  };

  const cargarSucursalesChat = async () => {
    try {
      const { data } = await api.get('/sucursales');

      if (data.ok) {
        setSucursalesChat((data.sucursales || []).filter((s) => s.activo));
      }
    } catch (error) {
      console.error('Error al cargar sucursales para chat:', error);
    }
  };

  const cargarUsuariosChat = async () => {
    try {
      const { data } = await api.get('/usuarios');

      if (data.ok) {
        const usuariosActivos = (data.usuarios || []).filter((u) => {
          return u.activo && Number(u.id_usuario) !== Number(usuario?.id_usuario);
        });

        setUsuariosChat(usuariosActivos);
      }
    } catch (error) {
      console.error('Error al cargar usuarios para chat:', error);
    }
  };

  const marcarChatComoLeido = async () => {
    try {
      await api.put('/chat/leer');
      setTotalMensajes(0);
    } catch (error) {
      console.error('Error al marcar chat como leído:', error);
    }
  };

  const marcarTodasAlertasComoLeidas = async () => {
    try {
      await api.put('/alertas/leer-todas');

      setAlertas((prev) =>
        prev.map((alerta) => ({
          ...alerta,
          leida: true,
        }))
      );

      setTotalAlertas(0);
      await cargarMisAlertas();
      await cargarTotalAlertas();
    } catch (error) {
      console.error('Error al marcar todas las alertas como leídas:', error);
    }
  };

  const abrirChat = async () => {
    const nuevoEstado = !mostrarChat;

    setMostrarChat(nuevoEstado);

    if (nuevoEstado) {
      setMostrarAlertas(false);
      await cargarMensajesChat();
      await cargarSucursalesChat();
      await cargarUsuariosChat();
      await marcarChatComoLeido();
    }
  };

  const limpiarDestinoChat = (tipo) => {
    setTipoDestinoChat(tipo);
    setDestinoRolChat('');
    setDestinoSucursalChat('');
    setDestinoUsuarioChat('');
  };

  const validarDestinoChat = () => {
    if (tipoDestinoChat === 'ROL' && !destinoRolChat) return false;
    if (tipoDestinoChat === 'SUCURSAL' && !destinoSucursalChat) return false;
    if (tipoDestinoChat === 'USUARIO' && !destinoUsuarioChat) return false;

    return true;
  };

  const obtenerEtiquetaDestino = (mensaje) => {
    if (mensaje.tipo_destino === 'ROL') {
      return `Rol: ${mensaje.destino_rol}`;
    }

    if (mensaje.tipo_destino === 'SUCURSAL') {
      return mensaje.sucursal ? `Sucursal: ${mensaje.sucursal}` : 'Sucursal';
    }

    if (mensaje.tipo_destino === 'USUARIO') {
      return mensaje.usuario_destino
        ? `Para: ${mensaje.usuario_destino}`
        : 'Mensaje directo';
    }

    return 'Todos';
  };

  const enviarMensajeChat = async (e) => {
    e.preventDefault();

    const texto = mensajeChat.trim();

    if (!texto) return;
    if (!validarDestinoChat()) return;

    try {
      setEnviandoMensaje(true);

      const payload = {
        mensaje: texto,
        tipo_destino: tipoDestinoChat,
      };

      if (tipoDestinoChat === 'ROL') {
        payload.destino_rol = destinoRolChat;
      }

      if (tipoDestinoChat === 'SUCURSAL') {
        payload.id_sucursal = Number(destinoSucursalChat);
      }

      if (tipoDestinoChat === 'USUARIO') {
        payload.id_usuario_destino = Number(destinoUsuarioChat);
      }

      const { data } = await api.post('/chat/mensajes', payload);

      if (data.ok) {
        setMensajeChat('');

        const usuarioDestino = usuariosChat.find(
          (u) => Number(u.id_usuario) === Number(destinoUsuarioChat)
        );

        const sucursalDestino = sucursalesChat.find(
          (s) => Number(s.id_sucursal) === Number(destinoSucursalChat)
        );

        setMensajesChat((prev) => [
          ...prev,
          {
            id_mensaje: data.chat.id_mensaje,
            id_usuario_emisor: data.chat.id_usuario_emisor,
            usuario_emisor: usuario?.nombre || usuario?.usuario || 'Yo',
            rol_emisor: usuario?.rol || '',
            mensaje: data.chat.mensaje,
            tipo_destino: data.chat.tipo_destino,
            destino_rol: data.chat.destino_rol,
            id_sucursal: data.chat.id_sucursal,
            sucursal: sucursalDestino?.nombre || null,
            id_usuario_destino: data.chat.id_usuario_destino,
            usuario_destino: usuarioDestino?.nombre || null,
            fecha_envio: data.chat.fecha_envio,
            leido: true,
            es_mio: true,
          },
        ]);

        await cargarMensajesChat();
        await cargarTotalMensajes();
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
    } finally {
      setEnviandoMensaje(false);
    }
  };

  const formatoHoraChat = (fecha) => {
    if (!fecha) return '';

    return new Date(fecha).toLocaleString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
    });
  };

  const obtenerClaveFecha = (fecha) => {
    if (!fecha) return '';

    const d = new Date(fecha);

    return d.toLocaleDateString('es-MX', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const obtenerEtiquetaFechaChat = (fecha) => {
    if (!fecha) return '';

    const fechaMensaje = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date();

    ayer.setDate(hoy.getDate() - 1);

    const claveMensaje = obtenerClaveFecha(fechaMensaje);
    const claveHoy = obtenerClaveFecha(hoy);
    const claveAyer = obtenerClaveFecha(ayer);

    if (claveMensaje === claveHoy) return 'Hoy';
    if (claveMensaje === claveAyer) return 'Ayer';

    return fechaMensaje.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  useEffect(() => {
    if (usuario) {
      cargarTotalAlertas();
      cargarTotalMensajes();

      const intervalo = setInterval(() => {
        cargarTotalAlertas();
        cargarTotalMensajes();

        if (mostrarChat) {
          cargarMensajesChat();
        }
      }, 15000);

      return () => clearInterval(intervalo);
    }
  }, [usuario, mostrarChat]);

  useEffect(() => {
    const cerrarSiClickFuera = (event) => {
      const clickDentroAlertasMovil =
        alertasMovilRef.current &&
        alertasMovilRef.current.contains(event.target);

      const clickDentroAlertasEscritorio =
        alertasEscritorioRef.current &&
        alertasEscritorioRef.current.contains(event.target);

      const clickDentroChatMovil =
        chatMovilRef.current &&
        chatMovilRef.current.contains(event.target);

      const clickDentroChatEscritorio =
        chatEscritorioRef.current &&
        chatEscritorioRef.current.contains(event.target);

      if (
        mostrarAlertas &&
        !clickDentroAlertasMovil &&
        !clickDentroAlertasEscritorio
      ) {
        setMostrarAlertas(false);
      }

      if (
        mostrarChat &&
        !clickDentroChatMovil &&
        !clickDentroChatEscritorio
      ) {
        setMostrarChat(false);
      }
    };

    document.addEventListener('mousedown', cerrarSiClickFuera);

    return () => {
      document.removeEventListener('mousedown', cerrarSiClickFuera);
    };
  }, [mostrarAlertas, mostrarChat]);

  const renderPanelChat = () => (
    <div
      className="
        fixed lg:absolute
        left-3 right-3 lg:left-auto lg:right-0
        top-[4.75rem] lg:top-14
        lg:w-[460px]
        max-w-none lg:max-w-[calc(100vw-2rem)]
        max-h-[calc(100vh-5.5rem)] lg:max-h-[calc(100vh-6rem)]
        bg-white rounded-2xl lg:rounded-3xl
        shadow-2xl border border-slate-100
        z-50 overflow-hidden
        flex flex-col
      "
    >
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 flex items-start justify-between gap-3 shrink-0">
        <div className="min-w-0">
          <h3 className="font-bold text-slate-800">Chat interno</h3>
          <p className="text-xs text-slate-500">
            Mensajes entre usuarios del sistema
          </p>
        </div>

        {totalMensajes > 0 && (
          <span className="px-3 py-1 rounded-full bg-sky-100 text-sky-700 text-xs font-bold shrink-0">
            {totalMensajes} nuevos
          </span>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 bg-slate-50 space-y-3 overscroll-contain">
        {mensajesChat.length === 0 ? (
          <div className="min-h-72 flex flex-col items-center justify-center text-center text-slate-500">
            <MessageCircle size={34} className="mb-3 text-slate-400" />
            <p className="font-semibold">Sin mensajes</p>
            <p className="text-sm">Escribe el primer mensaje del chat.</p>
          </div>
        ) : (
          mensajesChat.map((mensaje, index) => {
            const fechaActual = obtenerClaveFecha(mensaje.fecha_envio);
            const fechaAnterior =
              index > 0
                ? obtenerClaveFecha(mensajesChat[index - 1].fecha_envio)
                : null;

            const mostrarSeparadorFecha = fechaActual !== fechaAnterior;

            return (
              <div key={mensaje.id_mensaje}>
                {mostrarSeparadorFecha && (
                  <div className="sticky top-2 z-10 flex justify-center my-3">
                    <span className="px-3 py-1 rounded-full bg-slate-200/95 text-slate-700 text-xs font-bold shadow-sm backdrop-blur border border-slate-300/40">
                      {obtenerEtiquetaFechaChat(mensaje.fecha_envio)}
                    </span>
                  </div>
                )}

                <div
                  className={`flex ${mensaje.es_mio ? 'justify-end' : 'justify-start'
                    }`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[82%] rounded-2xl px-4 py-3 shadow-sm min-w-0 ${mensaje.es_mio
                        ? 'bg-sky-700 text-white rounded-br-md'
                        : 'bg-white text-slate-800 border border-slate-100 rounded-bl-md'
                      }`}
                  >
                    {!mensaje.es_mio && (
                      <p className="text-xs font-bold text-sky-700 mb-1 break-words">
                        {mensaje.usuario_emisor || 'Usuario'}
                      </p>
                    )}

                    <p className="text-sm leading-relaxed break-words whitespace-pre-wrap">
                      {mensaje.mensaje}
                    </p>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                      <span
                        className={`w-fit text-[10px] px-2 py-0.5 rounded-full break-words ${mensaje.es_mio
                            ? 'bg-white/15 text-sky-50'
                            : 'bg-slate-100 text-slate-500'
                          }`}
                      >
                        {obtenerEtiquetaDestino(mensaje)}
                      </span>

                      <span
                        className={`text-[10px] ${mensaje.es_mio ? 'text-sky-100' : 'text-slate-400'
                          }`}
                      >
                        {formatoHoraChat(mensaje.fecha_envio)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-3 sm:px-4 pt-4 border-t border-slate-100 bg-white shrink-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={tipoDestinoChat}
            onChange={(e) => limpiarDestinoChat(e.target.value)}
            className="w-full min-w-0 px-3 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
          >
            <option value="TODOS">Enviar a todos</option>
            <option value="ROL">Enviar por rol</option>
            <option value="SUCURSAL">Enviar a sucursal</option>
            <option value="USUARIO">Enviar a usuario</option>
          </select>

          {tipoDestinoChat === 'ROL' && (
            <select
              value={destinoRolChat}
              onChange={(e) => setDestinoRolChat(e.target.value)}
              className="w-full min-w-0 px-3 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
            >
              <option value="">Selecciona rol</option>
              {rolesDisponibles.map((rol) => (
                <option key={rol.value} value={rol.value}>
                  {rol.label}
                </option>
              ))}
            </select>
          )}

          {tipoDestinoChat === 'SUCURSAL' && (
            <select
              value={destinoSucursalChat}
              onChange={(e) => setDestinoSucursalChat(e.target.value)}
              className="w-full min-w-0 px-3 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
            >
              <option value="">Selecciona sucursal</option>
              {sucursalesChat.map((sucursal) => (
                <option key={sucursal.id_sucursal} value={sucursal.id_sucursal}>
                  {sucursal.nombre}
                </option>
              ))}
            </select>
          )}

          {tipoDestinoChat === 'USUARIO' && (
            <select
              value={destinoUsuarioChat}
              onChange={(e) => setDestinoUsuarioChat(e.target.value)}
              className="w-full min-w-0 px-3 py-2 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm bg-white"
            >
              <option value="">Selecciona usuario</option>
              {usuariosChat.map((u) => (
                <option key={u.id_usuario} value={u.id_usuario}>
                  {u.nombre || u.usuario} · {u.rol}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <form
        onSubmit={enviarMensajeChat}
        className="p-3 sm:p-4 bg-white flex items-center gap-2 shrink-0"
      >
        <input
          value={mensajeChat}
          onChange={(e) => setMensajeChat(e.target.value)}
          placeholder="Escribe un mensaje..."
          className="flex-1 min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
        />

        <button
          type="submit"
          disabled={
            enviandoMensaje ||
            !mensajeChat.trim() ||
            !validarDestinoChat()
          }
          className="w-11 h-11 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white flex items-center justify-center transition disabled:opacity-50 shrink-0"
          title="Enviar mensaje"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );

  const renderPanelAlertas = (escritorio = false) => (
    <div
      className={`
        fixed lg:absolute
        left-3 right-3 lg:left-auto lg:right-0
        top-[4.75rem] lg:top-14
        ${escritorio ? 'lg:w-96' : 'lg:w-80'}
        max-w-none lg:max-w-[calc(100vw-2rem)]
        max-h-[calc(100vh-5.5rem)] lg:max-h-[calc(100vh-6rem)]
        bg-white rounded-2xl lg:rounded-3xl
        shadow-2xl border border-slate-100
        z-50 overflow-hidden
        flex flex-col
      `}
    >
      <div className="px-4 sm:px-5 py-4 border-b border-slate-100 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800">Alertas</h3>
            <p className="text-xs text-slate-500">
              {escritorio
                ? 'Notificaciones recientes de los últimos 7 días'
                : 'Últimos 7 días'}
            </p>
          </div>

          {totalAlertas > 0 && (
            <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold shrink-0">
              {totalAlertas} nuevas
            </span>
          )}
        </div>

        {totalAlertas > 0 && (
          <button
            type="button"
            onClick={marcarTodasAlertasComoLeidas}
            className="mt-3 w-full inline-flex items-center justify-center px-4 py-2 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {alertas.length === 0 ? (
          <div className="p-6 text-center text-slate-500">
            No tienes alertas.
          </div>
        ) : (
          alertas.map((alerta) => (
            <button
              key={alerta.id_alerta}
              type="button"
              onClick={() => marcarComoLeida(alerta.id_alerta)}
              className={`w-full text-left px-4 sm:px-5 py-4 border-b border-slate-100 hover:bg-slate-50 transition ${!alerta.leida ? 'bg-sky-50/40' : 'bg-white'
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 break-words">
                    {alerta.titulo}
                  </p>
                  <p className="text-sm text-slate-600 mt-1 line-clamp-2 break-words">
                    {alerta.mensaje}
                  </p>
                </div>

                {!alerta.leida && (
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-600 mt-2 shrink-0" />
                )}
              </div>

              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span
                  className={`w-fit text-[11px] font-bold px-2.5 py-1 rounded-full border ${clasePrioridad(
                    alerta.prioridad
                  )}`}
                >
                  {alerta.prioridad}
                </span>

                <span className="text-[11px] text-slate-400">
                  {new Date(alerta.fecha_creacion).toLocaleString('es-MX', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-slate-100 flex overflow-hidden">
      <Sidebar />

      {menuMovilAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMenuMovilAbierto(false)}
          />

          <div className="relative h-screen w-72 max-w-[85vw] shadow-2xl">
            <Sidebar
              modoMovil
              onNavigate={() => setMenuMovilAbierto(false)}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden">
        <header className="lg:hidden bg-white border-b border-slate-200 px-3 sm:px-4 py-3 shrink-0 z-40">
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            <button
              onClick={() => setMenuMovilAbierto(true)}
              className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0"
            >
              <Menu size={22} />
            </button>

            <div className="flex-1 text-right min-w-0">
              <p className="text-sm font-bold text-slate-800 truncate">
                Farmacias Shaddai 
              </p>
              <p className="text-xs text-slate-500 truncate">
                {usuario?.nombre || usuario?.usuario || 'Farmacia multi-sucursal'}
              </p>
            </div>

            <div className="relative shrink-0" ref={chatMovilRef}>
              <button
                type="button"
                onClick={abrirChat}
                className="relative w-11 h-11 rounded-2xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 flex items-center justify-center transition"
                title="Chat"
              >
                <MessageCircle size={20} />

                {totalMensajes > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-white">
                    {totalMensajes > 99 ? '99+' : totalMensajes}
                  </span>
                )}
              </button>

              {mostrarChat && renderPanelChat()}
            </div>

            <div className="relative shrink-0" ref={alertasMovilRef}>
              <button
                type="button"
                onClick={abrirAlertas}
                className="relative w-11 h-11 rounded-2xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 flex items-center justify-center transition"
                title="Alertas"
              >
                <Bell size={20} />

                {totalAlertas > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-400 text-slate-900 text-[11px] font-black flex items-center justify-center border-2 border-white">
                    {totalAlertas > 99 ? '99+' : totalAlertas}
                  </span>
                )}
              </button>

              {mostrarAlertas && renderPanelAlertas()}
            </div>

            <button
              onClick={cerrarSesion}
              className="w-11 h-11 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-600 hover:text-white transition shrink-0"
              title="Cerrar sesión"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <header className="hidden lg:flex bg-white border-b border-slate-200 px-8 py-4 items-center justify-between shrink-0 z-30">
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Sesión activa</p>
            <h2 className="text-lg font-bold text-slate-800 truncate">
             Hola, {usuario?.nombre || usuario?.usuario || 'Usuario'}
            </h2>
          </div>

          <div className="flex items-center gap-3 relative shrink-0">
            <div className="relative" ref={chatEscritorioRef}>
              <button
                type="button"
                onClick={abrirChat}
                className="relative w-11 h-11 rounded-2xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 flex items-center justify-center transition"
                title="Chat"
              >
                <MessageCircle size={21} />

                {totalMensajes > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-black flex items-center justify-center border-2 border-white">
                    {totalMensajes > 99 ? '99+' : totalMensajes}
                  </span>
                )}
              </button>

              {mostrarChat && renderPanelChat()}
            </div>

            <div className="relative" ref={alertasEscritorioRef}>
              <button
                type="button"
                onClick={abrirAlertas}
                className="relative w-11 h-11 rounded-2xl bg-slate-100 hover:bg-sky-50 hover:text-sky-700 flex items-center justify-center transition"
                title="Alertas"
              >
                <Bell size={21} />

                {totalAlertas > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-400 text-slate-900 text-[11px] font-black flex items-center justify-center border-2 border-white">
                    {totalAlertas > 99 ? '99+' : totalAlertas}
                  </span>
                )}
              </button>

              {mostrarAlertas && renderPanelAlertas(true)}
            </div>

            <div className="text-right max-w-[180px]">
              <p className="text-sm font-bold text-slate-800 truncate">
                {usuario?.rol || 'Sin rol'}
              </p>
              <p className="text-xs text-slate-500">Farmacias Shaddai</p>
            </div>

            <button
              onClick={cerrarSesion}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white transition font-bold text-sm"
              title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
