import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Wallet,
  RefreshCw,
  LockKeyhole,
  UnlockKeyhole,
  PlusCircle,
  MinusCircle,
  History,
  X,
  Save,
  Calculator,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  esSuperAdmin,
  obtenerSucursalInicial,
  filtrarSucursalesPorRol,
} from '../../utils/sucursalPermisos';

const movimientoInicial = {
  tipo_movimiento: 'ENTRADA',
  concepto: '',
  monto: '',
  metodo_pago: 'EFECTIVO',
  referencia: '',
  observaciones: '',
};

const tiposMovimiento = [
  { value: 'ENTRADA', label: 'Entrada de efectivo' },
  { value: 'SALIDA', label: 'Salida de efectivo' },
  { value: 'GASTO', label: 'Gasto operativo' },
  { value: 'RETIRO', label: 'Retiro de caja' },
  { value: 'PAGO_PROVEEDOR', label: 'Pago a proveedor' },
  { value: 'DEVOLUCION', label: 'Devolución' },
  { value: 'AJUSTE', label: 'Ajuste de caja' },
];

const denominacionesCaja = [
  { tipo: 'Billete', valor: 1000 },
  { tipo: 'Billete', valor: 500 },
  { tipo: 'Billete', valor: 200 },
  { tipo: 'Billete', valor: 100 },
  { tipo: 'Billete', valor: 50 },
  { tipo: 'Billete', valor: 20 },
  { tipo: 'Moneda', valor: 20 },
  { tipo: 'Moneda', valor: 10 },
  { tipo: 'Moneda', valor: 5 },
  { tipo: 'Moneda', valor: 2 },
  { tipo: 'Moneda', valor: 1 },
  { tipo: 'Moneda', valor: 0.5 },
];

export default function Caja() {
  const { usuario } = useAuth();

  const puedeCambiarSucursal = esSuperAdmin(usuario);

  const [sucursales, setSucursales] = useState([]);
  const [cajas, setCajas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);

  const [idSucursal, setIdSucursal] = useState('');
  const [idCaja, setIdCaja] = useState('');

  const [sesionAbierta, setSesionAbierta] = useState(null);
  const [resumenCaja, setResumenCaja] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [modalAbrir, setModalAbrir] = useState(false);
  const [modalMovimiento, setModalMovimiento] = useState(false);
  const [modalCerrar, setModalCerrar] = useState(false);
  const [modalMovimientos, setModalMovimientos] = useState(false);

  const [montoInicial, setMontoInicial] = useState('');
  const [montoFinalReal, setMontoFinalReal] = useState('');
  const [observacionesCierre, setObservacionesCierre] = useState('');
  const [conteoEfectivo, setConteoEfectivo] = useState({});
  const [formMovimiento, setFormMovimiento] = useState(movimientoInicial);

  const formatoMoneda = (valor) => {
    return Number(valor || 0).toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
    });
  };

  const formatoFecha = (fecha) => {
    if (!fecha) return '—';

    return new Date(fecha).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const sucursalActual = useMemo(() => {
    return sucursales.find((s) => Number(s.id_sucursal) === Number(idSucursal));
  }, [sucursales, idSucursal]);

  const cajaActual = useMemo(() => {
    return cajas.find((c) => Number(c.id_caja) === Number(idCaja));
  }, [cajas, idCaja]);

  const estadoAbierta = Boolean(sesionAbierta);
  const resumen = resumenCaja?.resumen;

  const diferenciaActual =
    montoFinalReal === ''
      ? 0
      : Number(montoFinalReal || 0) - Number(resumen?.monto_final_sistema || 0);

  const totalConteoEfectivo = useMemo(() => {
    return denominacionesCaja.reduce((acc, denominacion) => {
      const cantidad = Number(conteoEfectivo[denominacion.valor] || 0);
      return acc + cantidad * Number(denominacion.valor);
    }, 0);
  }, [conteoEfectivo]);

  const cargarSucursales = async () => {
    try {
      const { data } = await api.get('/sucursales');

      if (data.ok) {
        const activas = (data.sucursales || []).filter((s) => s.activo);
        const sucursalesPermitidas = filtrarSucursalesPorRol(usuario, activas);

        setSucursales(sucursalesPermitidas);

        if (!idSucursal) {
          setIdSucursal(obtenerSucursalInicial(usuario, sucursalesPermitidas));
        }
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las sucursales.',
      });
    }
  };

  const cargarCajas = async () => {
    if (!idSucursal) return;

    try {
      setCargando(true);

      const { data } = await api.get(`/caja/cajas?sucursal=${idSucursal}`);

      if (data.ok) {
        const cajasActivas = (data.cajas || []).filter((c) => c.activo);
        setCajas(cajasActivas);

        if (
          !idCaja ||
          !cajasActivas.some((c) => Number(c.id_caja) === Number(idCaja))
        ) {
          setIdCaja(cajasActivas[0]?.id_caja || '');
        }
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar las cajas.',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarSesionAbierta = async () => {
    if (!idCaja) {
      setSesionAbierta(null);
      setResumenCaja(null);
      setMovimientos([]);
      return;
    }

    try {
      setCargando(true);

      const { data } = await api.get(`/caja/sesion-abierta?id_caja=${idCaja}`);

      if (data.ok) {
        setSesionAbierta(data.sesion_abierta);

        if (data.sesion_abierta?.id_sesion) {
          await cargarResumen(data.sesion_abierta.id_sesion);
          await cargarMovimientos(data.sesion_abierta.id_sesion, false);
        } else {
          setResumenCaja(null);
          setMovimientos([]);
        }
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo consultar la sesión de caja.',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarResumen = async (idSesion = sesionAbierta?.id_sesion) => {
    if (!idSesion) return;

    try {
      const { data } = await api.get(`/caja/resumen?id_sesion=${idSesion}`);

      if (data.ok) {
        setResumenCaja(data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const cargarMovimientos = async (
    idSesion = sesionAbierta?.id_sesion,
    mostrarError = true
  ) => {
    if (!idSesion) return;

    try {
      const { data } = await api.get(`/caja/movimientos?id_sesion=${idSesion}`);

      if (data.ok) {
        setMovimientos(data.movimientos || []);
      }
    } catch (error) {
      console.error(error);

      if (mostrarError) {
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'No se pudieron cargar los movimientos.',
        });
      }
    }
  };

  useEffect(() => {
    if (usuario) {
      cargarSucursales();
    }
  }, [usuario]);

  useEffect(() => {
    if (idSucursal) {
      setSesionAbierta(null);
      setResumenCaja(null);
      setMovimientos([]);
      cargarCajas();
    }
  }, [idSucursal]);

  useEffect(() => {
    if (idCaja) {
      cargarSesionAbierta();
    }
  }, [idCaja]);

  const refrescarTodo = async () => {
    await cargarCajas();
    await cargarSesionAbierta();
  };

  const abrirCaja = async (e) => {
    e.preventDefault();

    if (!idSucursal || !idCaja) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Selecciona una sucursal y una caja.',
      });
      return;
    }

    if (montoInicial === '' || Number(montoInicial) < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto inválido',
        text: 'El monto inicial no puede ser negativo.',
      });
      return;
    }

    try {
      setGuardando(true);

      const { data } = await api.post('/caja/abrir', {
        id_caja: Number(idCaja),
        id_sucursal: Number(idSucursal),
        monto_inicial: Number(montoInicial || 0),
      });

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Caja abierta',
          text: data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        setModalAbrir(false);
        setMontoInicial('');
        await cargarSesionAbierta();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo abrir la caja.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const registrarMovimiento = async (e) => {
    e.preventDefault();

    if (!sesionAbierta) {
      Swal.fire({
        icon: 'warning',
        title: 'Caja cerrada',
        text: 'Primero debes abrir una caja.',
      });
      return;
    }

    if (!formMovimiento.concepto.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Concepto obligatorio',
        text: 'Ingresa el concepto del movimiento.',
      });
      return;
    }

    if (formMovimiento.monto === '' || Number(formMovimiento.monto) <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto inválido',
        text: 'El monto debe ser mayor a cero.',
      });
      return;
    }

    try {
      setGuardando(true);

      const payload = {
        id_sesion: Number(sesionAbierta.id_sesion),
        id_sucursal: Number(idSucursal),
        tipo_movimiento: formMovimiento.tipo_movimiento,
        concepto: formMovimiento.concepto,
        monto: Number(formMovimiento.monto),
        metodo_pago: formMovimiento.metodo_pago,
        referencia: formMovimiento.referencia || null,
        observaciones: formMovimiento.observaciones || null,
      };

      const { data } = await api.post('/caja/movimiento', payload);

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Movimiento registrado',
          text: data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        setModalMovimiento(false);
        setFormMovimiento(movimientoInicial);
        await cargarResumen();
        await cargarMovimientos();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo registrar el movimiento.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const cerrarCaja = async (e) => {
    e.preventDefault();

    if (!sesionAbierta) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay caja abierta',
        text: 'No existe una sesión abierta para cerrar.',
      });
      return;
    }

    if (montoFinalReal === '' || Number(montoFinalReal) < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Monto inválido',
        text: 'El monto final contado no puede ser negativo.',
      });
      return;
    }

    const montoSistema = Number(resumenCaja?.resumen?.monto_final_sistema || 0);
    const diferencia = Number(montoFinalReal) - montoSistema;

    const confirmacion = await Swal.fire({
      icon: diferencia === 0 ? 'question' : 'warning',
      title: '¿Cerrar caja?',
      html: `
        <div style="text-align:left">
          <p><b>Monto sistema:</b> ${formatoMoneda(montoSistema)}</p>
          <p><b>Monto contado:</b> ${formatoMoneda(montoFinalReal)}</p>
          <p><b>Diferencia:</b> ${formatoMoneda(diferencia)}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, cerrar caja',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#059669',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      setGuardando(true);

      const { data } = await api.post('/caja/cerrar', {
        id_sesion: Number(sesionAbierta.id_sesion),
        monto_final_real: Number(montoFinalReal),
        observaciones: observacionesCierre || null,
      });

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Caja cerrada',
          text: data.mensaje,
        });

        setModalCerrar(false);
        setMontoFinalReal('');
        setObservacionesCierre('');
        setConteoEfectivo({});
        setSesionAbierta(null);
        setResumenCaja(null);
        setMovimientos([]);

        await cargarSesionAbierta();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.mensaje || 'No se pudo cerrar la caja.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const abrirModalMovimiento = (tipo = 'ENTRADA') => {
    if (!sesionAbierta) {
      Swal.fire({
        icon: 'warning',
        title: 'Caja cerrada',
        text: 'Primero debes abrir una caja.',
      });
      return;
    }

    setFormMovimiento({
      ...movimientoInicial,
      tipo_movimiento: tipo,
    });

    setModalMovimiento(true);
  };

  const abrirModalCerrar = async () => {
    if (!sesionAbierta) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay caja abierta',
        text: 'Primero debes abrir una caja.',
      });
      return;
    }

    await cargarResumen();

    const montoSistema = Number(resumenCaja?.resumen?.monto_final_sistema || 0);

    setConteoEfectivo({});
    setMontoFinalReal(String(montoSistema));
    setModalCerrar(true);
  };

  const abrirModalMovimientos = async () => {
    if (!sesionAbierta) {
      Swal.fire({
        icon: 'warning',
        title: 'No hay caja abierta',
        text: 'Primero debes abrir una caja.',
      });
      return;
    }

    await cargarMovimientos();
    setModalMovimientos(true);
  };

  const cambiarConteoEfectivo = (valor, cantidad) => {
    const cantidadLimpia = Math.max(Number(cantidad || 0), 0);

    setConteoEfectivo((prev) => ({
      ...prev,
      [valor]: cantidadLimpia,
    }));
  };

  const aplicarConteoEfectivo = () => {
    setMontoFinalReal(totalConteoEfectivo.toFixed(2));
  };

  const limpiarConteoEfectivo = () => {
    setConteoEfectivo({});
    setMontoFinalReal('');
  };

  const claseMovimiento = (tipo) => {
    if (['ENTRADA', 'VENTA', 'APERTURA'].includes(tipo)) {
      return 'bg-sky-100 text-sky-700';
    }

    if (
      [
        'SALIDA',
        'GASTO',
        'RETIRO',
        'PAGO_PROVEEDOR',
        'DEVOLUCION',
      ].includes(tipo)
    ) {
      return 'bg-red-100 text-red-700';
    }

    return 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-5 sm:space-y-6 pb-8">
      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Wallet size={25} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 break-words">
                Caja
              </h1>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                Apertura, movimientos, resumen y corte de caja.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:flex gap-3 w-full xl:w-auto">
            <button
              onClick={refrescarTodo}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
            >
              <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
              Actualizar
            </button>

            {!estadoAbierta ? (
              <button
                onClick={() => setModalAbrir(true)}
                disabled={!idCaja}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-lg shadow-sky-900/20 transition disabled:opacity-50"
              >
                <UnlockKeyhole size={19} />
                Abrir caja
              </button>
            ) : (
              <button
                onClick={abrirModalCerrar}
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-900/20 transition"
              >
                <LockKeyhole size={19} />
                Cerrar caja
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="min-w-0">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Sucursal
            </label>

            {puedeCambiarSucursal ? (
              <select
                value={idSucursal}
                onChange={(e) => {
                  setIdSucursal(e.target.value);
                  setIdCaja('');
                }}
                className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="">Selecciona sucursal</option>
                {sucursales.map((sucursal) => (
                  <option
                    key={sucursal.id_sucursal}
                    value={sucursal.id_sucursal}
                  >
                    {sucursal.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold truncate">
                {sucursalActual?.nombre ||
                  sucursales[0]?.nombre ||
                  'Sucursal asignada'}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Caja
            </label>
            <select
              value={idCaja}
              onChange={(e) => setIdCaja(e.target.value)}
              className="w-full min-w-0 px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="">Selecciona caja</option>
              {cajas.map((caja) => (
                <option key={caja.id_caja} value={caja.id_caja}>
                  {caja.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div
          className={`rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border min-w-0 ${
            estadoAbierta
              ? 'bg-sky-700 text-white border-sky-600'
              : 'bg-slate-900 text-white border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">
              {estadoAbierta ? (
                <UnlockKeyhole size={24} />
              ) : (
                <LockKeyhole size={24} />
              )}
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/15 shrink-0">
              {estadoAbierta ? 'ABIERTA' : 'CERRADA'}
            </span>
          </div>

          <p className="text-sm mt-5 opacity-80">Estado actual</p>
          <h3 className="text-2xl sm:text-3xl font-bold mt-1 break-words">
            {estadoAbierta ? 'Caja abierta' : 'Sin sesión'}
          </h3>

          <p className="text-sm mt-3 opacity-80 break-words">
            {estadoAbierta
              ? `Apertura: ${formatoFecha(sesionAbierta?.fecha_apertura)}`
              : 'Abre caja para comenzar operaciones.'}
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <DollarSign size={24} />
          </div>

          <p className="text-sm text-slate-500 mt-5">Monto inicial</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-words">
            {formatoMoneda(sesionAbierta?.monto_inicial)}
          </h3>

          <p className="text-sm text-slate-400 mt-2 truncate">
            {cajaActual?.nombre || 'Sin caja seleccionada'}
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Calculator size={24} />
          </div>

          <p className="text-sm text-slate-500 mt-5">Monto esperado</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 mt-1 break-words">
            {formatoMoneda(resumen?.monto_final_sistema)}
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Según movimientos registrados
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <p className="text-sm text-slate-500">Ventas efectivo</p>
          <h3 className="text-2xl font-bold text-sky-700 mt-1 break-words">
            {formatoMoneda(resumen?.ventas_efectivo)}
          </h3>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <p className="text-sm text-slate-500">Entradas efectivo</p>
          <h3 className="text-2xl font-bold text-blue-700 mt-1 break-words">
            {formatoMoneda(resumen?.entradas_efectivo)}
          </h3>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <p className="text-sm text-slate-500">Salidas / gastos</p>
          <h3 className="text-2xl font-bold text-red-700 mt-1 break-words">
            {formatoMoneda(
              Number(resumen?.salidas_efectivo || 0) +
                Number(resumen?.gastos_efectivo || 0) +
                Number(resumen?.retiros_efectivo || 0) +
                Number(resumen?.pagos_proveedor_efectivo || 0)
            )}
          </h3>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <p className="text-sm text-slate-500">Devoluciones</p>
          <h3 className="text-2xl font-bold text-amber-700 mt-1 break-words">
            {formatoMoneda(resumen?.devoluciones_efectivo)}
          </h3>
        </div>
      </section>

      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold text-slate-800">
              Operaciones de caja
            </h2>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
              Registra entradas, salidas, gastos y consulta movimientos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full xl:w-auto">
            <button
              onClick={() => abrirModalMovimiento('ENTRADA')}
              disabled={!estadoAbierta}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-100 hover:bg-sky-200 text-sky-800 font-bold transition disabled:opacity-50"
            >
              <PlusCircle size={19} />
              Entrada
            </button>

            <button
              onClick={() => abrirModalMovimiento('GASTO')}
              disabled={!estadoAbierta}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-red-100 hover:bg-red-200 text-red-800 font-bold transition disabled:opacity-50"
            >
              <MinusCircle size={19} />
              Salida / gasto
            </button>

            <button
              onClick={abrirModalMovimientos}
              disabled={!estadoAbierta}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold transition disabled:opacity-50"
            >
              <History size={19} />
              Movimientos
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="md:hidden space-y-3">
            {!estadoAbierta ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center text-slate-500">
                No hay caja abierta.
              </div>
            ) : movimientos.length === 0 ? (
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center text-slate-500">
                No hay movimientos registrados.
              </div>
            ) : (
              movimientos.slice(0, 8).map((mov) => (
                <div
                  key={mov.id_movimiento}
                  className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span
                        className={`inline-flex text-xs font-bold px-3 py-1 rounded-full ${claseMovimiento(
                          mov.tipo_movimiento
                        )}`}
                      >
                        {mov.tipo_movimiento}
                      </span>

                      <p className="mt-3 font-bold text-slate-800 break-words">
                        {mov.concepto}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatoFecha(mov.fecha_movimiento)}
                      </p>

                      {mov.referencia && (
                        <p className="mt-1 text-xs text-slate-400 break-words">
                          Ref: {mov.referencia}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-slate-800">
                        {formatoMoneda(mov.monto)}
                      </p>
                      <p className="text-xs text-slate-500">
                        {mov.metodo_pago}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500">Usuario</p>
                    <p className="text-sm font-semibold text-slate-700 break-words">
                      {mov.usuario || '—'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    Concepto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    Método
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                    Monto
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                    Usuario
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {!estadoAbierta ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center text-slate-500">
                      No hay caja abierta.
                    </td>
                  </tr>
                ) : movimientos.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-4 py-10 text-center text-slate-500">
                      No hay movimientos registrados.
                    </td>
                  </tr>
                ) : (
                  movimientos.slice(0, 8).map((mov) => (
                    <tr key={mov.id_movimiento} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {formatoFecha(mov.fecha_movimiento)}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${claseMovimiento(
                            mov.tipo_movimiento
                          )}`}
                        >
                          {mov.tipo_movimiento}
                        </span>
                      </td>

                      <td className="px-4 py-3 font-semibold text-slate-800">
                        {mov.concepto}
                        {mov.referencia && (
                          <p className="text-xs text-slate-400 mt-1">
                            Ref: {mov.referencia}
                          </p>
                        )}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {mov.metodo_pago}
                      </td>

                      <td className="px-4 py-3 text-right font-bold text-slate-800">
                        {formatoMoneda(mov.monto)}
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        {mov.usuario || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {modalAbrir && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setModalAbrir(false)}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Abrir caja
                </h2>
                <p className="text-sm text-slate-500 break-words">
                  {sucursalActual?.nombre} · {cajaActual?.nombre}
                </p>
              </div>

              <button
                onClick={() => setModalAbrir(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={abrirCaja}>
              <div className="p-4 sm:p-6 space-y-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Monto inicial *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={montoInicial}
                    onChange={(e) => setMontoInicial(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 text-sm text-sky-800">
                  Este monto representa el efectivo inicial con el que comienza la caja.
                </div>
              </div>

              <div className="px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalAbrir(false)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition disabled:opacity-60"
                >
                  <Save size={19} />
                  {guardando ? 'Abriendo...' : 'Abrir caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalMovimiento && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setModalMovimiento(false)}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Registrar movimiento
                </h2>
                <p className="text-sm text-slate-500 break-words">
                  Sesión #{sesionAbierta?.id_sesion} · {cajaActual?.nombre}
                </p>
              </div>

              <button
                onClick={() => setModalMovimiento(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={registrarMovimiento}>
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Tipo *
                  </label>
                  <select
                    value={formMovimiento.tipo_movimiento}
                    onChange={(e) =>
                      setFormMovimiento({
                        ...formMovimiento,
                        tipo_movimiento: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {tiposMovimiento.map((tipo) => (
                      <option key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Monto *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formMovimiento.monto}
                    onChange={(e) =>
                      setFormMovimiento({
                        ...formMovimiento,
                        monto: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="0.00"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Concepto *
                  </label>
                  <input
                    value={formMovimiento.concepto}
                    onChange={(e) =>
                      setFormMovimiento({
                        ...formMovimiento,
                        concepto: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Ej. Compra de bolsas, retiro parcial, entrada extra..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Método de pago
                  </label>
                  <select
                    value={formMovimiento.metodo_pago}
                    onChange={(e) =>
                      setFormMovimiento({
                        ...formMovimiento,
                        metodo_pago: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TARJETA">Tarjeta</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Referencia
                  </label>
                  <input
                    value={formMovimiento.referencia}
                    onChange={(e) =>
                      setFormMovimiento({
                        ...formMovimiento,
                        referencia: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Opcional"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    rows="3"
                    value={formMovimiento.observaciones}
                    onChange={(e) =>
                      setFormMovimiento({
                        ...formMovimiento,
                        observaciones: e.target.value,
                      })
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    placeholder="Observaciones opcionales"
                  />
                </div>
              </div>

              <div className="px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalMovimiento(false)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition disabled:opacity-60"
                >
                  <Save size={19} />
                  {guardando ? 'Guardando...' : 'Guardar movimiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalCerrar && (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setModalCerrar(false)}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl my-auto overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4 shrink-0">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Cerrar caja
                </h2>
                <p className="text-sm text-slate-500">
                  Verifica el monto contado físicamente.
                </p>
              </div>

              <button
                onClick={() => setModalCerrar(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={cerrarCaja} className="flex flex-col flex-1 min-h-0">
              <div className="p-4 sm:p-6 space-y-5 overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-2xl bg-slate-50 p-4 min-w-0">
                    <p className="text-sm text-slate-500">Sistema</p>
                    <p className="text-xl font-bold text-slate-800 break-words">
                      {formatoMoneda(resumen?.monto_final_sistema)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 min-w-0">
                    <p className="text-sm text-slate-500">Contado</p>
                    <p className="text-xl font-bold text-slate-800 break-words">
                      {formatoMoneda(montoFinalReal)}
                    </p>
                  </div>

                  <div
                    className={`rounded-2xl p-4 min-w-0 ${
                      diferenciaActual === 0 ? 'bg-sky-50' : 'bg-red-50'
                    }`}
                  >
                    <p className="text-sm text-slate-500">Diferencia</p>
                    <p
                      className={`text-xl font-bold break-words ${
                        diferenciaActual === 0
                          ? 'text-sky-700'
                          : 'text-red-700'
                      }`}
                    >
                      {formatoMoneda(diferenciaActual)}
                    </p>
                  </div>
                </div>

                {diferenciaActual !== 0 && (
                  <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 flex items-start gap-3 text-amber-800">
                    <AlertTriangle size={22} className="shrink-0 mt-0.5" />
                    <p className="text-sm">
                      Existe diferencia entre el monto esperado por el sistema y el
                      efectivo contado.
                    </p>
                  </div>
                )}

                <div className="rounded-2xl sm:rounded-3xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-800 flex items-center gap-2">
                        <Calculator size={19} className="shrink-0" />
                        Calculadora de efectivo
                      </h3>
                      <p className="text-sm text-slate-500 leading-relaxed">
                        Captura cuántos billetes y monedas tienes para calcular el monto contado.
                      </p>
                    </div>

                    <div className="sm:text-right rounded-2xl bg-white px-4 py-3 border border-slate-100">
                      <p className="text-xs text-slate-500">Total contado</p>
                      <p className="text-2xl font-bold text-sky-700">
                        {formatoMoneda(totalConteoEfectivo)}
                      </p>
                    </div>
                  </div>

                  <div className="md:hidden space-y-2">
                    {denominacionesCaja.map((denominacion) => {
                      const cantidad = Number(conteoEfectivo[denominacion.valor] || 0);
                      const importe = cantidad * Number(denominacion.valor);

                      return (
                        <div
                          key={`${denominacion.tipo}-mobile-${denominacion.valor}`}
                          className="rounded-2xl bg-white border border-slate-100 p-3"
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs text-slate-500">
                                {denominacion.tipo}
                              </p>
                              <p className="font-bold text-slate-800">
                                {formatoMoneda(denominacion.valor)}
                              </p>
                            </div>

                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={conteoEfectivo[denominacion.valor] || ''}
                              onChange={(e) =>
                                cambiarConteoEfectivo(
                                  denominacion.valor,
                                  e.target.value
                                )
                              }
                              className="w-24 px-3 py-2 text-center rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                              placeholder="0"
                            />
                          </div>

                          <div className="mt-2 flex justify-between gap-3 text-sm">
                            <span className="text-slate-500">Importe</span>
                            <span className="font-bold text-slate-700">
                              {formatoMoneda(importe)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-[520px]">
                      <thead>
                        <tr className="border-b border-slate-200">
                          <th className="py-2 text-left text-xs font-bold text-slate-500 uppercase">
                            Tipo
                          </th>
                          <th className="py-2 text-right text-xs font-bold text-slate-500 uppercase">
                            Denominación
                          </th>
                          <th className="py-2 text-center text-xs font-bold text-slate-500 uppercase">
                            Cantidad
                          </th>
                          <th className="py-2 text-right text-xs font-bold text-slate-500 uppercase">
                            Importe
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {denominacionesCaja.map((denominacion) => {
                          const cantidad = Number(conteoEfectivo[denominacion.valor] || 0);
                          const importe = cantidad * Number(denominacion.valor);

                          return (
                            <tr key={`${denominacion.tipo}-${denominacion.valor}`}>
                              <td className="py-2 text-sm font-semibold text-slate-700">
                                {denominacion.tipo}
                              </td>

                              <td className="py-2 text-right text-sm font-bold text-slate-800">
                                {formatoMoneda(denominacion.valor)}
                              </td>

                              <td className="py-2 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={conteoEfectivo[denominacion.valor] || ''}
                                  onChange={(e) =>
                                    cambiarConteoEfectivo(
                                      denominacion.valor,
                                      e.target.value
                                    )
                                  }
                                  className="w-24 px-3 py-2 text-center rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                                  placeholder="0"
                                />
                              </td>

                              <td className="py-2 text-right text-sm font-bold text-slate-700">
                                {formatoMoneda(importe)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={limpiarConteoEfectivo}
                      className="px-4 py-3 rounded-2xl bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 transition"
                    >
                      Limpiar conteo
                    </button>

                    <button
                      type="button"
                      onClick={aplicarConteoEfectivo}
                      className="px-4 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition"
                    >
                      Usar total contado
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Monto final contado *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={montoFinalReal}
                    onChange={(e) => setMontoFinalReal(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Puedes capturarlo manualmente o llenarlo con la calculadora de efectivo.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Observaciones
                  </label>
                  <textarea
                    rows="3"
                    value={observacionesCierre}
                    onChange={(e) => setObservacionesCierre(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                    placeholder="Observaciones del corte"
                  />
                </div>
              </div>

              <div className="px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100 bg-white shrink-0">
                <button
                  type="button"
                  onClick={() => setModalCerrar(false)}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:opacity-60"
                >
                  <LockKeyhole size={19} />
                  {guardando ? 'Cerrando...' : 'Cerrar caja'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalMovimientos && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setModalMovimientos(false)}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Movimientos de caja
                </h2>
                <p className="text-sm text-slate-500">
                  Sesión #{sesionAbierta?.id_sesion}
                </p>
              </div>

              <button
                onClick={() => setModalMovimientos(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 md:p-6 overflow-y-auto max-h-[75vh]">
              {movimientos.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  No hay movimientos registrados.
                </div>
              ) : (
                <div>
                  <div className="md:hidden space-y-3">
                    {movimientos.map((mov) => (
                      <div
                        key={mov.id_movimiento}
                        className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <span
                              className={`inline-flex text-xs font-bold px-3 py-1 rounded-full ${claseMovimiento(
                                mov.tipo_movimiento
                              )}`}
                            >
                              {mov.tipo_movimiento}
                            </span>

                            <p className="mt-3 font-bold text-slate-800 break-words">
                              {mov.concepto}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatoFecha(mov.fecha_movimiento)}
                            </p>
                          </div>

                          <div className="text-right shrink-0">
                            <p className="text-lg font-bold text-slate-800">
                              {formatoMoneda(mov.monto)}
                            </p>
                            <p className="text-xs text-slate-500">
                              {mov.metodo_pago}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3">
                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Referencia</p>
                            <p className="text-sm font-semibold text-slate-700 break-words">
                              {mov.referencia || '—'}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Usuario</p>
                            <p className="text-sm font-semibold text-slate-700 break-words">
                              {mov.usuario || '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-[1000px]">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                            Fecha
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                            Tipo
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                            Concepto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                            Método
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                            Monto
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                            Referencia
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                            Usuario
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {movimientos.map((mov) => (
                          <tr key={mov.id_movimiento}>
                            <td className="px-4 py-3 text-sm text-slate-600">
                              {formatoFecha(mov.fecha_movimiento)}
                            </td>

                            <td className="px-4 py-3">
                              <span
                                className={`text-xs font-bold px-3 py-1 rounded-full ${claseMovimiento(
                                  mov.tipo_movimiento
                                )}`}
                              >
                                {mov.tipo_movimiento}
                              </span>
                            </td>

                            <td className="px-4 py-3 font-semibold text-slate-800">
                              {mov.concepto}
                            </td>

                            <td className="px-4 py-3 text-slate-600">
                              {mov.metodo_pago}
                            </td>

                            <td className="px-4 py-3 text-right font-bold text-slate-800">
                              {formatoMoneda(mov.monto)}
                            </td>

                            <td className="px-4 py-3 text-slate-600">
                              {mov.referencia || '—'}
                            </td>

                            <td className="px-4 py-3 text-slate-600">
                              {mov.usuario || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}