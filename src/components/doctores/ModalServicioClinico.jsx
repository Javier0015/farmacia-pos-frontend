import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  AlertTriangle,
  BadgeCheck,
  ClipboardList,
  Loader2,
  Minus,
  Package,
  Plus,
  PlusCircle,
  Search,
  Trash2,
  X,
} from 'lucide-react';

import api from '../../api/axios';

const servicioInicial = {
  id_servicio: '',
  cantidad: 1,
  precio_unitario: 0,
  indicaciones: '',
  observaciones: '',
};

const limpiarNumero = (valor, fallback = 0) => {
  const numero = Number(valor);
  return Number.isNaN(numero) ? fallback : numero;
};

const formatearMoneda = (valor) => {
  const numero = Number(valor || 0);

  return numero.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
  });
};

export default function ModalServicioClinico({
  abierto,
  onClose,
  paciente,
  expediente,
  perfilDoctor,
  idExpediente,
  idFila,
  idSucursal,
  tipoAtencion = 'SERVICIO_RAPIDO',
  onGuardado,
}) {
  const [catalogoServicios, setCatalogoServicios] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(false);
  const [busquedaServicio, setBusquedaServicio] = useState('');

  const [servicioForm, setServicioForm] = useState(servicioInicial);
  const [serviciosSeleccionados, setServiciosSeleccionados] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [productos, setProductos] = useState([]);
  const [cargandoProductos, setCargandoProductos] = useState(false);
  const [uidServicioProductoActivo, setUidServicioProductoActivo] = useState(null);

  const nombrePaciente =
    paciente?.nombre_paciente ||
    paciente?.nombre ||
    expediente?.nombre_paciente ||
    '';

  const totalServicios = useMemo(() => {
    return serviciosSeleccionados.reduce((acc, item) => {
      return acc + Number(item.subtotal || 0);
    }, 0);
  }, [serviciosSeleccionados]);

  const serviciosFiltrados = useMemo(() => {
    const texto = busquedaServicio.trim().toLowerCase();

    if (!texto) return catalogoServicios;

    return catalogoServicios.filter((item) => {
      return (
        String(item.nombre || '').toLowerCase().includes(texto) ||
        String(item.descripcion || '').toLowerCase().includes(texto)
      );
    });
  }, [catalogoServicios, busquedaServicio]);

  const cargarCatalogoServicios = async () => {
    try {
      setCargandoCatalogo(true);

      const { data } = await api.get('/doctor-shaddai/servicios-clinicos/catalogo');

      setCatalogoServicios(data.servicios || []);
    } catch (error) {
      console.error('Error al cargar catálogo de servicios clínicos:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo cargar el catálogo de servicios clínicos.',
      });
    } finally {
      setCargandoCatalogo(false);
    }
  };

  const buscarProductosRelacionados = async (texto = '') => {
    const busqueda = String(texto || '').trim();

    if (busqueda.length < 2) {
      setProductos([]);
      return;
    }

    try {
      setCargandoProductos(true);

      const { data } = await api.get('/inventario/stock-sucursales', {
        params: {
          nombre: busqueda,
        },
      });

      const lista =
        data.productos ||
        data.inventario ||
        data.stock ||
        data.resultados ||
        data.data ||
        data.items ||
        [];

      const normalizados = lista.map((item) => ({
        id_producto:
          item.id_producto ||
          item.id ||
          item.producto_id ||
          item.id_inventario ||
          item.id_producto_fk,

        nombre:
          item.nombre_producto ||
          item.nombre ||
          item.producto ||
          item.descripcion_producto ||
          'Producto sin nombre',

        codigo_barras: item.codigo_barras || item.codigo || item.codigo_barra || item.clave || '',

        presentacion: item.presentacion || item.descripcion || '',

        stock: Number(
          item.stock_disponible ??
          item.stock ??
          item.cantidad ??
          item.existencia ??
          item.total_stock ??
          0
        ),

        precio: Number(
          item.precio_venta ??
          item.precio ??
          item.precio_publico ??
          item.precio_unitario ??
          0
        ),
      }));

      const agrupados = Object.values(
        normalizados.reduce((acc, item) => {
          const key = item.id_producto || `${item.codigo_barras}-${item.nombre}`;

          if (!acc[key]) {
            acc[key] = {
              ...item,
              stock_total: 0,
            };
          }

          acc[key].stock_total += Number(item.stock || 0);
          acc[key].stock = acc[key].stock_total;

          return acc;
        }, {})
      );

      setProductos(agrupados);
    } catch (error) {
      console.error('Error al buscar productos relacionados:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron consultar productos relacionados.',
      });
    } finally {
      setCargandoProductos(false);
    }
  };

  useEffect(() => {
    if (!abierto) return;

    cargarCatalogoServicios();
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;

    const timer = setTimeout(() => {
      buscarProductosRelacionados(busquedaProducto);
    }, 450);

    return () => clearTimeout(timer);
  }, [busquedaProducto, abierto]);

  const cerrarModal = () => {
    if (guardando) return;

    setServicioForm(servicioInicial);
    setServiciosSeleccionados([]);
    setBusquedaServicio('');
    setBusquedaProducto('');
    setProductos([]);
    setUidServicioProductoActivo(null);
    onClose?.();
  };

  const seleccionarServicioFormulario = (idServicio) => {
    const servicio = catalogoServicios.find(
      (item) => Number(item.id_servicio) === Number(idServicio)
    );

    if (!servicio) {
      setServicioForm(servicioInicial);
      return;
    }

    setServicioForm({
      id_servicio: servicio.id_servicio,
      cantidad: 1,
      precio_unitario: Number(servicio.precio || 0),
      indicaciones: '',
      observaciones: '',
    });
  };

  const agregarServicio = (servicioDirecto = null) => {
    const idServicio = servicioDirecto?.id_servicio || servicioForm.id_servicio;

    const servicioCatalogo = catalogoServicios.find(
      (item) => Number(item.id_servicio) === Number(idServicio)
    );

    if (!servicioCatalogo) {
      Swal.fire({
        icon: 'warning',
        title: 'Servicio requerido',
        text: 'Selecciona un servicio clínico válido.',
        confirmButtonColor: '#0284c7',
      });

      return;
    }

    const yaExiste = serviciosSeleccionados.some(
      (item) => Number(item.id_servicio) === Number(servicioCatalogo.id_servicio)
    );

    if (yaExiste) {
      Swal.fire({
        icon: 'info',
        title: 'Servicio ya agregado',
        text: 'Este servicio clínico ya está en la solicitud.',
        timer: 1400,
        showConfirmButton: false,
      });

      return;
    }

    const cantidad = limpiarNumero(servicioForm.cantidad, 1) || 1;
    const precioUnitario = servicioDirecto
      ? Number(servicioCatalogo.precio || 0)
      : limpiarNumero(servicioForm.precio_unitario, 0);

    const nuevoServicio = {
      uid: `${servicioCatalogo.id_servicio}-${Date.now()}`,
      id_servicio: servicioCatalogo.id_servicio,
      nombre_servicio: servicioCatalogo.nombre,
      descripcion: servicioCatalogo.descripcion,
      requiere_producto:
        servicioCatalogo.requiere_producto === true ||
        servicioCatalogo.requiere_producto === 'true',
      cantidad,
      precio_unitario: precioUnitario,
      subtotal: Number((cantidad * precioUnitario).toFixed(2)),
      indicaciones: servicioForm.indicaciones || '',
      observaciones: servicioForm.observaciones || '',
      id_producto: null,
      nombre_producto: '',
      codigo_barras_producto: '',
    };

    setServiciosSeleccionados((prev) => [...prev, nuevoServicio]);
    setServicioForm(servicioInicial);
    setBusquedaServicio('');
  };

  const actualizarServicio = (uid, campo, valor) => {
    setServiciosSeleccionados((prev) =>
      prev.map((item) => {
        if (item.uid !== uid) return item;

        if (campo === 'cantidad') {
          const cantidad = Math.max(limpiarNumero(valor, 1), 1);
          return {
            ...item,
            cantidad,
            subtotal: Number((cantidad * Number(item.precio_unitario || 0)).toFixed(2)),
          };
        }

        if (campo === 'precio_unitario') {
          const precio = Math.max(limpiarNumero(valor, 0), 0);
          return {
            ...item,
            precio_unitario: precio,
            subtotal: Number((Number(item.cantidad || 1) * precio).toFixed(2)),
          };
        }

        return {
          ...item,
          [campo]: valor,
        };
      })
    );
  };

  const aumentarCantidad = (item) => {
    actualizarServicio(item.uid, 'cantidad', Number(item.cantidad || 1) + 1);
  };

  const disminuirCantidad = (item) => {
    actualizarServicio(item.uid, 'cantidad', Math.max(Number(item.cantidad || 1) - 1, 1));
  };

  const eliminarServicio = (uid) => {
    setServiciosSeleccionados((prev) => prev.filter((item) => item.uid !== uid));

    if (uidServicioProductoActivo === uid) {
      setUidServicioProductoActivo(null);
      setBusquedaProducto('');
      setProductos([]);
    }
  };

  const seleccionarProductoRelacionado = (producto) => {
    if (!uidServicioProductoActivo) return;

    setServiciosSeleccionados((prev) =>
      prev.map((item) => {
        if (item.uid !== uidServicioProductoActivo) return item;

        return {
          ...item,
          id_producto: producto.id_producto,
          nombre_producto: producto.nombre,
          codigo_barras_producto: producto.codigo_barras || '',
        };
      })
    );

    setBusquedaProducto('');
    setProductos([]);
    setUidServicioProductoActivo(null);
  };

  const limpiarProductoRelacionado = (uid) => {
    setServiciosSeleccionados((prev) =>
      prev.map((item) => {
        if (item.uid !== uid) return item;

        return {
          ...item,
          id_producto: null,
          nombre_producto: '',
          codigo_barras_producto: '',
        };
      })
    );
  };

  const validarSolicitud = () => {
    if (!idExpediente) {
      Swal.fire({
        icon: 'warning',
        title: 'Expediente requerido',
        text: 'Selecciona o carga un expediente clínico antes de registrar el servicio.',
        confirmButtonColor: '#0284c7',
      });

      return false;
    }

    if (!nombrePaciente.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Paciente requerido',
        text: 'No se pudo identificar el nombre del paciente.',
        confirmButtonColor: '#0284c7',
      });

      return false;
    }

    if (serviciosSeleccionados.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Servicio requerido',
        text: 'Agrega al menos un servicio clínico.',
        confirmButtonColor: '#0284c7',
      });

      return false;
    }

    const servicioSinProducto = serviciosSeleccionados.find(
      (item) => item.requiere_producto && !item.id_producto
    );

    if (servicioSinProducto) {
      Swal.fire({
        icon: 'warning',
        title: 'Producto relacionado requerido',
        text: `El servicio ${servicioSinProducto.nombre_servicio} requiere seleccionar un producto relacionado.`,
        confirmButtonColor: '#0284c7',
      });

      return false;
    }

    const servicioSinIndicaciones = serviciosSeleccionados.find(
      (item) => !String(item.indicaciones || '').trim()
    );
    /*
      if (servicioSinIndicaciones) {
        Swal.fire({
          icon: 'warning',
          title: 'Indicaciones requeridas',
          text: `Agrega indicaciones para ${servicioSinIndicaciones.nombre_servicio}.`,
          confirmButtonColor: '#0284c7',
        }); 
              return false;
      }*/

    return true;
  };

  const prepararPayload = () => {
    const diagnosticoFinal =
      paciente?.diagnostico?.trim?.() ||
      expediente?.diagnostico_inicial ||
      expediente?.diagnostico ||
      null;

    const observacionesFinal =
      paciente?.observaciones?.trim?.() ||
      expediente?.observaciones_generales ||
      null;

    return {
      id_paciente_expediente: idExpediente || null,
      id_fila: idFila || null,
      id_sucursal: idSucursal || expediente?.id_sucursal || null,
      tipo_atencion: tipoAtencion || 'SERVICIO_RAPIDO',
      paciente: {
        nombre_paciente: nombrePaciente.trim(),
        telefono: paciente?.telefono || expediente?.telefono || null,
        edad: paciente?.edad ? Number(paciente.edad) : expediente?.edad || null,
        sexo: paciente?.sexo || expediente?.sexo || null,
        diagnostico: diagnosticoFinal,
        observaciones: observacionesFinal,
      },
      diagnostico: diagnosticoFinal,
      observaciones: observacionesFinal,
      servicios: serviciosSeleccionados.map((item) => ({
        id_servicio: item.id_servicio,
        id_producto: item.id_producto || null,
        nombre_servicio: item.nombre_servicio,
        cantidad: Number(item.cantidad || 1),
        precio_unitario: Number(item.precio_unitario || 0),
        indicaciones: item.indicaciones?.trim() || null,
        observaciones: item.observaciones?.trim() || null,
      })),
    };
  };

  const guardarServicioClinico = async () => {
    if (!validarSolicitud()) return;

    const result = await Swal.fire({
      icon: 'question',
      title: 'Enviar servicio a caja',
      html: `
        <div style="text-align:left; font-size:14px; line-height:1.6;">
          <p>Se registrará el servicio clínico y quedará como <strong>PENDIENTE_CAJERO</strong>.</p>
          <p><strong>Total:</strong> ${formatearMoneda(totalServicios)}</p>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
    });

    if (!result.isConfirmed) return;

    try {
      setGuardando(true);

      const payload = prepararPayload();

      const { data } = await api.post('/doctor-shaddai/servicios-clinicos', payload);

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo generar el servicio clínico.');
      }

      onGuardado?.(data);
      setServicioForm(servicioInicial);
      setServiciosSeleccionados([]);
      setBusquedaServicio('');
      setBusquedaProducto('');
      setProductos([]);
      setUidServicioProductoActivo(null);
    } catch (error) {
      console.error('Error al guardar servicio clínico:', error);

      if (error.response?.data?.codigo === 'PERFIL_DOCTOR_INCOMPLETO') {
        Swal.fire({
          icon: 'warning',
          title: 'Perfil médico incompleto',
          text:
            error.response?.data?.mensaje ||
            'Debes completar tu perfil de Doctor Shaddai antes de generar servicios clínicos.',
          confirmButtonColor: '#0284c7',
        });

        return;
      }

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo generar el servicio clínico.',
      });
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm no-print">
      <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div className="min-w-0">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
              <ClipboardList size={14} />
              Servicio clínico rápido
            </div>

            <h2 className="truncate text-xl font-black text-slate-800">
              Registrar servicio clínico
            </h2>

            <p className="truncate text-sm text-slate-500">
              {nombrePaciente || 'Paciente sin seleccionar'} · Expediente #{idExpediente || 'N/A'}
            </p>
          </div>

          <button
            type="button"
            onClick={cerrarModal}
            disabled={guardando}
            className="ml-4 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-5">
              <section className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="mb-4 flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                    <ClipboardList size={23} />
                  </div>

                  <div>
                    <h3 className="font-black text-slate-800">Catálogo de servicios</h3>
                    <p className="mt-1 text-sm text-slate-600">
                      Selecciona el procedimiento que se enviará a caja para cobro.
                    </p>
                  </div>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-3.5 text-slate-400" size={19} />
                  <input
                    type="text"
                    value={busquedaServicio}
                    onChange={(e) => setBusquedaServicio(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="Buscar servicio: inyección, curación, glucosa..."
                  />
                </div>

                <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-1">
                  {cargandoCatalogo ? (
                    <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-5 text-sm font-bold text-slate-600">
                      <Loader2 size={18} className="animate-spin" />
                      Cargando servicios...
                    </div>
                  ) : serviciosFiltrados.length === 0 ? (
                    <div className="rounded-2xl bg-white p-5 text-sm text-slate-500">
                      No se encontraron servicios clínicos activos.
                    </div>
                  ) : (
                    serviciosFiltrados.map((servicio) => {
                      const agregado = serviciosSeleccionados.some(
                        (item) => Number(item.id_servicio) === Number(servicio.id_servicio)
                      );
                      const requiereProducto =
                        servicio.requiere_producto === true || servicio.requiere_producto === 'true';

                      return (
                        <div
                          key={servicio.id_servicio}
                          className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <h4 className="font-black text-slate-800">{servicio.nombre}</h4>

                              {servicio.descripcion && (
                                <p className="mt-1 text-sm leading-snug text-slate-500">
                                  {servicio.descripcion}
                                </p>
                              )}

                              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full bg-emerald-100 px-3 py-1 font-black text-emerald-700">
                                  {formatearMoneda(servicio.precio)}
                                </span>

                                {requiereProducto && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-black text-amber-700">
                                    <AlertTriangle size={13} />
                                    Requiere producto
                                  </span>
                                )}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => agregarServicio(servicio)}
                              disabled={agregado}
                              className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2 text-sm font-black transition ${agregado
                                ? 'bg-slate-200 text-slate-500'
                                : 'bg-emerald-600 text-white hover:bg-emerald-700'
                                }`}
                            >
                              <Plus size={17} />
                              {agregado ? 'Agregado' : 'Agregar'}
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>

              {/*<section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="font-black text-slate-800">Agregar manualmente</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Úsalo cuando quieras ajustar cantidad, precio o indicaciones antes de agregar.
                </p>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                      Servicio
                    </label>
                    <select
                      value={servicioForm.id_servicio}
                      onChange={(e) => seleccionarServicioFormulario(e.target.value)}
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Selecciona un servicio</option>
                      {catalogoServicios.map((servicio) => (
                        <option key={servicio.id_servicio} value={servicio.id_servicio}>
                          {servicio.nombre} - {formatearMoneda(servicio.precio)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={servicioForm.cantidad}
                      onChange={(e) =>
                        setServicioForm((prev) => ({
                          ...prev,
                          cantidad: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                      Precio unitario
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={servicioForm.precio_unitario}
                      onChange={(e) =>
                        setServicioForm((prev) => ({
                          ...prev,
                          precio_unitario: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                      Indicaciones
                    </label>
                    <textarea
                      value={servicioForm.indicaciones}
                      onChange={(e) =>
                        setServicioForm((prev) => ({
                          ...prev,
                          indicaciones: e.target.value,
                        }))
                      }
                      rows="2"
                      className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Ej. Aplicar vía intramuscular, realizar curación sencilla..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                      Observaciones
                    </label>
                    <textarea
                      value={servicioForm.observaciones}
                      onChange={(e) =>
                        setServicioForm((prev) => ({
                          ...prev,
                          observaciones: e.target.value,
                        }))
                      }
                      rows="2"
                      className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder="Observaciones internas para caja o seguimiento clínico..."
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => agregarServicio()}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  <PlusCircle size={18} />
                  Agregar a solicitud
                </button>
              </section> 
              */}
            </div>


            <div className="space-y-5">
              <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-black text-slate-800">Servicios seleccionados</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Estos servicios se enviarán al cajero como pendiente de cobro.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-black text-emerald-700">
                    Total: {formatearMoneda(totalServicios)}
                  </div>
                </div>

                {serviciosSeleccionados.length === 0 ? (
                  <div className="flex min-h-80 flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
                      <ClipboardList size={34} />
                    </div>
                    <h4 className="text-lg font-black text-slate-800">Sin servicios agregados</h4>
                    <p className="mt-2 max-w-sm text-sm text-slate-500">
                      Selecciona un servicio del catálogo para comenzar.
                    </p>
                  </div>
                ) : (
                  <div className="max-h-[620px] space-y-4 overflow-y-auto pr-1">
                    {serviciosSeleccionados.map((item) => (
                      <div key={item.uid} className="rounded-3xl border border-slate-100 bg-slate-50 p-4">
                        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <div className="mb-2 flex flex-wrap items-center gap-2">
                              <h4 className="font-black text-slate-900">{item.nombre_servicio}</h4>
                              {item.requiere_producto && (
                                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">
                                  Requiere producto
                                </span>
                              )}
                            </div>

                            {item.descripcion && (
                              <p className="text-sm leading-snug text-slate-500">{item.descripcion}</p>
                            )}

                            {item.nombre_producto && (
                              <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-2xl bg-white px-3 py-2 text-xs font-bold text-slate-700 ring-1 ring-slate-200">
                                <Package size={14} />
                                <span className="truncate">
                                  Producto: {item.nombre_producto}
                                  {item.codigo_barras_producto ? ` · ${item.codigo_barras_producto}` : ''}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => limpiarProductoRelacionado(item.uid)}
                                  className="ml-1 text-red-600 hover:text-red-700"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => eliminarServicio(item.uid)}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700 transition hover:bg-red-200"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                              Cantidad
                            </label>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => disminuirCantidad(item)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 hover:bg-slate-100"
                              >
                                <Minus size={16} />
                              </button>

                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => actualizarServicio(item.uid, 'cantidad', e.target.value)}
                                className="h-10 w-20 rounded-xl border border-slate-200 text-center text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                              />

                              <button
                                type="button"
                                onClick={() => aumentarCantidad(item)}
                                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 hover:bg-slate-100"
                              >
                                <PlusCircle size={16} />
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                              Precio unitario
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.precio_unitario}
                              onChange={(e) => actualizarServicio(item.uid, 'precio_unitario', e.target.value)}
                              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <p className="mt-1 text-xs font-black text-emerald-700">
                              Subtotal: {formatearMoneda(item.subtotal)}
                            </p>
                          </div>

                          <div className="md:col-span-2">
                            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                              Indicaciones
                            </label>
                            <textarea
                              value={item.indicaciones}
                              onChange={(e) => actualizarServicio(item.uid, 'indicaciones', e.target.value)}
                              rows="2"
                              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="Ej. Aplicar vía intramuscular, realizar curación sencilla..."
                            />
                          </div>

                          <div className="md:col-span-2">
                            <label className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">
                              Observaciones
                            </label>
                            <textarea
                              value={item.observaciones}
                              onChange={(e) => actualizarServicio(item.uid, 'observaciones', e.target.value)}
                              rows="2"
                              className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                              placeholder="Observaciones para caja o seguimiento..."
                            />
                          </div>
                        </div>

                        {item.requiere_producto && !item.nombre_producto && (
                          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                            <div className="mb-3 flex items-start gap-2 text-sm text-amber-800">
                              <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                              <div>
                                <p className="font-black">Este servicio requiere producto relacionado.</p>
                                <p className="mt-0.5 text-xs">
                                  Ejemplo: medicamento para inyección, tira reactiva o solución para nebulización.
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                setUidServicioProductoActivo(item.uid);
                                setBusquedaProducto('');
                                setProductos([]);
                              }}
                              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-black text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
                            >
                              <Package size={16} />
                              Buscar producto relacionado
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {uidServicioProductoActivo && (
                <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-black text-amber-900">Producto relacionado</h3>
                      <p className="mt-1 text-sm text-amber-800">
                        Busca el producto que corresponde al servicio seleccionado.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setUidServicioProductoActivo(null);
                        setBusquedaProducto('');
                        setProductos([]);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white text-amber-700 ring-1 ring-amber-200 hover:bg-amber-100"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="relative">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={19} />
                    <input
                      type="text"
                      value={busquedaProducto}
                      onChange={(e) => setBusquedaProducto(e.target.value)}
                      className="w-full rounded-2xl border border-amber-200 bg-white py-3 pl-12 pr-4 text-sm outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="Buscar medicamento o producto..."
                    />
                  </div>

                  <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                    {cargandoProductos ? (
                      <div className="flex items-center justify-center gap-2 rounded-2xl bg-white p-5 text-sm font-bold text-slate-600">
                        <Loader2 size={18} className="animate-spin" />
                        Buscando productos...
                      </div>
                    ) : busquedaProducto.trim().length < 2 ? (
                      <div className="rounded-2xl bg-white p-5 text-sm text-slate-500">
                        Escribe al menos 2 caracteres para buscar productos.
                      </div>
                    ) : productos.length === 0 ? (
                      <div className="rounded-2xl bg-white p-5 text-sm text-slate-500">
                        No se encontraron productos.
                      </div>
                    ) : (
                      productos.map((producto) => (
                        <button
                          key={producto.id_producto || producto.codigo_barras || producto.nombre}
                          type="button"
                          onClick={() => seleccionarProductoRelacionado(producto)}
                          className="w-full rounded-2xl border border-amber-100 bg-white p-4 text-left transition hover:border-amber-300"
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="font-black text-slate-800">{producto.nombre}</p>
                              <p className="mt-1 text-xs text-slate-500">
                                {producto.codigo_barras ? `Código: ${producto.codigo_barras}` : 'Sin código'}
                                {producto.presentacion ? ` · ${producto.presentacion}` : ''}
                              </p>
                            </div>

                            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                              Stock: {Number(producto.stock || 0)}
                            </span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100 bg-white px-6 py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="text-sm text-slate-500">
              <span className="font-black text-slate-700">
                {serviciosSeleccionados.length} servicio(s)
              </span>{' '}
              · Total {formatearMoneda(totalServicios)}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cerrarModal}
                disabled={guardando}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={guardarServicioClinico}
                disabled={guardando || serviciosSeleccionados.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {guardando ? <Loader2 size={18} className="animate-spin" /> : <BadgeCheck size={18} />}
                {guardando ? 'Enviando...' : 'Enviar a caja'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
