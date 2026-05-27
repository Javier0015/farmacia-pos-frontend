import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import Barcode from 'react-barcode';
import {
  BadgePercent,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  Save,
  User,
  Phone,
  Mail,
  Barcode as BarcodeIcon,
  Coins,
  History,
  Printer,
  Gift,
  TicketPercent,
  ShieldCheck,
  Star,
  ShoppingBag,
} from 'lucide-react';
import api from '../../api/axios';
import logoShaddai from '../../assets/logoShaddai.png';

const formInicial = {
  codigo_barras: '',
  nombre_cliente: '',
  telefono: '',
  correo: '',
  puntos_iniciales: '',
  activo: true,
};

export default function TarjetasPuntos() {
  const [tarjetas, setTarjetas] = useState([]);
  const [movimientos, setMovimientos] = useState([]);

  const [buscar, setBuscar] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cargandoMovimientos, setCargandoMovimientos] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalMovimientos, setModalMovimientos] = useState(false);
  const [modalTarjeta, setModalTarjeta] = useState(false);

  const [modoEdicion, setModoEdicion] = useState(false);
  const [tarjetaEditando, setTarjetaEditando] = useState(null);
  const [tarjetaImprimir, setTarjetaImprimir] = useState(null);

  const [form, setForm] = useState(formInicial);

  const formatoNumero = (valor) => {
    return Number(valor || 0).toLocaleString('es-MX', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  };

  const formatoFecha = (fecha) => {
    if (!fecha) return '—';

    return new Date(fecha).toLocaleString('es-MX', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  };

  const getMovimientoStyle = (tipo) => {
    if (['ACUMULACION', 'ALTA_INICIAL', 'BONO'].includes(tipo)) {
      return 'bg-sky-100 text-sky-700';
    }

    if (['CANJE', 'AJUSTE_NEGATIVO'].includes(tipo)) {
      return 'bg-red-100 text-red-700';
    }

    return 'bg-slate-100 text-slate-700';
  };

  const resumen = useMemo(() => {
    const total = tarjetas.length;
    const activas = tarjetas.filter((t) => t.activo).length;
    const inactivas = tarjetas.filter((t) => !t.activo).length;

    const puntosActivos = tarjetas.reduce((acc, tarjeta) => {
      return acc + Number(tarjeta.puntos_actuales || 0);
    }, 0);

    return {
      total,
      activas,
      inactivas,
      puntosActivos,
    };
  }, [tarjetas]);

  const cargarTarjetas = async () => {
    try {
      setCargando(true);

      const params = new URLSearchParams();

      if (buscar.trim()) {
        params.append('buscar', buscar.trim());
      }

      const { data } = await api.get(`/tarjetas-puntos?${params.toString()}`);

      if (data.ok) {
        setTarjetas(data.tarjetas || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar las tarjetas de puntos.',
      });
    } finally {
      setCargando(false);
    }
  };

  const cargarMovimientos = async (tarjeta) => {
    try {
      setCargandoMovimientos(true);
      setTarjetaEditando(tarjeta);
      setModalMovimientos(true);

      const { data } = await api.get(
        `/tarjetas-puntos/${tarjeta.id_tarjeta}/movimientos`
      );

      if (data.ok) {
        setMovimientos(data.movimientos || []);
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar los movimientos de la tarjeta.',
      });
    } finally {
      setCargandoMovimientos(false);
    }
  };

  useEffect(() => {
    cargarTarjetas();
  }, []);

  const abrirNuevo = () => {
    setForm(formInicial);
    setModoEdicion(false);
    setTarjetaEditando(null);
    setModalAbierto(true);
  };

  const abrirEditar = (tarjeta) => {
    setTarjetaEditando(tarjeta);
    setModoEdicion(true);

    setForm({
      codigo_barras: tarjeta.codigo_barras || '',
      nombre_cliente: tarjeta.nombre_cliente || '',
      telefono: tarjeta.telefono || '',
      correo: tarjeta.correo || '',
      puntos_iniciales: '',
      activo: Boolean(tarjeta.activo),
    });

    setModalAbierto(true);
  };

  const abrirTarjetaImprimir = (tarjeta) => {
    setTarjetaImprimir(tarjeta);
    setModalTarjeta(true);
  };

  const cerrarTarjetaImprimir = () => {
    setModalTarjeta(false);
    setTarjetaImprimir(null);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setModoEdicion(false);
    setTarjetaEditando(null);
    setForm(formInicial);
  };

  const cerrarMovimientos = () => {
    setModalMovimientos(false);
    setMovimientos([]);
    setTarjetaEditando(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const validarForm = () => {
    if (!form.nombre_cliente.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Cliente obligatorio',
        text: 'Ingresa el nombre del cliente.',
      });
      return false;
    }

    if (modoEdicion && !form.codigo_barras.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Código obligatorio',
        text: 'La tarjeta debe tener un código de barras.',
      });
      return false;
    }

    if (form.correo.trim()) {
      const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo);

      if (!correoValido) {
        Swal.fire({
          icon: 'warning',
          title: 'Correo inválido',
          text: 'Ingresa un correo electrónico válido.',
        });
        return false;
      }
    }

    if (!modoEdicion && Number(form.puntos_iniciales || 0) < 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Puntos inválidos',
        text: 'Los puntos iniciales no pueden ser negativos.',
      });
      return false;
    }

    return true;
  };

  const guardarTarjeta = async (e) => {
    e.preventDefault();

    if (!validarForm()) return;

    try {
      setGuardando(true);

      let payload;

      if (modoEdicion) {
        payload = {
          codigo_barras: form.codigo_barras.trim(),
          nombre_cliente: form.nombre_cliente.trim(),
          telefono: form.telefono.trim() || null,
          correo: form.correo.trim() || null,
          activo: form.activo,
        };
      } else {
        payload = {
          codigo_barras: null,
          nombre_cliente: form.nombre_cliente.trim(),
          telefono: form.telefono.trim() || null,
          correo: form.correo.trim() || null,
          puntos_iniciales: Number(form.puntos_iniciales || 0),
        };
      }

      let respuesta;

      if (modoEdicion) {
        respuesta = await api.put(
          `/tarjetas-puntos/${tarjetaEditando.id_tarjeta}`,
          payload
        );
      } else {
        respuesta = await api.post('/tarjetas-puntos', payload);
      }

      if (respuesta.data.ok) {
        Swal.fire({
          icon: 'success',
          title: modoEdicion ? 'Tarjeta actualizada' : 'Tarjeta creada',
          text: respuesta.data.mensaje,
          timer: 1500,
          showConfirmButton: false,
        });

        const tarjetaCreada = respuesta.data.tarjeta;

        cerrarModal();
        await cargarTarjetas();

        if (!modoEdicion && tarjetaCreada) {
          setTarjetaImprimir(tarjetaCreada);
          setModalTarjeta(true);
        }
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo guardar la tarjeta.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const desactivarTarjeta = async (tarjeta) => {
    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Desactivar tarjeta?',
      html: `
        <div style="text-align:left">
          <p><b>Cliente:</b> ${tarjeta.nombre_cliente}</p>
          <p><b>Código:</b> ${tarjeta.codigo_barras}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!confirmacion.isConfirmed) return;

    try {
      const { data } = await api.delete(
        `/tarjetas-puntos/${tarjeta.id_tarjeta}`
      );

      if (data.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Tarjeta desactivada',
          text: data.mensaje,
          timer: 1400,
          showConfirmButton: false,
        });

        cargarTarjetas();
      }
    } catch (error) {
      console.error(error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo desactivar la tarjeta.',
      });
    }
  };

  const copiarCodigo = async (codigo) => {
    try {
      await navigator.clipboard.writeText(codigo);

      Swal.fire({
        icon: 'success',
        title: 'Código copiado',
        text: codigo,
        timer: 1200,
        showConfirmButton: false,
      });
    } catch {
      Swal.fire({
        icon: 'info',
        title: 'Código de tarjeta',
        text: codigo,
      });
    }
  };

  const imprimirTarjeta = () => {
    const contenido = document.getElementById('tarjeta-puntos-print');

    if (!contenido) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se encontró el contenido de la tarjeta.',
      });
      return;
    }

    const ventana = window.open('', '_blank', 'width=720,height=900');

    ventana.document.write(`
      <html>
        <head>
          <title></title>
          <style>
            * {
              box-sizing: border-box;
            }

            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              min-height: 100%;
              font-family: Arial, sans-serif;
              background: #ffffff;
            }

            body {
              padding-top: 24px;
            }

            .print-wrapper {
              width: 100%;
              display: flex;
              justify-content: center;
              align-items: flex-start;
            }

            .print-stack {
              width: 520px;
              display: flex;
              flex-direction: column;
              gap: 28px;
            }

            .tarjeta-frente,
            .tarjeta-reverso {
              width: 520px;
              height: 335px;
              border-radius: 24px;
              overflow: hidden;
              position: relative;
              color: #ffffff;
              background: linear-gradient(135deg, #003b66 0%, #004f86 42%, #01233f 100%);
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              box-shadow: 0 20px 40px rgba(15, 23, 42, 0.22);
            }

            .tarjeta-frente {
              padding: 25px;
            }

            .tarjeta-reverso {
              padding: 0;
            }

            .decor-soft {
              position: absolute;
              right: 80px;
              top: -80px;
              width: 260px;
              height: 260px;
              border-radius: 999px;
              background: rgba(255,255,255,0.045);
            }

            .decor-dots {
              position: absolute;
              right: 38px;
              top: 112px;
              width: 78px;
              height: 100px;
              opacity: 0.18;
              background-image: radial-gradient(#7dd3fc 2px, transparent 2px);
              background-size: 16px 16px;
            }

            .front-content,
            .back-content {
              position: relative;
              z-index: 3;
              height: 100%;
            }

            .front-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              gap: 18px;
            }

            .brand-wrap {
              display: flex;
              align-items: center;
              gap: 15px;
            }

            .logo-card {
              width: 66px;
              height: 66px;
              border-radius: 18px;
              background: rgba(255,255,255,0.98);
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 8px;
              box-shadow: 0 12px 24px rgba(0,0,0,0.16);
            }

            .logo-card img {
              width: 100%;
              height: 100%;
              object-fit: contain;
              display: block;
            }

            .brand-title {
              font-size: 30px;
              font-weight: 900;
              line-height: 0.98;
              margin: 0;
              letter-spacing: -0.8px;
            }

            .brand-subtitle {
              margin: 9px 0 0;
              font-size: 11px;
              font-weight: 900;
              letter-spacing: 4px;
              color: #6ee7b7;
              text-transform: uppercase;
            }

            .cliente-badge {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 12px 16px;
              border-radius: 999px;
              background: linear-gradient(135deg, #059669, #047857);
              color: #ffffff;
              font-size: 14px;
              font-weight: 800;
              line-height: 1.1;
              box-shadow: 0 12px 22px rgba(0,0,0,0.16);
            }

            .cliente-section {
              margin-top: 32px;
            }

            .section-label {
              display: flex;
              align-items: center;
              gap: 8px;
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 2px;
              color: #bfdbfe;
              text-transform: uppercase;
              margin: 0 0 10px;
            }

            .cliente-nombre {
              font-size: 27px;
              font-weight: 900;
              line-height: 1;
              text-transform: uppercase;
              letter-spacing: 2px;
              margin: 0;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 430px;
            }

            .points-line {
              display: flex;
              align-items: center;
              gap: 9px;
              margin-top: 15px;
              font-size: 15px;
              font-weight: 700;
              color: #ffffff;
            }

            .points-line strong {
              color: #86efac;
            }

           .barcode-panel {
  position: absolute;
  left: 25px;
  right: 25px;
  bottom: 22px;
  height: 82px;
  background: rgba(255,255,255,0.97);
  border-radius: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 26px;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.22);
}

.barcode-main {
  width: 100%;
  text-align: center;
}

            .back-top {
              display: grid;
              grid-template-columns: 1fr 1.15fr;
              gap: 24px;
              padding: 28px 33px 20px;
              height: 248px;
            }

            .back-title {
              font-size: 12px;
              font-weight: 900;
              letter-spacing: 3px;
              color: #6ee7b7;
              text-transform: uppercase;
              margin: 0 0 18px;
            }

            .benefit-list {
              display: flex;
              flex-direction: column;
              gap: 15px;
            }

            .benefit-item {
              display: flex;
              align-items: center;
              gap: 13px;
              color: #ffffff;
              font-size: 17px;
              font-weight: 700;
              line-height: 1.15;
            }

            .benefit-icon {
              width: 43px;
              height: 43px;
              border-radius: 999px;
              background: linear-gradient(135deg, #10b981, #047857);
              display: flex;
              align-items: center;
              justify-content: center;
              color: #ffffff;
              flex-shrink: 0;
            }

            .how-box {
              background: rgba(2, 132, 199, 0.24);
              border: 1px solid rgba(125, 211, 252, 0.16);
              border-radius: 18px;
              padding: 14px;
              display: flex;
              align-items: center;
              gap: 13px;
              color: #ffffff;
              font-size: 14px;
              font-weight: 700;
              line-height: 1.35;
            }

            .how-box-icon {
              width: 46px;
              height: 46px;
              border-radius: 999px;
              background: linear-gradient(135deg, #10b981, #047857);
              display: flex;
              align-items: center;
              justify-content: center;
              flex-shrink: 0;
            }

            .back-note {
              margin-top: 14px;
              font-size: 13.5px;
              line-height: 1.3;
              color: #e0f2fe;
              font-weight: 600;
            }

            .back-bottom {
              height: 87px;
              background: rgba(0, 25, 48, 0.45);
              display: flex;
              align-items: center;
              gap: 14px;
              padding: 16px 33px;
              color: #ffffff;
            }

            .shield-icon {
              width: 42px;
              height: 42px;
              flex-shrink: 0;
              color: #e0f2fe;
            }

            .back-bottom p {
              margin: 0;
              font-size: 13.5px;
              line-height: 1.3;
              font-weight: 600;
              color: #f8fafc;
            }

            @page {
              size: auto;
              margin: 10mm 0 0 0;
            }

            @media print {
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }

              .print-wrapper {
                padding-top: 12mm !important;
              }

              .tarjeta-frente,
              .tarjeta-reverso {
                box-shadow: none !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                page-break-inside: avoid;
              }
            }
          </style>
        </head>

        <body>
          <div class="print-wrapper">
            ${contenido.innerHTML}
          </div>

          <script>
            document.title = '';
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);

              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `);

    ventana.document.close();
  };

  return (
    <div className="w-full max-w-full overflow-hidden space-y-5 sm:space-y-6 pb-8">
      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <BadgePercent size={25} />
            </div>

            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 break-words">
                Tarjetas de puntos
              </h1>
              <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
                Administra tarjetas con código de barras para acumular puntos por compra.
              </p>
            </div>
          </div>

          <button
            onClick={abrirNuevo}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold shadow-lg shadow-sky-900/20 transition"
          >
            <Plus size={20} />
            Nueva tarjeta
          </button>
        </div>

        <div className="mt-6 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search
              className="absolute left-4 top-3.5 text-slate-400"
              size={20}
            />
            <input
              value={buscar}
              onChange={(e) => setBuscar(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') cargarTarjetas();
              }}
              className="w-full min-w-0 pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              placeholder="Buscar por cliente, teléfono, correo o código de barras..."
            />
          </div>

          <button
            onClick={cargarTarjetas}
            className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
          >
            <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
            Buscar
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <BadgePercent size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Total tarjetas</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {resumen.total}
          </h3>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
            <User size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Activas</p>
          <h3 className="text-3xl font-bold text-sky-700 mt-1">
            {resumen.activas}
          </h3>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
            <X size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Inactivas</p>
          <h3 className="text-3xl font-bold text-slate-800 mt-1">
            {resumen.inactivas}
          </h3>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Coins size={24} />
          </div>
          <p className="text-sm text-slate-500 mt-5">Puntos activos</p>
          <h3 className="text-3xl font-bold text-amber-700 mt-1 break-words">
            {formatoNumero(resumen.puntosActivos)}
          </h3>
        </div>
      </section>

      <section className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 sm:px-6 py-5 border-b border-slate-100">
          <h2 className="text-lg sm:text-xl font-bold text-slate-800">
            Listado de tarjetas
          </h2>
          <p className="text-sm text-slate-500">
            Consulta, edita, imprime y revisa movimientos de puntos.
          </p>
        </div>

        <div className="md:hidden p-4 space-y-3">
          {cargando ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500 font-semibold">
              Cargando tarjetas...
            </div>
          ) : tarjetas.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-6 text-center text-slate-500 font-semibold">
              No hay tarjetas registradas.
            </div>
          ) : (
            tarjetas.map((tarjeta) => (
              <article
                key={tarjeta.id_tarjeta}
                className="rounded-2xl border border-slate-100 p-4 shadow-sm bg-white"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 break-words">
                      {tarjeta.nombre_cliente}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Alta: {formatoFecha(tarjeta.fecha_creacion)}
                    </p>
                  </div>

                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full shrink-0 ${tarjeta.activo
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-slate-200 text-slate-600'
                      }`}
                  >
                    {tarjeta.activo ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                <button
                  onClick={() => copiarCodigo(tarjeta.codigo_barras)}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition break-all"
                  title="Copiar código"
                >
                  <BarcodeIcon size={17} className="shrink-0" />
                  <span className="break-all">{tarjeta.codigo_barras}</span>
                </button>

                <div className="mt-4 grid grid-cols-1 gap-2 text-sm">
                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Phone size={15} />
                      Teléfono
                    </p>
                    <p className="font-bold text-slate-700 break-words">
                      {tarjeta.telefono || '—'}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3">
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Mail size={15} />
                      Correo
                    </p>
                    <p className="font-bold text-slate-700 break-words">
                      {tarjeta.correo || '—'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-sky-50 p-3">
                    <p className="text-xs text-sky-700">Actuales</p>
                    <p className="font-bold text-sky-800">
                      {formatoNumero(tarjeta.puntos_actuales)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-blue-50 p-3">
                    <p className="text-xs text-blue-700">Acumulados</p>
                    <p className="font-bold text-blue-800">
                      {formatoNumero(tarjeta.puntos_acumulados)}
                    </p>
                  </div>

                  <div className="rounded-xl bg-red-50 p-3">
                    <p className="text-xs text-red-700">Canjeados</p>
                    <p className="font-bold text-red-800">
                      {formatoNumero(tarjeta.puntos_canjeados)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                  <button
                    onClick={() => abrirTarjetaImprimir(tarjeta)}
                    className="h-11 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 flex items-center justify-center transition"
                    title="Imprimir tarjeta"
                  >
                    <Printer size={18} />
                  </button>

                  <button
                    onClick={() => cargarMovimientos(tarjeta)}
                    className="h-11 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 flex items-center justify-center transition"
                    title="Movimientos"
                  >
                    <History size={18} />
                  </button>

                  <button
                    onClick={() => abrirEditar(tarjeta)}
                    className="h-11 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition"
                    title="Editar"
                  >
                    <Pencil size={18} />
                  </button>

                  <button
                    onClick={() => desactivarTarjeta(tarjeta)}
                    disabled={!tarjeta.activo}
                    className="h-11 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center transition disabled:opacity-40"
                    title="Desactivar"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[1150px]">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Cliente
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Código de barras
                </th>
                <th className="px-5 py-4 text-left text-xs font-bold text-slate-500 uppercase">
                  Contacto
                </th>
                <th className="px-5 py-4 text-right text-xs font-bold text-slate-500 uppercase">
                  Puntos actuales
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
                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase sticky right-0 bg-slate-50 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)] z-10">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {cargando ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-500">
                    Cargando tarjetas...
                  </td>
                </tr>
              ) : tarjetas.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-5 py-10 text-center text-slate-500">
                    No hay tarjetas registradas.
                  </td>
                </tr>
              ) : (
                tarjetas.map((tarjeta) => (
                  <tr key={tarjeta.id_tarjeta} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-bold text-slate-800">
                        {tarjeta.nombre_cliente}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Alta: {formatoFecha(tarjeta.fecha_creacion)}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <button
                        onClick={() => copiarCodigo(tarjeta.codigo_barras)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition"
                        title="Copiar código"
                      >
                        <BarcodeIcon size={17} />
                        {tarjeta.codigo_barras}
                      </button>
                    </td>

                    <td className="px-5 py-4 text-sm text-slate-600">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Phone size={15} className="text-slate-400" />
                          {tarjeta.telefono || '—'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail size={15} className="text-slate-400" />
                          {tarjeta.correo || '—'}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-right">
                      <span className="text-xl font-bold text-sky-700">
                        {formatoNumero(tarjeta.puntos_actuales)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-blue-700">
                      {formatoNumero(tarjeta.puntos_acumulados)}
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-red-700">
                      {formatoNumero(tarjeta.puntos_canjeados)}
                    </td>

                    <td className="px-5 py-4 text-center">
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full ${tarjeta.activo
                          ? 'bg-sky-100 text-sky-700'
                          : 'bg-slate-200 text-slate-600'
                          }`}
                      >
                        {tarjeta.activo ? 'Activa' : 'Inactiva'}
                      </span>
                    </td>

                    <td className="px-5 py-4 sticky right-0 bg-white shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.45)]">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => abrirTarjetaImprimir(tarjeta)}
                          className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 hover:bg-sky-100 flex items-center justify-center transition"
                          title="Imprimir tarjeta"
                        >
                          <Printer size={17} />
                        </button>

                        <button
                          onClick={() => cargarMovimientos(tarjeta)}
                          className="w-9 h-9 rounded-xl bg-violet-50 text-violet-700 hover:bg-violet-100 flex items-center justify-center transition"
                          title="Movimientos"
                        >
                          <History size={17} />
                        </button>

                        <button
                          onClick={() => abrirEditar(tarjeta)}
                          className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center justify-center transition"
                          title="Editar"
                        >
                          <Pencil size={17} />
                        </button>

                        <button
                          onClick={() => desactivarTarjeta(tarjeta)}
                          disabled={!tarjeta.activo}
                          className="w-9 h-9 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 flex items-center justify-center transition disabled:opacity-40"
                          title="Desactivar"
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={cerrarModal}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800 break-words">
                  {modoEdicion ? 'Editar tarjeta' : 'Nueva tarjeta de puntos'}
                </h2>
                <p className="text-sm text-slate-500">
                  El sistema generará el código de barras automáticamente.
                </p>
              </div>

              <button
                onClick={cerrarModal}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={guardarTarjeta}>
              <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-h-[70vh] overflow-y-auto">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Nombre del cliente *
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      name="nombre_cliente"
                      value={form.nombre_cliente}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="Ej. María López"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Código de barras
                  </label>

                  {modoEdicion ? (
                    <div className="relative">
                      <BarcodeIcon
                        className="absolute left-4 top-3.5 text-slate-400"
                        size={20}
                      />
                      <input
                        name="codigo_barras"
                        value={form.codigo_barras}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="Código de barras"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sky-800 font-semibold">
                      Se generará automáticamente al guardar.
                    </div>
                  )}
                </div>

                {!modoEdicion && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Puntos iniciales
                    </label>
                    <div className="relative">
                      <Coins
                        className="absolute left-4 top-3.5 text-slate-400"
                        size={20}
                      />
                      <input
                        type="number"
                        step="0.01"
                        name="puntos_iniciales"
                        value={form.puntos_iniciales}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                        placeholder="El cliente iniciara con 0 puntos."
                        disabled
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Teléfono
                  </label>
                  <div className="relative">
                    <Phone
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      name="telefono"
                      value={form.telefono}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="7711234567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">
                    Correo
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-4 top-3.5 text-slate-400"
                      size={20}
                    />
                    <input
                      name="correo"
                      value={form.correo}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      placeholder="cliente@correo.com"
                    />
                  </div>
                </div>

                {modoEdicion && (
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 cursor-pointer">
                      <input
                        type="checkbox"
                        name="activo"
                        checked={form.activo}
                        onChange={handleChange}
                        className="w-5 h-5 accent-sky-700 shrink-0"
                      />
                      <span className="font-semibold text-slate-700">
                        Tarjeta activa
                      </span>
                    </label>
                  </div>
                )}
              </div>

              <div className="px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={cerrarModal}
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
                  {guardando
                    ? 'Guardando...'
                    : modoEdicion
                      ? 'Actualizar tarjeta'
                      : 'Guardar y generar tarjeta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalTarjeta && tarjetaImprimir && (
        <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={cerrarTarjetaImprimir}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Tarjeta lista para imprimir
                </h2>
                <p className="text-sm text-slate-500 break-words">
                  {tarjetaImprimir.nombre_cliente} · {tarjetaImprimir.codigo_barras}
                </p>
              </div>

              <button
                onClick={cerrarTarjetaImprimir}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 bg-slate-100 overflow-x-auto">
              <div className="min-w-[520px] flex justify-center">
                <div id="tarjeta-puntos-print">
                  <div
                    className="print-stack"
                    style={{
                      width: '520px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '28px',
                    }}
                  >
                    <div
                      className="tarjeta-frente"
                      style={{
                        width: '520px',
                        height: '335px',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        position: 'relative',
                        color: '#ffffff',
                        background:
                          'linear-gradient(135deg, #003b66 0%, #004f86 42%, #01233f 100%)',
                        padding: '25px',
                        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.22)',
                      }}
                    >
                      <div
                        className="decor-soft"
                        style={{
                          position: 'absolute',
                          right: '80px',
                          top: '-80px',
                          width: '260px',
                          height: '260px',
                          borderRadius: '999px',
                          background: 'rgba(255,255,255,0.045)',
                        }}
                      />

                      <div
                        className="decor-dots"
                        style={{
                          position: 'absolute',
                          right: '38px',
                          top: '112px',
                          width: '78px',
                          height: '100px',
                          opacity: 0.18,
                          backgroundImage:
                            'radial-gradient(#7dd3fc 2px, transparent 2px)',
                          backgroundSize: '16px 16px',
                        }}
                      />

                      <div
                        className="front-content"
                        style={{
                          position: 'relative',
                          zIndex: 3,
                          height: '100%',
                        }}
                      >
                        <div
                          className="front-header"
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '18px',
                          }}
                        >
                          <div
                            className="brand-wrap"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '15px',
                            }}
                          >
                            <div
                              className="logo-card"
                              style={{
                                width: '66px',
                                height: '66px',
                                borderRadius: '18px',
                                background: 'rgba(255,255,255,0.98)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '8px',
                                boxShadow: '0 12px 24px rgba(0,0,0,0.16)',
                              }}
                            >
                              <img
                                src={logoShaddai}
                                alt="Farmacia Shaddai"
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'contain',
                                  display: 'block',
                                }}
                              />
                            </div>

                            <div>
                              <h3
                                className="brand-title"
                                style={{
                                  fontSize: '30px',
                                  fontWeight: 900,
                                  lineHeight: 0.98,
                                  margin: 0,
                                  letterSpacing: '-0.8px',
                                }}
                              >
                                Farmacia<br />Shaddai
                              </h3>

                              <p
                                className="brand-subtitle"
                                style={{
                                  marginTop: '9px',
                                  marginBottom: 0,
                                  fontSize: '11px',
                                  fontWeight: 900,
                                  letterSpacing: '4px',
                                  color: '#6ee7b7',
                                  textTransform: 'uppercase',
                                }}
                              >
                                Shaddai Club
                              </p>
                            </div>
                          </div>

                          <div
                            className="cliente-badge"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '12px 16px',
                              borderRadius: '999px',
                              background: 'linear-gradient(135deg, #059669, #047857)',
                              color: '#ffffff',
                              fontSize: '14px',
                              fontWeight: 800,
                              lineHeight: 1.1,
                              boxShadow: '0 12px 22px rgba(0,0,0,0.16)',
                            }}
                          >
                            <Star size={24} />
                            <span>
                              Cliente<br />frecuente
                            </span>
                          </div>
                        </div>

                        <div
                          className="cliente-section"
                          style={{
                            marginTop: '32px',
                          }}
                        >
                          <p
                            className="section-label"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '12px',
                              fontWeight: 900,
                              letterSpacing: '2px',
                              color: '#bfdbfe',
                              textTransform: 'uppercase',
                              marginTop: 0,
                              marginBottom: '10px',
                            }}
                          >
                            <User size={18} />
                            Cliente
                          </p>

                          <p
                            className="cliente-nombre"
                            style={{
                              fontSize: '27px',
                              fontWeight: 900,
                              lineHeight: 1,
                              textTransform: 'uppercase',
                              letterSpacing: '2px',
                              margin: 0,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              maxWidth: '430px',
                            }}
                          >
                            {tarjetaImprimir.nombre_cliente}
                          </p>

                          <div
                            className="points-line"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '9px',
                              marginTop: '15px',
                              fontSize: '15px',
                              fontWeight: 700,
                              color: '#ffffff',
                            }}
                          >
                            <BadgePercent size={19} />
                            Acumula{' '}
                            <strong style={{ color: '#86efac' }}>
                              puntos
                            </strong>{' '}
                            por cada compra
                          </div>
                        </div>

                        <div
                          className="barcode-panel"
                          style={{
                            position: 'absolute',
                            left: '25px',
                            right: '25px',
                            bottom: '22px',
                            height: '82px',
                            background: 'rgba(255,255,255,0.97)',
                            borderRadius: '17px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '12px 26px',
                            boxShadow: '0 16px 30px rgba(15, 23, 42, 0.22)',
                          }}
                        >
                          <div
                            className="barcode-main"
                            style={{
                              width: '100%',
                              textAlign: 'center',
                            }}
                          >
                            <Barcode
                              value={tarjetaImprimir.codigo_barras}
                              format="CODE128"
                              height={42}
                              width={1.25}
                              displayValue={false}
                              margin={0}
                            />

                            <p
                              className="codigo"
                              style={{
                                color: '#0f172a',
                                fontSize: '12px',
                                fontWeight: 900,
                                letterSpacing: '4px',
                                marginTop: '5px',
                                marginBottom: 0,
                                lineHeight: 1,
                              }}
                            >
                              {tarjetaImprimir.codigo_barras}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="tarjeta-reverso"
                      style={{
                        width: '520px',
                        height: '335px',
                        borderRadius: '24px',
                        overflow: 'hidden',
                        position: 'relative',
                        color: '#ffffff',
                        background:
                          'linear-gradient(135deg, #003b66 0%, #004f86 42%, #01233f 100%)',
                        boxShadow: '0 20px 40px rgba(15, 23, 42, 0.22)',
                      }}
                    >
                      <div
                        className="decor-soft"
                        style={{
                          position: 'absolute',
                          right: '80px',
                          top: '-80px',
                          width: '260px',
                          height: '260px',
                          borderRadius: '999px',
                          background: 'rgba(255,255,255,0.045)',
                        }}
                      />

                      <div
                        className="back-content"
                        style={{
                          position: 'relative',
                          zIndex: 3,
                          height: '100%',
                        }}
                      >
                        <div
                          className="back-top"
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1.15fr',
                            gap: '24px',
                            padding: '32px 33px 18px',
                            height: '238px',
                          }}
                        >
                          <div>
                            <p
                              className="back-title"
                              style={{
                                fontSize: '12px',
                                fontWeight: 900,
                                letterSpacing: '3px',
                                color: '#6ee7b7',
                                textTransform: 'uppercase',
                                marginTop: 0,
                                marginBottom: '18px',
                              }}
                            >
                              Beneficios
                            </p>

                            <div
                              className="benefit-list"
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '15px',
                              }}
                            >
                              <div
                                className="benefit-item"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '13px',
                                  color: '#ffffff',
                                  fontSize: '17px',
                                  fontWeight: 700,
                                  lineHeight: 1.15,
                                }}
                              >
                                <div
                                  className="benefit-icon"
                                  style={{
                                    width: '43px',
                                    height: '43px',
                                    borderRadius: '999px',
                                    background:
                                      'linear-gradient(135deg, #10b981, #047857)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    flexShrink: 0,
                                  }}
                                >
                                  <TicketPercent size={23} />
                                </div>
                                <span>
                                  Descuentos<br />exclusivos
                                </span>
                              </div>

                              <div
                                className="benefit-item"
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '13px',
                                  color: '#ffffff',
                                  fontSize: '17px',
                                  fontWeight: 700,
                                  lineHeight: 1.15,
                                }}
                              >
                                <div
                                  className="benefit-icon"
                                  style={{
                                    width: '43px',
                                    height: '43px',
                                    borderRadius: '999px',
                                    background:
                                      'linear-gradient(135deg, #10b981, #047857)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#ffffff',
                                    flexShrink: 0,
                                  }}
                                >
                                  <Gift size={23} />
                                </div>
                                <span>
                                  Promociones<br />especiales
                                </span>
                              </div>
                            </div>
                          </div>

                          <div>
                            
                                  <br />
                            <div
                              className="how-box"
                              style={{
                                background: 'rgba(2, 132, 199, 0.24)',
                                border: '1px solid rgba(125, 211, 252, 0.16)',
                                borderRadius: '18px',
                                padding: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '13px',
                                color: '#ffffff',
                                fontSize: '14px',
                                fontWeight: 700,
                                lineHeight: 1.35,
                              }}
                            >
                              <div
                                className="how-box-icon"
                                style={{
                                  width: '46px',
                                  height: '46px',
                                  borderRadius: '999px',
                                  background:
                                    'linear-gradient(135deg, #10b981, #047857)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <ShoppingBag size={24} />
                              </div>

                              <span>
                                Acumula puntos al realizar tus compras en Farmacia Shaddai.
                              </span>
                              <br />
                            </div>
                            <br />

<p
                              className="back-title"
                              style={{
                                fontSize: '12px',
                                fontWeight: 900,
                                letterSpacing: '3px',
                                color: '#6ee7b7',
                                textTransform: 'uppercase',
                                marginTop: 0,
                                marginBottom: '18px',
                              }}
                            >
                            {/*hola */}   
                            </p>


                          </div>
                        </div>

                        <div
                          className="back-bottom"
                          style={{
                            height: '97px',
                            background: 'rgba(0, 25, 48, 0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            padding: '18px 33px',
                            color: '#ffffff',
                          }}
                        >
                          <ShieldCheck
                            className="shield-icon"
                            size={42}
                            style={{
                              width: '42px',
                              height: '42px',
                              flexShrink: 0,
                              color: '#e0f2fe',
                            }}
                          />

                          <p
                            style={{
                              margin: 0,
                              fontSize: '13.5px',
                              lineHeight: 1.3,
                              fontWeight: 600,
                              color: '#f8fafc',
                            }}
                          >
                            Esta tarjeta es personal e intransferible.
                            Preséntala en cada compra para acumular puntos.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 sm:px-6 py-5 border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
              <button
                onClick={cerrarTarjetaImprimir}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
              >
                Cerrar
              </button>

              <button
                onClick={imprimirTarjeta}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-sky-700 hover:bg-sky-800 text-white font-bold transition"
              >
                <Printer size={19} />
                Imprimir tarjeta
              </button>
            </div>
          </div>
        </div>
      )}

      {modalMovimientos && tarjetaEditando && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center px-3 sm:px-4 py-4 sm:py-8 overflow-y-auto">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={cerrarMovimientos}
          />

          <div className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-5 border-b border-slate-100 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-slate-800">
                  Movimientos de puntos
                </h2>
                <p className="text-sm text-slate-500 break-words">
                  {tarjetaEditando.nombre_cliente} · {tarjetaEditando.codigo_barras}
                </p>
              </div>

              <button
                onClick={cerrarMovimientos}
                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto max-h-[75vh]">
              {cargandoMovimientos ? (
                <div className="text-center py-10 text-slate-500">
                  Cargando movimientos...
                </div>
              ) : movimientos.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  Esta tarjeta todavía no tiene movimientos.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[850px]">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Puntos
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Anteriores
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase">
                          Nuevos
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">
                          Venta
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
                              className={`text-xs font-bold px-3 py-1 rounded-full ${getMovimientoStyle(
                                mov.tipo_movimiento
                              )}`}
                            >
                              {mov.tipo_movimiento}
                            </span>
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-slate-800">
                            {formatoNumero(mov.puntos)}
                          </td>

                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatoNumero(mov.puntos_anteriores)}
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-sky-700">
                            {formatoNumero(mov.puntos_nuevos)}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {mov.folio_venta || '—'}
                          </td>

                          <td className="px-4 py-3 text-slate-600">
                            {mov.usuario || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}