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
  Percent,
  Pencil,
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

export default function Puntos() {
  const [tab, setTab] = useState('CLIENTES');

  const [clientes, setClientes] = useState([]);
  const [cajeros, setCajeros] = useState([]);
  const [doctores, setDoctores] = useState([]);
  const [doctoresShaddai, setDoctoresShaddai] = useState([]);

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

      const [
        clientesRes,
        cajerosRes,
        doctoresRes,
        doctoresShaddaiRes,
        configRes,
      ] = await Promise.all([
        api.get('/tarjetas-puntos'),
        api.get('/configuracion-puntos/cajeros/resumen'),
        api.get('/configuracion-puntos/doctores/resumen'),
        api.get('/configuracion-puntos/doctores-shaddai/resumen'),
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

      if (doctoresShaddaiRes.data.ok) {
        setDoctoresShaddai(
          doctoresShaddaiRes.data.doctores ||
            doctoresShaddaiRes.data.doctores_shaddai ||
            []
        );
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

  const configurarPorcentajeDoctorShaddai = async (doctor) => {
    const porcentajeActual = Number(doctor.porcentaje_puntos_venta || 0);
    const puntosActivoActual =
      doctor.puntos_activo === true || doctor.puntos_activo === 'true';

    const { value: formValues } = await Swal.fire({
      title: 'Configurar porcentaje',
      html: `
        <div style="text-align:left">
          <p style="margin-bottom:10px">
            <b>Doctor:</b> ${doctor.nombre_completo || doctor.nombre || 'Sin nombre'}
          </p>

          <label style="font-weight:700;font-size:13px;color:#334155">
            Porcentaje sobre venta
          </label>
          <input 
            id="porcentaje_puntos_venta" 
            type="number" 
            min="0" 
            max="100" 
            step="0.01"
            value="${porcentajeActual}"
            class="swal2-input"
            style="margin:8px 0 14px 0;width:100%"
            placeholder="Ej. 5"
          />

          <label style="display:flex;align-items:center;gap:8px;font-size:14px;color:#334155">
            <input 
              id="puntos_activo" 
              type="checkbox" 
              ${puntosActivoActual ? 'checked' : ''}
            />
            Activar acumulación de puntos para este doctor
          </label>

          <p style="font-size:12px;color:#64748b;margin-top:12px">
            Ejemplo: si el porcentaje es 5%, una venta de $500 genera 25 puntos.
          </p>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#7e22ce',
      cancelButtonColor: '#64748b',
      preConfirm: () => {
        const porcentaje = Number(
          document.getElementById('porcentaje_puntos_venta').value || 0
        );

        const puntosActivo = document.getElementById('puntos_activo').checked;

        if (Number.isNaN(porcentaje) || porcentaje < 0 || porcentaje > 100) {
          Swal.showValidationMessage(
            'El porcentaje debe estar entre 0 y 100.'
          );
          return false;
        }

        return {
          porcentaje_puntos_venta: porcentaje,
          puntos_activo: puntosActivo,
        };
      },
    });

    if (!formValues) return;

    try {
      const { data } = await api.put(
        `/configuracion-puntos/doctores-shaddai/${doctor.id_doctor}/porcentaje`,
        formValues
      );

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Porcentaje actualizado',
          text: 'La configuración del doctor Shaddai fue guardada correctamente.',
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
          'No se pudo actualizar el porcentaje del doctor.',
      });
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
          descripcion: `Canje de puntos del cajero ${
            cajero.nombre || cajero.usuario || cajero.id_usuario
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
          descripcion: `Canje de puntos del doctor ${
            doctor.nombre_completo || doctor.nombre || doctor.id_doctor
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

  const canjearPuntosDoctorShaddai = async (doctor) => {
    const saldo = Number(doctor.puntos_actuales || 0);

    if (saldo <= 0) {
      Swal.fire({
        icon: 'info',
        title: 'Sin puntos',
        text: 'Este doctor Shaddai no tiene puntos disponibles para canjear.',
      });
      return;
    }

    const confirmacion = await Swal.fire({
      icon: 'question',
      title: '¿Canjear puntos del doctor Shaddai?',
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
        `/configuracion-puntos/doctores-shaddai/${doctor.id_doctor}/canjear`,
        {
          descripcion: `Canje de puntos del doctor Shaddai ${
            doctor.nombre_completo || doctor.nombre || doctor.id_doctor
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
          'No se pudieron canjear los puntos del doctor Shaddai.',
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

  const doctoresShaddaiFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    if (!texto) return doctoresShaddai;

    return doctoresShaddai.filter((doctor) => {
      return (
        String(doctor.nombre_completo || '').toLowerCase().includes(texto) ||
        String(doctor.nombre || '').toLowerCase().includes(texto) ||
        String(doctor.usuario || '').toLowerCase().includes(texto) ||
        String(doctor.cedula_profesional || '').toLowerCase().includes(texto) ||
        String(doctor.especialidad || '').toLowerCase().includes(texto)
      );
    });
  }, [doctoresShaddai, busqueda]);

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

  const resumenDoctoresShaddai = useMemo(() => {
    return doctoresShaddai.reduce(
      (acc, item) => {
        acc.totalDoctores += 1;
        acc.puntosActuales += Number(item.puntos_actuales || 0);
        acc.puntosAcumulados += Number(item.puntos_acumulados || 0);
        acc.puntosCanjeados += Number(item.puntos_canjeados || 0);
        acc.ventasReferidas += Number(item.ventas_referidas || 0);
        return acc;
      },
      {
        totalDoctores: 0,
        puntosActuales: 0,
        puntosAcumulados: 0,
        puntosCanjeados: 0,
        ventasReferidas: 0,
      }
    );
  }, [doctoresShaddai]);

  const renderTarjetasResumen = () => {
    if (tab === 'CLIENTES') {
      return (
        <>
          <TarjetaResumen
            icono={<Users size={22} />}
            color="sky"
            titulo="Clientes con tarjeta"
            valor={formatoNumero(resumenClientes.totalClientes)}
          />
          <TarjetaResumen
            icono={<BadgePercent size={22} />}
            color="amber"
            titulo="Puntos actuales"
            valor={formatoNumero(resumenClientes.puntosActuales)}
          />
          <TarjetaResumen
            icono={<ShoppingBag size={22} />}
            color="emerald"
            titulo="Puntos acumulados"
            valor={formatoNumero(resumenClientes.puntosAcumulados)}
          />
          <TarjetaResumen
            icono={<WalletCards size={22} />}
            color="red"
            titulo="Puntos canjeados"
            valor={formatoNumero(resumenClientes.puntosCanjeados)}
          />
        </>
      );
    }

    if (tab === 'CAJEROS') {
      return (
        <>
          <TarjetaResumen
            icono={<Users size={22} />}
            color="sky"
            titulo="Cajeros"
            valor={formatoNumero(resumenCajeros.totalCajeros)}
          />
          <TarjetaResumen
            icono={<BadgePercent size={22} />}
            color="amber"
            titulo="Puntos cajeros"
            valor={formatoNumero(resumenCajeros.saldoPuntos)}
          />
          <TarjetaResumen
            icono={<ShoppingBag size={22} />}
            color="emerald"
            titulo="Movimientos"
            valor={formatoNumero(resumenCajeros.totalMovimientos)}
          />
          <TarjetaResumen
            icono={<Stethoscope size={22} />}
            color="purple"
            titulo="Regla doctores externos"
            valor={
              puntosDoctorActivo
                ? `${formatoNumero(puntosDoctorReceta || 0)} pts`
                : 'Inactiva'
            }
            valorClassName="text-2xl"
          />
        </>
      );
    }

    if (tab === 'DOCTORES') {
      return (
        <>
          <TarjetaResumen
            icono={<Stethoscope size={22} />}
            color="purple"
            titulo="Doctores externos"
            valor={formatoNumero(resumenDoctores.totalDoctores)}
          />
          <TarjetaResumen
            icono={<BadgePercent size={22} />}
            color="amber"
            titulo="Puntos actuales"
            valor={formatoNumero(resumenDoctores.puntosActuales)}
          />
          <TarjetaResumen
            icono={<ShoppingBag size={22} />}
            color="emerald"
            titulo="Recetas atendidas"
            valor={formatoNumero(resumenDoctores.recetasAtendidas)}
          />
          <TarjetaResumen
            icono={<WalletCards size={22} />}
            color="red"
            titulo="Puntos canjeados"
            valor={formatoNumero(resumenDoctores.puntosCanjeados)}
          />
        </>
      );
    }

    return (
      <>
        <TarjetaResumen
          icono={<Stethoscope size={22} />}
          color="purple"
          titulo="Doctores Shaddai"
          valor={formatoNumero(resumenDoctoresShaddai.totalDoctores)}
        />
        <TarjetaResumen
          icono={<BadgePercent size={22} />}
          color="amber"
          titulo="Puntos actuales"
          valor={formatoNumero(resumenDoctoresShaddai.puntosActuales)}
        />
        <TarjetaResumen
          icono={<ShoppingBag size={22} />}
          color="emerald"
          titulo="Ventas referidas"
          valor={formatoNumero(resumenDoctoresShaddai.ventasReferidas)}
        />
        <TarjetaResumen
          icono={<WalletCards size={22} />}
          color="red"
          titulo="Puntos canjeados"
          valor={formatoNumero(resumenDoctoresShaddai.puntosCanjeados)}
        />
      </>
    );
  };

  const placeholderBusqueda =
    tab === 'CLIENTES'
      ? 'Buscar cliente, tarjeta o teléfono...'
      : tab === 'CAJEROS'
        ? 'Buscar cajero, usuario o rol...'
        : tab === 'DOCTORES'
          ? 'Buscar doctor externo, usuario, cédula o especialidad...'
          : 'Buscar doctor Shaddai, usuario, cédula o especialidad...';

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
                Consulta puntos de clientes, cajeros, doctores externos y doctores Shaddai.
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
                Clientes y cajeros usan porcentaje global. Doctores externos conservan puntos por receta. Doctores Shaddai usan porcentaje individual por doctor.
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
                <p className="font-bold text-sky-800">Clientes</p>
                <p className="text-xs text-sky-700">
                  Puntos para tarjetas de clientes.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPuntosClienteActivo((prev) => !prev)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  puntosClienteActivo
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
                <p className="font-bold text-amber-800">Cajeros</p>
                <p className="text-xs text-amber-700">
                  Puntos generados al cajero por venta.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPuntosCajeroActivo((prev) => !prev)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  puntosCajeroActivo
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
                  Doctores externos
                </p>
                <p className="text-xs text-purple-700">
                  Puntos por receta atendida y validada.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPuntosDoctorActivo((prev) => !prev)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  puntosDoctorActivo
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
              {formatoNumero(puntosDoctorReceta || 0)} punto(s) al doctor externo.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-3xl bg-fuchsia-50 border border-fuchsia-100 p-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white text-fuchsia-700 flex items-center justify-center">
              <Percent size={22} />
            </div>

            <div>
              <p className="font-bold text-fuchsia-800">
                Doctores Shaddai
              </p>
              <p className="text-sm text-fuchsia-700 mt-1">
                Su porcentaje no se configura aquí de forma global. Cada doctor Shaddai tendrá su propio porcentaje desde la pestaña “Doctores Shaddai”, usando el botón “Configurar %”.
              </p>
            </div>
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
          {renderTarjetasResumen()}
        </div>
      </section>

      <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl w-fit overflow-x-auto">
            <TabButton
              active={tab === 'CLIENTES'}
              onClick={() => setTab('CLIENTES')}
            >
              Clientes
            </TabButton>

            <TabButton
              active={tab === 'CAJEROS'}
              onClick={() => setTab('CAJEROS')}
            >
              Cajeros
            </TabButton>

            <TabButton
              active={tab === 'DOCTORES'}
              onClick={() => setTab('DOCTORES')}
            >
              Doctores
            </TabButton>

            <TabButton
              active={tab === 'DOCTORES_SHADDAI'}
              onClick={() => setTab('DOCTORES_SHADDAI')}
            >
              Doctores Shaddai
            </TabButton>
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
              placeholder={placeholderBusqueda}
            />
          </div>
        </div>
      </section>

      {tab === 'CLIENTES' && (
        <TablaClientes
          cargando={cargando}
          clientesFiltrados={clientesFiltrados}
          formatoNumero={formatoNumero}
        />
      )}

      {tab === 'CAJEROS' && (
        <TablaCajeros
          cargando={cargando}
          cajerosFiltrados={cajerosFiltrados}
          formatoNumero={formatoNumero}
          formatoFecha={formatoFecha}
          canjearPuntosCajero={canjearPuntosCajero}
        />
      )}

      {tab === 'DOCTORES' && (
        <TablaDoctoresExternos
          cargando={cargando}
          doctoresFiltrados={doctoresFiltrados}
          formatoNumero={formatoNumero}
          formatoFecha={formatoFecha}
          canjearPuntosDoctor={canjearPuntosDoctor}
        />
      )}

      {tab === 'DOCTORES_SHADDAI' && (
        <TablaDoctoresShaddai
          cargando={cargando}
          doctoresFiltrados={doctoresShaddaiFiltrados}
          formatoNumero={formatoNumero}
          formatoFecha={formatoFecha}
          configurarPorcentajeDoctorShaddai={configurarPorcentajeDoctorShaddai}
          canjearPuntosDoctorShaddai={canjearPuntosDoctorShaddai}
        />
      )}
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl font-bold text-sm transition whitespace-nowrap ${
        active
          ? 'bg-white text-sky-700 shadow-sm'
          : 'text-slate-500 hover:text-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

function TarjetaResumen({ icono, color, titulo, valor, valorClassName = 'text-3xl' }) {
  const colores = {
    sky: 'bg-sky-50 border-sky-100 text-sky-700',
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    red: 'bg-red-50 border-red-100 text-red-700',
    purple: 'bg-purple-50 border-purple-100 text-purple-700',
  };

  return (
    <div className={`rounded-3xl border p-5 ${colores[color] || colores.sky}`}>
      <div className="w-11 h-11 rounded-2xl bg-white flex items-center justify-center mb-4">
        {icono}
      </div>
      <p className="text-sm">{titulo}</p>
      <p className={`${valorClassName} font-bold text-slate-800`}>
        {valor}
      </p>
    </div>
  );
}

function TablaClientes({ cargando, clientesFiltrados, formatoNumero }) {
  return (
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
              <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">Cliente</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">Tarjeta</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actuales</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">Acumulados</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">Canjeados</th>
              <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">Estado</th>
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
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        cliente.activo
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
  );
}

function TablaCajeros({
  cargando,
  cajerosFiltrados,
  formatoNumero,
  formatoFecha,
  canjearPuntosCajero,
}) {
  return (
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
              <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">Cajero</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">Usuario</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">Rol</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">Puntos</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">Movimientos</th>
              <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">Estado</th>
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
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        cajero.activo
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
  );
}

function TablaDoctoresExternos({
  cargando,
  doctoresFiltrados,
  formatoNumero,
  formatoFecha,
  canjearPuntosDoctor,
}) {
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">
          Puntos de doctores externos
        </h2>
        <p className="text-sm text-slate-500">
          Puntos generados por recetas subidas, atendidas y validadas.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1200px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">Doctor</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">Usuario</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">Cédula</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">Especialidad</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actuales</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">Acumulados</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">Canjeados</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">Atendidas</th>
              <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">Estado</th>
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
                <td colSpan="10" className="px-5 py-10 text-center text-slate-500">
                  No hay doctores externos para mostrar.
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
                      Última validación: {formatoFecha(doctor.ultima_validacion || doctor.ultimo_movimiento)}
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
                      className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                        doctor.activo
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
  );
}

function TablaDoctoresShaddai({
  cargando,
  doctoresFiltrados,
  formatoNumero,
  formatoFecha,
  configurarPorcentajeDoctorShaddai,
  canjearPuntosDoctorShaddai,
}) {
  return (
    <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-800">
          Puntos de doctores Shaddai
        </h2>
        <p className="text-sm text-slate-500">
          Puntos generados por porcentaje individual sobre las ventas asociadas a cada doctor.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1400px]">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">Doctor</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">Usuario</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">Cédula</th>
              <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">Especialidad</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">% Venta</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">Actuales</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">Acumulados</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">Canjeados</th>
              <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">Ventas</th>
              <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">Puntos</th>
              <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">Estado</th>
              <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase sticky right-0 bg-slate-50 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] z-10">
                Acciones
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {cargando ? (
              <tr>
                <td colSpan="12" className="px-5 py-10 text-center text-slate-500">
                  Cargando puntos...
                </td>
              </tr>
            ) : doctoresFiltrados.length === 0 ? (
              <tr>
                <td colSpan="12" className="px-5 py-10 text-center text-slate-500">
                  No hay doctores Shaddai para mostrar.
                </td>
              </tr>
            ) : (
              doctoresFiltrados.map((doctor) => {
                const puntosActivo =
                  doctor.puntos_activo === true || doctor.puntos_activo === 'true';

                return (
                  <tr key={doctor.id_doctor} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {doctor.nombre_completo || doctor.nombre || 'Sin nombre'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Último movimiento: {formatoFecha(doctor.ultimo_movimiento)}
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

                    <td className="px-5 py-4 text-right font-bold text-fuchsia-700">
                      {formatoNumero(doctor.porcentaje_puntos_venta)}%
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
                      {formatoNumero(doctor.ventas_referidas)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                          puntosActivo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {puntosActivo ? 'Activos' : 'Inactivos'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${
                          doctor.activo
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {doctor.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-center sticky right-0 bg-white shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => configurarPorcentajeDoctorShaddai(doctor)}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-fuchsia-100 hover:bg-fuchsia-200 text-fuchsia-800 font-bold text-sm transition"
                        >
                          <Pencil size={16} />
                          Configurar %
                        </button>

                        <button
                          type="button"
                          onClick={() => canjearPuntosDoctorShaddai(doctor)}
                          disabled={Number(doctor.puntos_actuales || 0) <= 0}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <RotateCcw size={16} />
                          Canjear
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}