import { useEffect, useMemo, useState } from 'react';
import {
  Award,
  RefreshCw,
  Search,
  Users,
  WalletCards,
  BadgePercent,
  ShoppingBag,
  Save,
  RotateCcw,
  Settings,
  Stethoscope,
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

export default function Puntos() {
  const [tab, setTab] = useState('CLIENTES');

  const [clientes, setClientes] = useState([]);
  const [cajeros, setCajeros] = useState([]);
  const [doctores, setDoctores] = useState([]);

  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);

  const [configuracion, setConfiguracion] = useState(null);
  const [guardandoConfig, setGuardandoConfig] = useState(false);

  const [porcentajeCliente, setPorcentajeCliente] = useState('');
  const [porcentajeCajero, setPorcentajeCajero] = useState('');
  const [puntosClienteActivo, setPuntosClienteActivo] = useState(true);
  const [puntosCajeroActivo, setPuntosCajeroActivo] = useState(true);

  const [puntosDoctorReceta, setPuntosDoctorReceta] = useState('');
  const [puntosDoctorActivo, setPuntosDoctorActivo] = useState(true);

  const formatoNumero = (valor) => {
    return Number(valor || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatoFecha = (fecha) => {
    if (!fecha) return 'Sin movimientos';

    return new Date(fecha).toLocaleString('es-MX', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const cargarDatos = async () => {
    try {
      setCargando(true);

      const [clientesRes, cajerosRes, doctoresRes, configRes] =
        await Promise.all([
          api.get('/tarjetas-puntos'),
          api.get('/configuracion-puntos/cajeros/resumen'),
          api.get('/configuracion-puntos/doctores/resumen'),
          api.get('/configuracion-puntos'),
        ]);

      if (clientesRes.data.ok) {
        setClientes(
          clientesRes.data.tarjetas ||
          clientesRes.data.clientes ||
          []
        );
      }

      if (cajerosRes.data.ok) {
        setCajeros(cajerosRes.data.cajeros || []);
      }

      if (doctoresRes.data.ok) {
        setDoctores(doctoresRes.data.doctores || []);
      }

      if (configRes.data.ok) {
        const config = configRes.data.configuracion;

        setConfiguracion(config);

        setPorcentajeCliente(config.porcentaje_cliente || '');
        setPorcentajeCajero(config.porcentaje_cajero || '');
        setPuntosDoctorReceta(config.puntos_doctor_receta || '');

        setPuntosClienteActivo(
          config.puntos_cliente_activo === true ||
          config.puntos_cliente_activo === 'true'
        );

        setPuntosCajeroActivo(
          config.puntos_cajero_activo === true ||
          config.puntos_cajero_activo === 'true'
        );

        setPuntosDoctorActivo(
          config.puntos_doctor_activo === true ||
          config.puntos_doctor_activo === 'true'
        );
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar los puntos.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const guardarConfiguracion = async () => {
    try {
      const cliente = Number(porcentajeCliente || 0);
      const cajero = Number(porcentajeCajero || 0);
      const doctor = Number(puntosDoctorReceta || 0);

      if (Number.isNaN(cliente) || cliente < 0 || cliente > 100) {
        Swal.fire({
          icon: 'warning',
          title: 'Porcentaje inválido',
          text: 'El porcentaje de clientes debe estar entre 0 y 100.',
        });
        return;
      }

      if (Number.isNaN(cajero) || cajero < 0 || cajero > 100) {
        Swal.fire({
          icon: 'warning',
          title: 'Porcentaje inválido',
          text: 'El porcentaje de cajeros debe estar entre 0 y 100.',
        });
        return;
      }

      if (Number.isNaN(doctor) || doctor < 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Puntos inválidos',
          text: 'Los puntos por receta atendida deben ser mayor o igual a 0.',
        });
        return;
      }

      setGuardandoConfig(true);

      const { data } = await api.put('/configuracion-puntos', {
        porcentaje_cliente: cliente,
        porcentaje_cajero: cajero,
        puntos_cliente_activo: puntosClienteActivo,
        puntos_cajero_activo: puntosCajeroActivo,
        puntos_doctor_receta: doctor,
        puntos_doctor_activo: puntosDoctorActivo,
      });

      if (data.ok) {
        setConfiguracion(data.configuracion);

        Swal.fire({
          icon: 'success',
          title: 'Configuración guardada',
          text: 'Las reglas de puntos fueron actualizadas correctamente.',
          timer: 1600,
          showConfirmButton: false,
        });

        await cargarDatos();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo guardar la configuración.',
      });
    } finally {
      setGuardandoConfig(false);
    }
  };

  const canjearPuntosCajero = async (cajero) => {
    const saldo = Number(cajero.saldo_puntos || 0);

    if (saldo <= 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin puntos',
        text: 'Este cajero no tiene puntos disponibles para canjear.',
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Canjear puntos del cajero?',
      html: `
        <div style="text-align:left">
          <p><b>Cajero:</b> ${cajero.nombre || cajero.usuario || 'Sin nombre'}</p>
          <p><b>Puntos actuales:</b> ${formatoNumero(saldo)}</p>
          <p>Se registrará un movimiento de canje y el saldo quedará en 0.</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, canjear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0369a1',
      cancelButtonColor: '#64748b',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { data } = await api.post(
        `/configuracion-puntos/cajeros/${cajero.id_usuario}/canjear`,
        {
          descripcion: `Canje de puntos del cajero ${cajero.nombre || cajero.usuario || cajero.id_usuario
            }`,
        }
      );

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Puntos canjeados',
          text: `Se canjearon ${formatoNumero(data.puntos_canjeados)} puntos.`,
          timer: 1700,
          showConfirmButton: false,
        });

        await cargarDatos();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron canjear los puntos del cajero.',
      });
    }
  };


  const canjearPuntosDoctor = async (doctor) => {
    const saldo = Number(doctor.puntos_actuales || 0);

    if (saldo <= 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin puntos',
        text: 'Este doctor no tiene puntos disponibles para canjear.',
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Canjear puntos del doctor?',
      html: `
      <div style="text-align:left">
        <p><b>Doctor:</b> ${doctor.nombre_completo || doctor.nombre || 'Sin nombre'}</p>
        <p><b>Cédula:</b> ${doctor.cedula_profesional || 'Sin cédula'}</p>
        <p><b>Puntos actuales:</b> ${formatoNumero(saldo)}</p>
        <p>Se registrará un movimiento de canje y el saldo quedará en 0.</p>
      </div>
    `,
      showCancelButton: true,
      confirmButtonText: 'Sí, canjear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7e22ce',
      cancelButtonColor: '#64748b',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { data } = await api.post(
        `/configuracion-puntos/doctores/${doctor.id_doctor}/canjear`,
        {
          descripcion: `Canje de puntos del doctor ${doctor.nombre_completo || doctor.nombre || doctor.id_doctor
            }`,
        }
      );

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Puntos canjeados',
          text: `Se canjearon ${formatoNumero(data.puntos_canjeados)} puntos.`,
          timer: 1700,
          showConfirmButton: false,
        });

        await cargarDatos();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron canjear los puntos del doctor.',
      });
    }
  };

  const clientesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return clientes;

    return clientes.filter((cliente) => {
      return (
        String(cliente.nombre_cliente || '').toLowerCase().includes(texto) ||
        String(cliente.codigo_barras || '').toLowerCase().includes(texto) ||
        String(cliente.telefono || '').toLowerCase().includes(texto)
      );
    });
  }, [clientes, busqueda]);

  const cajerosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return cajeros;

    return cajeros.filter((cajero) => {
      return (
        String(cajero.nombre || '').toLowerCase().includes(texto) ||
        String(cajero.usuario || '').toLowerCase().includes(texto) ||
        String(cajero.rol || '').toLowerCase().includes(texto)
      );
    });
  }, [cajeros, busqueda]);

  const doctoresFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return doctores;

    return doctores.filter((doctor) => {
      return (
        String(doctor.nombre_completo || '').toLowerCase().includes(texto) ||
        String(doctor.nombre || '').toLowerCase().includes(texto) ||
        String(doctor.usuario || '').toLowerCase().includes(texto) ||
        String(doctor.cedula_profesional || '').toLowerCase().includes(texto) ||
        String(doctor.especialidad || '').toLowerCase().includes(texto)
      );
    });
  }, [doctores, busqueda]);

  const resumenClientes = useMemo(() => {
    return clientes.reduce(
      (acc, item) => {
        acc.totalClientes += 1;
        acc.puntosActuales += Number(item.puntos_actuales || 0);
        acc.puntosAcumulados += Number(item.puntos_acumulados || 0);
        acc.puntosCanjeados += Number(item.puntos_canjeados || 0);
        return acc;
      },
      {
        totalClientes: 0,
        puntosActuales: 0,
        puntosAcumulados: 0,
        puntosCanjeados: 0,
      }
    );
  }, [clientes]);

  const resumenCajeros = useMemo(() => {
    return cajeros.reduce(
      (acc, item) => {
        acc.totalCajeros += 1;
        acc.saldoPuntos += Number(item.saldo_puntos || 0);
        acc.totalMovimientos += Number(item.total_movimientos || 0);
        return acc;
      },
      {
        totalCajeros: 0,
        saldoPuntos: 0,
        totalMovimientos: 0,
      }
    );
  }, [cajeros]);

  const resumenDoctores = useMemo(() => {
    return doctores.reduce(
      (acc, item) => {
        acc.totalDoctores += 1;
        acc.puntosActuales += Number(item.puntos_actuales || 0);
        acc.puntosAcumulados += Number(item.puntos_acumulados || 0);
        acc.puntosCanjeados += Number(item.puntos_canjeados || 0);
        acc.recetasAtendidas += Number(item.recetas_atendidas || 0);
        return acc;
      },
      {
        totalDoctores: 0,
        puntosActuales: 0,
        puntosAcumulados: 0,
        puntosCanjeados: 0,
        recetasAtendidas: 0,
      }
    );
  }, [doctores]);

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
              <Award size={25} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-800">
                Puntos
              </h1>
              <p className="text-slate-500">
                Consulta puntos de clientes, cajeros y doctores; configura las reglas de acumulación.
              </p>
            </div>
          </div>

          <button
            onClick={cargarDatos}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </section>

      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center">
              <Settings size={22} />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Configuración de puntos
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Define las reglas de acumulación para clientes, cajeros y doctores.
              </p>
            </div>
          </div>

          <button
            onClick={guardarConfiguracion}
            disabled={guardandoConfig}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition disabled:opacity-60"
          >
            <Save size={18} />
            {guardandoConfig ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>

        <div className="mt-6 grid lg:grid-cols-3 gap-5">
          <div className="rounded-3xl bg-sky-50 border border-sky-100 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="font-bold text-sky-800">
                  Clientes
                </p>
                <p className="text-xs text-sky-700">
                  Puntos para tarjetas de clientes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPuntosClienteActivo((prev) => !prev)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${puntosClienteActivo
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
                  }`}
              >
                {puntosClienteActivo ? 'Activo' : 'Inactivo'}
              </button>
            </div>

            <label className="block text-sm font-bold text-slate-700 mb-2">
              Porcentaje sobre la venta
            </label>

            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={porcentajeCliente}
                onChange={(e) => setPorcentajeCliente(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="1.00"
              />
              <span className="absolute right-4 top-3.5 text-slate-500 font-bold">
                %
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Ejemplo: con {formatoNumero(porcentajeCliente || 0)}%, una venta de $500 genera{' '}
              {formatoNumero(500 * (Number(porcentajeCliente || 0) / 100))} puntos.
            </p>
          </div>

          <div className="rounded-3xl bg-amber-50 border border-amber-100 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="font-bold text-amber-800">
                  Cajeros
                </p>
                <p className="text-xs text-amber-700">
                  Puntos generados al cajero por venta.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPuntosCajeroActivo((prev) => !prev)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${puntosCajeroActivo
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
                  }`}
              >
                {puntosCajeroActivo ? 'Activo' : 'Inactivo'}
              </button>
            </div>

            <label className="block text-sm font-bold text-slate-700 mb-2">
              Porcentaje sobre la venta
            </label>

            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={porcentajeCajero}
                onChange={(e) => setPorcentajeCajero(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="0.50"
              />
              <span className="absolute right-4 top-3.5 text-slate-500 font-bold">
                %
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Ejemplo: con {formatoNumero(porcentajeCajero || 0)}%, una venta de $500 genera{' '}
              {formatoNumero(500 * (Number(porcentajeCajero || 0) / 100))} puntos.
            </p>
          </div>

          <div className="rounded-3xl bg-purple-50 border border-purple-100 p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className="font-bold text-purple-800">
                  Doctores
                </p>
                <p className="text-xs text-purple-700">
                  Puntos por receta atendida y validada.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPuntosDoctorActivo((prev) => !prev)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${puntosDoctorActivo
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-red-100 text-red-700'
                  }`}
              >
                {puntosDoctorActivo ? 'Activo' : 'Inactivo'}
              </button>
            </div>

            <label className="block text-sm font-bold text-slate-700 mb-2">
              Puntos por receta atendida
            </label>

            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={puntosDoctorReceta}
                onChange={(e) => setPuntosDoctorReceta(e.target.value)}
                className="w-full px-4 py-3 pr-16 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                placeholder="1.00"
              />
              <span className="absolute right-4 top-3.5 text-slate-500 font-bold">
                pts
              </span>
            </div>

            <p className="text-xs text-slate-500 mt-2">
              Ejemplo: cada receta marcada como atendida genera{' '}
              {formatoNumero(puntosDoctorReceta || 0)} punto(s) al doctor.
            </p>
          </div>
        </div>

        {configuracion?.fecha_actualizacion && (
          <p className="text-xs text-slate-400 mt-4">
            Última actualización:{' '}
            {new Date(configuracion.fecha_actualizacion).toLocaleString('es-MX', {
              dateStyle: 'short',
              timeStyle: 'short',
            })}
          </p>
        )}
      </section>

      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
        <div className="grid md:grid-cols-4 gap-4">
          {tab === 'CLIENTES' ? (
            <>
              <div className="rounded-3xl bg-sky-50 border border-sky-100 p-5">
                <div className="w-11 h-11 rounded-2xl bg-white text-sky-700 flex items-center justify-center mb-4">
                  <Users size={22} />
                </div>
                <p className="text-sm text-sky-700">Clientes con tarjeta</p>
                <p className="text-3xl font-bold text-slate-800">
                  {formatoNumero(resumenClientes.totalClientes)}
                </p>
              </div>

              <div className="rounded-3xl bg-amber-50 border border-amber-100 p-5">
                <div className="w-11 h-11 rounded-2xl bg-white text-amber-700 flex items-center justify-center mb-4">
                  <BadgePercent size={22} />
                </div>
                <p className="text-sm text-amber-700">Puntos actuales</p>
                <p className="text-3xl font-bold text-slate-800">
                  {formatoNumero(resumenClientes.puntosActuales)}
                </p>
              </div>

              <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-5">
                <div className="w-11 h-11 rounded-2xl bg-white text-emerald-700 flex items-center justify-center mb-4">
                  <ShoppingBag size={22} />
                </div>
                <p className="text-sm text-emerald-700">Puntos acumulados</p>
                <p className="text-3xl font-bold text-slate-800">
                  {formatoNumero(resumenClientes.puntosAcumulados)}
                </p>
              </div>

              <div className="rounded-3xl bg-red-50 border border-red-100 p-5">
                <div className="w-11 h-11 rounded-2xl bg-white text-red-700 flex items-center justify-center mb-4">
                  <WalletCards size={22} />
                </div>
                <p className="text-sm text-red-700">Puntos canjeados</p>
                <p className="text-3xl font-bold text-slate-800">
                  {formatoNumero(resumenClientes.puntosCanjeados)}
                </p>
              </div>
            </>
          ) : tab === 'CAJEROS' ? (
            <>
              <div className="rounded-3xl bg-sky-50 border border-sky-100 p-5">
                <div className="w-11 h-11 rounded-2xl bg-white text-sky-700 flex items-center justify-center mb-4">
                  <Users size={22} />
                </div>
                <p className="text-sm text-sky-700">Cajeros</p>
                <p className="text-3xl font-bold text-slate-800">
                  {formatoNumero(resumenCajeros.totalCajeros)}
                </p>
              </div>

              <div className="rounded-3xl bg-amber-50 border border-amber-100 p-5">
                <div className="w-11 h-11 rounded-2xl bg-white text-amber-700 flex items-center justify-center mb-4">
                  <BadgePercent size={22} />
                </div>
                <p className="text-sm text-amber-700">Puntos cajeros</p>
                <p className="text-3xl font-bold text-slate-800">
                  {formatoNumero(resumenCajeros.saldoPuntos)}
                </p>
              </div>

              <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-5">
                <div className="w-11 h-11 rounded-2xl bg-white text-emerald-700 flex items-center justify-center mb-4">
                  <ShoppingBag size={22} />
                </div>
                <p className="text-sm text-emerald-700">Movimientos</p>
                <p className="text-3xl font-bold text-slate-800">
                  {formatoNumero(resumenCajeros.totalMovimientos)}
                </p>
              </div>

              <div className="rounded-3xl bg-purple-50 border border-purple-100 p-5">
                <div className="w-11 h-11 rounded-2xl bg-white text-purple-700 flex items-center justify-center mb-4">
                  <Stethoscope size={22} />
                </div>
                <p className="text-sm text-purple-700">Regla doctores</p>
                <p className="text-2xl font-bold text-slate-800">
                  {puntosDoctorActivo
                    ? `${formatoNumero(puntosDoctorReceta || 0)} pts`
                    : 'Inactiva'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-3xl bg-purple-50 border border-purple-100 p-5">
                <div className="w-11 h-11 rounded-2xl bg-white text-purple-700 flex items-center justify-center mb-4">
                  <Stethoscope size={22} />
                </div>
                <p className="text-sm text-purple-700">Doctores</p>
                <p className="text-3xl font-bold text-slate-800">
                  {formatoNumero(resumenDoctores.totalDoctores)}
                </p>
              </div>

              <div className="rounded-3xl bg-amber-50 border border-amber-100 p-5">
                <div className="w-11 h-11 rounded-2xl bg-white text-amber-700 flex items-center justify-center mb-4">
                  <BadgePercent size={22} />
                </div>
                <p className="text-sm text-amber-700">Puntos actuales</p>
                <p className="text-3xl font-bold text-slate-800">
                  {formatoNumero(resumenDoctores.puntosActuales)}
                </p>
              </div>

              <div className="rounded-3xl bg-emerald-50 border border-emerald-100 p-5">
                <div className="w-11 h-11 rounded-2xl bg-white text-emerald-700 flex items-center justify-center mb-4">
                  <ShoppingBag size={22} />
                </div>
                <p className="text-sm text-emerald-700">Recetas atendidas</p>
                <p className="text-3xl font-bold text-slate-800">
                  {formatoNumero(resumenDoctores.recetasAtendidas)}
                </p>
              </div>

              <div className="rounded-3xl bg-red-50 border border-red-100 p-5">
                <div className="w-11 h-11 rounded-2xl bg-white text-red-700 flex items-center justify-center mb-4">
                  <WalletCards size={22} />
                </div>
                <p className="text-sm text-red-700">Puntos canjeados</p>
                <p className="text-3xl font-bold text-slate-800">
                  {formatoNumero(resumenDoctores.puntosCanjeados)}
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
            <button
              type="button"
              onClick={() => setTab('CLIENTES')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${tab === 'CLIENTES'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Clientes
            </button>

            <button
              type="button"
              onClick={() => setTab('CAJEROS')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${tab === 'CAJEROS'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Cajeros
            </button>

            <button
              type="button"
              onClick={() => setTab('DOCTORES')}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition ${tab === 'DOCTORES'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
                }`}
            >
              Doctores
            </button>
          </div>

          <div className="relative w-full lg:w-96">
            <Search
              size={19}
              className="absolute left-4 top-3.5 text-slate-400"
            />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder={
                tab === 'CLIENTES'
                  ? 'Buscar cliente, tarjeta o teléfono...'
                  : tab === 'CAJEROS'
                    ? 'Buscar cajero, usuario o rol...'
                    : 'Buscar doctor, usuario, cédula o especialidad...'
              }
            />
          </div>
        </div>
      </section>

      {tab === 'CLIENTES' ? (
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">
              Puntos de clientes
            </h2>
            <p className="text-sm text-slate-500">
              Saldo de puntos de tarjetas registradas.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Tarjeta
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                    Actuales
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                    Acumulados
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                    Canjeados
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                    Estado
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {cargando ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                      Cargando puntos...
                    </td>
                  </tr>
                ) : clientesFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-10 text-center text-slate-500">
                      No hay clientes para mostrar.
                    </td>
                  </tr>
                ) : (
                  clientesFiltrados.map((cliente) => (
                    <tr key={cliente.id_tarjeta} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {cliente.nombre_cliente || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {cliente.telefono || 'Sin teléfono'}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {cliente.codigo_barras || '—'}
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-amber-700">
                        {formatoNumero(cliente.puntos_actuales)}
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-sky-700">
                        {formatoNumero(cliente.puntos_acumulados)}
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-red-700">
                        {formatoNumero(cliente.puntos_canjeados)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${cliente.activo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                            }`}
                        >
                          {cliente.activo ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : tab === 'CAJEROS' ? (
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">
              Puntos de cajeros
            </h2>
            <p className="text-sm text-slate-500">
              Puntos generados por ventas realizadas.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Cajero
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Usuario
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Rol
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                    Puntos
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                    Movimientos
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                    Estado
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase sticky right-0 bg-slate-50 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] z-10">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {cargando ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                      Cargando puntos...
                    </td>
                  </tr>
                ) : cajerosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-slate-500">
                      No hay cajeros para mostrar.
                    </td>
                  </tr>
                ) : (
                  cajerosFiltrados.map((cajero) => (
                    <tr key={cajero.id_usuario} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {cajero.nombre || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Último movimiento: {formatoFecha(cajero.ultimo_movimiento)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {cajero.usuario || '—'}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-slate-700">
                        {cajero.rol || '—'}
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-amber-700">
                        {formatoNumero(cajero.saldo_puntos)}
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-sky-700">
                        {formatoNumero(cajero.total_movimientos)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${cajero.activo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                            }`}
                        >
                          {cajero.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center sticky right-0 bg-white shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                        <button
                          type="button"
                          onClick={() => canjearPuntosCajero(cajero)}
                          disabled={Number(cajero.saldo_puntos || 0) <= 0}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RotateCcw size={16} />
                          Canjear
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800">
              Puntos de doctores
            </h2>
            <p className="text-sm text-slate-500">
              Puntos generados por recetas atendidas y validadas.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Doctor
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Usuario
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Cédula
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                    Especialidad
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                    Actuales
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                    Acumulados
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                    Canjeados
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                    Atendidas
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
                    Estado
                  </th>
                  <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase sticky right-0 bg-slate-50 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] z-10">
                    Acción
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {cargando ? (
                  <tr>
                    <td colSpan="10" className="px-5 py-10 text-center text-slate-500">
                      Cargando puntos...
                    </td>
                  </tr>
                ) : doctoresFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-5 py-10 text-center text-slate-500">
                      No hay doctores para mostrar.
                    </td>
                  </tr>
                ) : (
                  doctoresFiltrados.map((doctor) => (
                    <tr key={doctor.id_doctor} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-800">
                          {doctor.nombre_completo || doctor.nombre || 'Sin nombre'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          Última validación: {formatoFecha(doctor.ultima_validacion)}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {doctor.usuario || '—'}
                      </td>

                      <td className="px-5 py-4 text-sm font-bold text-slate-700">
                        {doctor.cedula_profesional || '—'}
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {doctor.especialidad || '—'}
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-amber-700">
                        {formatoNumero(doctor.puntos_actuales)}
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-sky-700">
                        {formatoNumero(doctor.puntos_acumulados)}
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-red-700">
                        {formatoNumero(doctor.puntos_canjeados)}
                      </td>

                      <td className="px-5 py-4 text-right font-bold text-emerald-700">
                        {formatoNumero(doctor.recetas_atendidas)}
                      </td>

                      <td className="px-5 py-4 text-center">
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${doctor.activo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                            }`}
                        >
                          {doctor.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center sticky right-0 bg-white shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                        <button
                          type="button"
                          onClick={() => canjearPuntosDoctor(doctor)}
                          disabled={Number(doctor.puntos_actuales || 0) <= 0}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RotateCcw size={16} />
                          Canjear
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}