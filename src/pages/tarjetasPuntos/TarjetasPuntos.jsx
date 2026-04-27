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
    CreditCard,
} from 'lucide-react';
import api from '../../api/axios';

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

        const ventana = window.open('', '_blank', 'width=620,height=620');

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
            padding-top: 32px;
          }

          .print-wrapper {
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: flex-start;
          }

          .tarjeta-print {
            width: 430px;
            height: 295px;
            border-radius: 24px;
            background: linear-gradient(135deg, #047857, #0f766e);
            color: white;
            padding: 24px;
            position: relative;
            overflow: hidden;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .circle-a {
            position: absolute;
            right: -45px;
            top: -45px;
            width: 150px;
            height: 150px;
            border-radius: 999px;
            background: rgba(255,255,255,0.13);
          }

          .circle-b {
            position: absolute;
            left: -50px;
            bottom: -45px;
            width: 145px;
            height: 145px;
            border-radius: 999px;
            background: rgba(255,255,255,0.12);
          }

          .content {
            position: relative;
            z-index: 2;
            height: 100%;
          }

          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }

          .brand-row {
            display: flex;
            align-items: center;
            gap: 10px;
          }

          .brand {
            font-size: 24px;
            font-weight: 800;
            line-height: 1.05;
            margin: 0;
          }

          .subtitle {
            font-size: 13px;
            color: #d1fae5;
            margin-top: 8px;
            margin-bottom: 0;
          }

          .badge {
            font-size: 12px;
            color: #d1fae5;
            font-weight: 700;
            text-align: right;
            max-width: 90px;
            line-height: 1.25;
          }

          .cliente-box {
            margin-top: 22px;
            margin-bottom: 10px;
          }

          .cliente-label {
            font-size: 12px;
            color: #d1fae5;
            margin: 0 0 4px 0;
          }

          .cliente {
            font-size: 20px;
            font-weight: 800;
            text-transform: uppercase;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 370px;
            margin: 0;
          }

          .puntos {
            font-size: 12px;
            color: #d1fae5;
            margin: 5px 0 0 0;
          }

          .barcode-box {
            background: white;
            border-radius: 14px;
            padding: 8px 10px 7px;
            text-align: center;
            margin-top: 12px;
            min-height: 82px;
          }

          .barcode-box svg {
            width: 100%;
            max-width: 330px;
            height: 48px;
            display: block;
            margin: 0 auto;
          }

          .codigo {
            color: #111827;
            font-size: 12px;
            font-weight: 800;
            letter-spacing: 2px;
            margin: 4px 0 0 0;
            line-height: 1;
          }

          @page {
            size: auto;
            margin: 12mm 0 0 0;
          }

          @media print {
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            .print-wrapper {
              padding-top: 18mm !important;
            }

            .tarjeta-print {
              box-shadow: none !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
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
            return 'bg-emerald-100 text-emerald-700';
        }

        if (['CANJE', 'AJUSTE_NEGATIVO'].includes(tipo)) {
            return 'bg-red-100 text-red-700';
        }

        return 'bg-slate-100 text-slate-700';
    };

    return (
        <div className="space-y-6">
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <BadgePercent size={25} />
                        </div>

                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">
                                Tarjetas de puntos
                            </h1>
                            <p className="text-slate-500">
                                Administra tarjetas con código de barras para acumular puntos por compra.
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={abrirNuevo}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold shadow-lg shadow-emerald-900/20 transition"
                    >
                        <Plus size={20} />
                        Nueva tarjeta
                    </button>
                </div>

                <div className="mt-6 flex flex-col md:flex-row gap-3">
                    <div className="relative flex-1">
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
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Buscar por cliente, teléfono, correo o código de barras..."
                        />
                    </div>

                    <button
                        onClick={cargarTarjetas}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition"
                    >
                        <RefreshCw size={19} className={cargando ? 'animate-spin' : ''} />
                        Buscar
                    </button>
                </div>
            </section>

            <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                        <BadgePercent size={24} />
                    </div>
                    <p className="text-sm text-slate-500 mt-5">Total tarjetas</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">
                        {resumen.total}
                    </h3>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center">
                        <User size={24} />
                    </div>
                    <p className="text-sm text-slate-500 mt-5">Activas</p>
                    <h3 className="text-3xl font-bold text-emerald-700 mt-1">
                        {resumen.activas}
                    </h3>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center">
                        <X size={24} />
                    </div>
                    <p className="text-sm text-slate-500 mt-5">Inactivas</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-1">
                        {resumen.inactivas}
                    </h3>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
                        <Coins size={24} />
                    </div>
                    <p className="text-sm text-slate-500 mt-5">Puntos activos</p>
                    <h3 className="text-3xl font-bold text-amber-700 mt-1">
                        {formatoNumero(resumen.puntosActivos)}
                    </h3>
                </div>
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
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
                                <th className="px-5 py-4 text-center text-xs font-bold text-slate-500 uppercase">
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
                                            <span className="text-xl font-bold text-emerald-700">
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
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-slate-200 text-slate-600'
                                                    }`}
                                            >
                                                {tarjeta.activo ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </td>

                                        <td className="px-5 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => abrirTarjetaImprimir(tarjeta)}
                                                    className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 flex items-center justify-center transition"
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
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    {modoEdicion ? 'Editar tarjeta' : 'Nueva tarjeta de puntos'}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    El sistema generará el código de barras automáticamente.
                                </p>
                            </div>

                            <button
                                onClick={cerrarModal}
                                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={guardarTarjeta} className="p-6">
                            <div className="grid md:grid-cols-2 gap-5">
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
                                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                                                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="Código de barras"
                                            />
                                        </div>
                                    ) : (
                                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-800 font-semibold">
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
                                                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                                                placeholder="0"
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
                                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                                                className="w-5 h-5 accent-emerald-700"
                                            />
                                            <span className="font-semibold text-slate-700">
                                                Tarjeta activa
                                            </span>
                                        </label>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 flex justify-end gap-3 border-t border-slate-100 pt-5">
                                <button
                                    type="button"
                                    onClick={cerrarModal}
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
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Tarjeta lista para imprimir
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {tarjetaImprimir.nombre_cliente} · {tarjetaImprimir.codigo_barras}
                                </p>
                            </div>

                            <button
                                onClick={cerrarTarjetaImprimir}
                                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 bg-slate-100 flex justify-center">
                            <div id="tarjeta-puntos-print">
                                <div
                                    className="tarjeta-print"
                                    style={{
                                        width: '430px',
                                        height: '295px',
                                        borderRadius: '24px',
                                        background: 'linear-gradient(135deg, #047857, #0f766e)',
                                        color: 'white',
                                        padding: '24px',
                                        position: 'relative',
                                        overflow: 'hidden',
                                        boxShadow: '0 24px 50px rgba(15, 23, 42, 0.25)',
                                    }}
                                >
                                    <div
                                        className="circle-a"
                                        style={{
                                            position: 'absolute',
                                            right: '-45px',
                                            top: '-45px',
                                            width: '150px',
                                            height: '150px',
                                            borderRadius: '999px',
                                            background: 'rgba(255,255,255,0.13)',
                                        }}
                                    />

                                    <div
                                        className="circle-b"
                                        style={{
                                            position: 'absolute',
                                            left: '-50px',
                                            bottom: '-45px',
                                            width: '145px',
                                            height: '145px',
                                            borderRadius: '999px',
                                            background: 'rgba(255,255,255,0.12)',
                                        }}
                                    />

                                    <div
                                        className="content"
                                        style={{
                                            position: 'relative',
                                            zIndex: 2,
                                            height: '100%',
                                        }}
                                    >
                                        <div
                                            className="header"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'flex-start',
                                                justifyContent: 'space-between',
                                                gap: '12px',
                                            }}
                                        >
                                            <div>
                                                <div
                                                    className="brand-row"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '10px',
                                                    }}
                                                >
                                                    <CreditCard size={30} />

                                                    <h3
                                                        className="brand"
                                                        style={{
                                                            fontSize: '24px',
                                                            fontWeight: 800,
                                                            lineHeight: 1.05,
                                                            margin: 0,
                                                        }}
                                                    >
                                                        Farmacia<br />Shaddai
                                                    </h3>
                                                </div>

                                                <p
                                                    className="subtitle"
                                                    style={{
                                                        fontSize: '13px',
                                                        color: '#d1fae5',
                                                        marginTop: '8px',
                                                        marginBottom: 0,
                                                    }}
                                                >
                                                    Tarjeta de puntos
                                                </p>
                                            </div>

                                            <div
                                                className="badge"
                                                style={{
                                                    fontSize: '12px',
                                                    color: '#d1fae5',
                                                    fontWeight: 700,
                                                    textAlign: 'right',
                                                    maxWidth: '90px',
                                                    lineHeight: 1.25,
                                                }}
                                            >
                                                Cliente frecuente
                                            </div>
                                        </div>

                                        <div
                                            className="cliente-box"
                                            style={{
                                                marginTop: '22px',
                                                marginBottom: '10px',
                                            }}
                                        >
                                            <p
                                                className="cliente-label"
                                                style={{
                                                    fontSize: '12px',
                                                    color: '#d1fae5',
                                                    marginBottom: '4px',
                                                    marginTop: 0,
                                                }}
                                            >
                                                Cliente
                                            </p>

                                            <p
                                                className="cliente"
                                                style={{
                                                    fontSize: '20px',
                                                    fontWeight: 800,
                                                    textTransform: 'uppercase',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '370px',
                                                    margin: 0,
                                                }}
                                            >
                                                {tarjetaImprimir.nombre_cliente}
                                            </p>

                                           
                                        </div>

                                        <div
                                            className="barcode-box"
                                            style={{
                                                background: 'white',
                                                borderRadius: '14px',
                                                padding: '8px 10px 7px',
                                                textAlign: 'center',
                                                marginTop: '12px',
                                                minHeight: '82px',
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
                                                    color: '#111827',
                                                    fontSize: '12px',
                                                    fontWeight: 800,
                                                    letterSpacing: '2px',
                                                    marginTop: '4px',
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
                        </div>

                        <div className="px-6 py-5 border-t border-slate-100 flex justify-end gap-3">
                            <button
                                onClick={cerrarTarjetaImprimir}
                                className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition"
                            >
                                Cerrar
                            </button>

                            <button
                                onClick={imprimirTarjeta}
                                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition"
                            >
                                <Printer size={19} />
                                Imprimir tarjeta
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {modalMovimientos && tarjetaEditando && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">
                                    Movimientos de puntos
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {tarjetaEditando.nombre_cliente} · {tarjetaEditando.codigo_barras}
                                </p>
                            </div>

                            <button
                                onClick={cerrarMovimientos}
                                className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[75vh]">
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

                                                    <td className="px-4 py-3 text-right font-bold text-emerald-700">
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