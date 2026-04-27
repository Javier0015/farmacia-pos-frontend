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
  const [formMovimiento, setFormMovimiento] = useState(movimientoInicial);

  const sucursalActual = useMemo(() => {
    return sucursales.find((s) => Number(s.id_sucursal) === Number(idSucursal));
  }, [sucursales, idSucursal]);

  const cajaActual = useMemo(() => {
    return cajas.find((c) => Number(c.id_caja) === Number(idCaja));
  }, [cajas, idCaja]);

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

  const estadoAbierta = Boolean(sesionAbierta);
  const resumen = resumenCaja?.resumen;

  const diferenciaActual =
    montoFinalReal === ''
      ? 0
      : Number(montoFinalReal || 0) - Number(resumen?.monto_final_sistema || 0);

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Wallet size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">Caja</h1>
              <p className="text-slate-500">
                Apertura, movimientos, resumen y corte de caja.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 transition disabled:opacity-50"
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

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div>
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
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
              <div className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold">
                {sucursalActual?.nombre ||
                  sucursales[0]?.nombre ||
                  'Sucursal asignada'}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Caja
            </label>
            <select
              value={idCaja}
              onChange={(e) => setIdCaja(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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

      <section className="grid lg:grid-cols-3 gap-5">
        <div
          className={`rounded-3xl p-6 shadow-sm border ${estadoAbierta
            ? 'bg-emerald-700 text-white border-emerald-600'
            : 'bg-slate-900 text-white border-slate-800'
            }`}
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center">
              {estadoAbierta ? (
                <UnlockKeyhole size={24} />
              ) : (
                <LockKeyhole size={24} />
              )}
            </div>

            <span className="text-xs font-bold px-3 py-1 rounded-full bg-white/15">
              {estadoAbierta ? 'ABIERTA' : 'CERRADA'}
            </span>
          </div>

          <p className="text-sm mt-5 opacity-80">Estado actual</p>
          <h3 className="text-3xl font-bold mt-1">
            {estadoAbierta ? 'Caja abierta' : 'Sin sesión'}
          </h3>

          <p className="text-sm mt-3 opacity-80">
            {estadoAbierta
              ? `Apertura: ${formatoFecha(sesionAbierta?.fecha_apertura)}`
              : 'Abre caja para comenzar operaciones.'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <DollarSign size={24} />
          </div>

          <p className="text-sm text-slate-500 mt-5">Monto inicial</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {formatoMoneda(sesionAbierta?.monto_inicial)}
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            {cajaActual?.nombre || 'Sin caja seleccionada'}
          </p>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Calculator size={24} />
          </div>

          <p className="text-sm text-slate-500 mt-5">Monto esperado</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {formatoMoneda(resumen?.monto_final_sistema)}
          </h3>

          <p className="text-sm text-slate-400 mt-2">
            Según movimientos registrados
          </p>
        </div>
      </section>

      <section className="grid xl:grid-cols-4 gap-5">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Ventas efectivo</p>
          <h3 className="text-2xl font-bold text-emerald-700 mt-1">
            {formatoMoneda(resumen?.ventas_efectivo)}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Entradas efectivo</p>
          <h3 className="text-2xl font-bold text-blue-700 mt-1">
            {formatoMoneda(resumen?.entradas_efectivo)}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Salidas / gastos</p>
          <h3 className="text-2xl font-bold text-red-700 mt-1">
            {formatoMoneda(
              Number(resumen?.salidas_efectivo || 0) +
              Number(resumen?.gastos_efectivo || 0) +
              Number(resumen?.retiros_efectivo || 0) +
              Number(resumen?.pagos_proveedor_efectivo || 0)
            )}
          </h3>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
          <p className="text-sm text-slate-500">Devoluciones</p>
          <h3 className="text-2xl font-bold text-amber-700 mt-1">
            {formatoMoneda(resumen?.devoluciones_efectivo)}
          </h3>
        </div>
      </section>

      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div>
            <h2 className="text-xl font-bold text-slate-800">
              Operaciones de caja
            </h2>
            <p className="text-slate-500">
              Registra entradas, salidas, gastos y consulta movimientos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => abrirModalMovimiento('ENTRADA')}
              disabled={!estadoAbierta}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold transition disabled:opacity-50"
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
          {/* Vista móvil */}
          <div className="md:hidden space-y-4">
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
                    <div>
                      <span
                        className={`inline-flex text-xs font-bold px-3 py-1 rounded-full ${['ENTRADA', 'VENTA', 'APERTURA'].includes(
                          mov.tipo_movimiento
                        )
                          ? 'bg-emerald-100 text-emerald-700'
                          : [
                            'SALIDA',
                            'GASTO',
                            'RETIRO',
                            'PAGO_PROVEEDOR',
                            'DEVOLUCION',
                          ].includes(mov.tipo_movimiento)
                            ? 'bg-red-100 text-red-700'
                            : 'bg-slate-100 text-slate-700'
                          }`}
                      >
                        {mov.tipo_movimiento}
                      </span>

                      <p className="mt-3 font-bold text-slate-800">
                        {mov.concepto}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatoFecha(mov.fecha_movimiento)}
                      </p>

                      {mov.referencia && (
                        <p className="mt-1 text-xs text-slate-400">
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
                    <p className="text-sm font-semibold text-slate-700">
                      {mov.usuario || '—'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Vista escritorio */}
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
                          className={`text-xs font-bold px-3 py-1 rounded-full ${['ENTRADA', 'VENTA', 'APERTURA'].includes(
                            mov.tipo_movimiento
                          )
                            ? 'bg-emerald-100 text-emerald-700'
                            : [
                              'SALIDA',
                              'GASTO',
                              'RETIRO',
                              'PAGO_PROVEEDOR',
                              'DEVOLUCION',
                            ].includes(mov.tipo_movimiento)
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-700'
                            }`}
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Abrir caja
                </h2>
                <p className="text-sm text-slate-500">
                  {sucursalActual?.nombre} · {cajaActual?.nombre}
                </p>
              </div>

              <button
                onClick={() => setModalAbrir(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={abrirCaja} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Monto inicial *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={montoInicial}
                  onChange={(e) => setMontoInicial(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div className="rounded-2xl bg-emerald-50 border border-emerald-100 p-4 text-sm text-emerald-800">
                Este monto representa el efectivo inicial con el que comienza la caja.
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setModalAbrir(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition disabled:opacity-60"
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Registrar movimiento
                </h2>
                <p className="text-sm text-slate-500">
                  Sesión #{sesionAbierta?.id_sesion} · {cajaActual?.nombre}
                </p>
              </div>

              <button
                onClick={() => setModalMovimiento(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={registrarMovimiento} className="p-6">
              <div className="grid md:grid-cols-2 gap-5">
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
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    placeholder="Observaciones opcionales"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setModalMovimiento(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition disabled:opacity-60"
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Cerrar caja
                </h2>
                <p className="text-sm text-slate-500">
                  Verifica el monto contado físicamente.
                </p>
              </div>

              <button
                onClick={() => setModalCerrar(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={cerrarCaja} className="p-6 space-y-5">
              <div className="grid sm:grid-cols-3 gap-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Sistema</p>
                  <p className="text-xl font-bold text-slate-800">
                    {formatoMoneda(resumen?.monto_final_sistema)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Contado</p>
                  <p className="text-xl font-bold text-slate-800">
                    {formatoMoneda(montoFinalReal)}
                  </p>
                </div>

                <div
                  className={`rounded-2xl p-4 ${diferenciaActual === 0 ? 'bg-emerald-50' : 'bg-red-50'
                    }`}
                >
                  <p className="text-sm text-slate-500">Diferencia</p>
                  <p
                    className={`text-xl font-bold ${diferenciaActual === 0
                      ? 'text-emerald-700'
                      : 'text-red-700'
                      }`}
                  >
                    {formatoMoneda(diferenciaActual)}
                  </p>
                </div>
              </div>

              {diferenciaActual !== 0 && (
                <div className="rounded-2xl bg-amber-50 border border-amber-100 p-4 flex gap-3 text-amber-800">
                  <AlertTriangle size={22} />
                  <p className="text-sm">
                    Existe diferencia entre el monto esperado por el sistema y el
                    efectivo contado.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Monto final contado *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={montoFinalReal}
                  onChange={(e) => setMontoFinalReal(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  rows="3"
                  value={observacionesCierre}
                  onChange={(e) => setObservacionesCierre(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  placeholder="Observaciones del corte"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={() => setModalCerrar(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold transition disabled:opacity-60"
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
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Movimientos de caja
                </h2>
                <p className="text-sm text-slate-500">
                  Sesión #{sesionAbierta?.id_sesion}
                </p>
              </div>

              <button
                onClick={() => setModalMovimientos(false)}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
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
                  {/* Vista móvil */}
                  <div className="md:hidden space-y-4">
                    {movimientos.map((mov) => (
                      <div
                        key={mov.id_movimiento}
                        className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="inline-flex text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                              {mov.tipo_movimiento}
                            </span>

                            <p className="mt-3 font-bold text-slate-800">
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
                            <p className="text-sm font-semibold text-slate-700">
                              {mov.referencia || '—'}
                            </p>
                          </div>

                          <div className="rounded-xl bg-slate-50 p-3">
                            <p className="text-xs text-slate-500">Usuario</p>
                            <p className="text-sm font-semibold text-slate-700">
                              {mov.usuario || '—'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Vista escritorio */}
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
                              <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
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