import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Building2,
  CalendarDays,
  ChevronDown,
  Eye,
  FileText,
  Hash,
  Loader2,
  MapPin,
  Package,
  Phone,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Save,
  Settings,
  Store,
  UserRound,
  WalletCards,
  KeyRound,
  Mail,
  Send,
  ShieldCheck,
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const CONFIGURACION_DEFAULT = {
  nombre_negocio: 'FARMACIAS SHADDAI',
  encabezado: [],
  rfc: '',
  direccion: '',
  telefono: '',

  mostrar_nombre_negocio: true,
  mostrar_sucursal: true,
  mostrar_rfc: true,
  mostrar_direccion: true,
  mostrar_telefono: true,
  mostrar_fecha: true,
  mostrar_cajero: true,
  mostrar_caja: true,
  mostrar_folio: true,

  mostrar_articulos: true,
  mostrar_lote: true,
  mostrar_caducidad: true,
  mostrar_numero_articulos: true,

  mostrar_subtotal: true,
  mostrar_impuesto: true,
  mostrar_descuento: true,
  mostrar_total: true,

  mostrar_pagos: true,
  mostrar_metodo_pago: true,
  mostrar_cambio: true,
  mostrar_ahorro: true,

  pie_ticket: [
    '*** GRACIAS POR SU COMPRA ***',
    'CONSERVE SU TICKET PARA',
    'CUALQUIER DUDA O ACLARACION',
  ],

  lineas_finales: 3,
};

const CONFIGURACION_CORREO_DEFAULT = {
  activo: false,
  enviar_ticket_automatico: false,

  nombre_remitente: 'Farmacias Shaddai',
  correo_remitente: '',

  smtp_host: '',
  smtp_port: 587,
  smtp_secure: false,
  smtp_require_tls: true,
  smtp_usuario: '',

  // Nunca se obtiene desde el backend; solo se captura cuando se desea actualizar.
  smtp_password: '',
  password_configurada: false,
  origen_configuracion: 'SIN_CONFIGURACION',
};

const OPCIONES_ENCABEZADO = [
  {
    campo: 'mostrar_nombre_negocio',
    titulo: 'Nombre del negocio',
    descripcion: 'Muestra el nombre principal de la farmacia.',
  },
  {
    campo: 'mostrar_sucursal',
    titulo: 'Sucursal',
    descripcion: 'Muestra el nombre de la sucursal que realizó la venta.',
  },
  {
    campo: 'mostrar_rfc',
    titulo: 'RFC',
    descripcion: 'Muestra el RFC configurado en el encabezado.',
  },
  {
    campo: 'mostrar_direccion',
    titulo: 'Dirección',
    descripcion: 'Muestra la dirección configurada o la de la sucursal.',
  },
  {
    campo: 'mostrar_telefono',
    titulo: 'Teléfono',
    descripcion: 'Muestra el teléfono configurado o el de la sucursal.',
  },
];

const OPCIONES_VENTA = [
  {
    campo: 'mostrar_fecha',
    titulo: 'Fecha y hora',
    descripcion: 'Muestra la fecha y hora de la venta.',
  },
  {
    campo: 'mostrar_cajero',
    titulo: 'Cajero',
    descripcion: 'Muestra el usuario que registró la venta.',
  },
  {
    campo: 'mostrar_caja',
    titulo: 'Caja',
    descripcion: 'Muestra la caja utilizada para cobrar.',
  },
  {
    campo: 'mostrar_folio',
    titulo: 'Folio',
    descripcion: 'Muestra el folio de la venta.',
  },
];

const OPCIONES_ARTICULOS = [
  {
    campo: 'mostrar_articulos',
    titulo: 'Detalle de artículos',
    descripcion: 'Muestra productos, cantidades e importes.',
  },
  {
    campo: 'mostrar_lote',
    titulo: 'Lote',
    descripcion: 'Muestra el lote de cada producto cuando exista.',
  },
  {
    campo: 'mostrar_caducidad',
    titulo: 'Caducidad',
    descripcion: 'Muestra la fecha de caducidad cuando exista.',
  },
  {
    campo: 'mostrar_numero_articulos',
    titulo: 'Número de artículos',
    descripcion: 'Muestra el total de piezas vendidas.',
  },
];

const OPCIONES_TOTALES = [
  {
    campo: 'mostrar_subtotal',
    titulo: 'Subtotal',
    descripcion: 'Muestra el subtotal antes de impuestos.',
  },
  {
    campo: 'mostrar_impuesto',
    titulo: 'Impuesto',
    descripcion: 'Muestra el IVA cuando la venta lo incluya.',
  },
  {
    campo: 'mostrar_descuento',
    titulo: 'Descuentos',
    descripcion: 'Muestra descuentos y ofertas aplicadas.',
  },
  {
    campo: 'mostrar_total',
    titulo: 'Total',
    descripcion: 'Muestra el total final de la venta.',
  },
];

const OPCIONES_PAGO = [
  {
    campo: 'mostrar_pagos',
    titulo: 'Detalle de pagos',
    descripcion: 'Muestra efectivo, tarjeta, transferencia o puntos.',
  },
  {
    campo: 'mostrar_metodo_pago',
    titulo: 'Método de pago',
    descripcion: 'Muestra el método principal de pago.',
  },
  {
    campo: 'mostrar_cambio',
    titulo: 'Cambio',
    descripcion: 'Muestra el cambio entregado al cliente.',
  },
  {
    campo: 'mostrar_ahorro',
    titulo: 'Ahorro',
    descripcion: 'Muestra el ahorro generado por descuentos.',
  },
];

const clonar = (valor) => JSON.parse(JSON.stringify(valor));

const normalizarBooleano = (valor, valorDefault = true) => {
  if (valor === undefined || valor === null) return valorDefault;

  if (typeof valor === 'boolean') return valor;

  if (typeof valor === 'string') {
    const texto = valor.trim().toLowerCase();

    if (['true', '1', 'si', 'sí', 's'].includes(texto)) return true;
    if (['false', '0', 'no', 'n'].includes(texto)) return false;
  }

  return Boolean(valor);
};

const normalizarLineas = (valor, limite = 8) => {
  const lineas = Array.isArray(valor)
    ? valor
    : String(valor ?? '').replace(/\r\n/g, '\n').split('\n');

  /*
   * Se conservan los renglones vacíos para que el usuario pueda separar
   * visualmente el encabezado o el mensaje final.
   */
  return lineas
    .slice(0, limite)
    .map((linea) => String(linea ?? '').replace(/\r/g, '').slice(0, 100));
};

const normalizarConfiguracion = (configuracion = {}) => {
  const combinada = {
    ...CONFIGURACION_DEFAULT,
    ...(configuracion || {}),
  };

  return {
    ...combinada,

    nombre_negocio:
      String(combinada.nombre_negocio || '')
        .trim()
        .slice(0, 100) || CONFIGURACION_DEFAULT.nombre_negocio,

    encabezado: normalizarLineas(combinada.encabezado, 6),
    pie_ticket: normalizarLineas(combinada.pie_ticket, 8),

    rfc: String(combinada.rfc || '').trim().slice(0, 30),
    direccion: String(combinada.direccion || '').trim().slice(0, 200),
    telefono: String(combinada.telefono || '').trim().slice(0, 50),

    mostrar_nombre_negocio: normalizarBooleano(
      combinada.mostrar_nombre_negocio,
      true
    ),
    mostrar_sucursal: normalizarBooleano(combinada.mostrar_sucursal, true),
    mostrar_rfc: normalizarBooleano(combinada.mostrar_rfc, true),
    mostrar_direccion: normalizarBooleano(
      combinada.mostrar_direccion,
      true
    ),
    mostrar_telefono: normalizarBooleano(combinada.mostrar_telefono, true),
    mostrar_fecha: normalizarBooleano(combinada.mostrar_fecha, true),
    mostrar_cajero: normalizarBooleano(combinada.mostrar_cajero, true),
    mostrar_caja: normalizarBooleano(combinada.mostrar_caja, true),
    mostrar_folio: normalizarBooleano(combinada.mostrar_folio, true),

    mostrar_articulos: normalizarBooleano(
      combinada.mostrar_articulos,
      true
    ),
    mostrar_lote: normalizarBooleano(combinada.mostrar_lote, true),
    mostrar_caducidad: normalizarBooleano(
      combinada.mostrar_caducidad,
      true
    ),
    mostrar_numero_articulos: normalizarBooleano(
      combinada.mostrar_numero_articulos,
      true
    ),

    mostrar_subtotal: normalizarBooleano(combinada.mostrar_subtotal, true),
    mostrar_impuesto: normalizarBooleano(combinada.mostrar_impuesto, true),
    mostrar_descuento: normalizarBooleano(
      combinada.mostrar_descuento,
      true
    ),
    mostrar_total: normalizarBooleano(combinada.mostrar_total, true),

    mostrar_pagos: normalizarBooleano(
      combinada.mostrar_pagos ?? combinada.mostrar_detalle_pagos,
      true
    ),
    mostrar_metodo_pago: normalizarBooleano(
      combinada.mostrar_metodo_pago,
      true
    ),
    mostrar_cambio: normalizarBooleano(combinada.mostrar_cambio, true),
    mostrar_ahorro: normalizarBooleano(combinada.mostrar_ahorro, true),

    lineas_finales: Math.min(
      Math.max(Number(combinada.lineas_finales || 3), 0),
      10
    ),
  };
};

const normalizarPuertoSmtp = (valor, valorDefault = 587) => {
  const puerto = Number(valor ?? valorDefault);

  if (!Number.isInteger(puerto) || puerto < 1 || puerto > 65535) {
    return valorDefault;
  }

  return puerto;
};

const normalizarConfiguracionCorreo = (configuracion = {}) => {
  const combinada = {
    ...CONFIGURACION_CORREO_DEFAULT,
    ...(configuracion || {}),
  };

  return {
    ...combinada,

    activo: normalizarBooleano(
      combinada.activo,
      CONFIGURACION_CORREO_DEFAULT.activo
    ),

    enviar_ticket_automatico: normalizarBooleano(
      combinada.enviar_ticket_automatico,
      CONFIGURACION_CORREO_DEFAULT.enviar_ticket_automatico
    ),

    nombre_remitente:
      String(combinada.nombre_remitente || '')
        .trim()
        .slice(0, 150) || CONFIGURACION_CORREO_DEFAULT.nombre_remitente,

    correo_remitente: String(combinada.correo_remitente || '')
      .trim()
      .toLowerCase()
      .slice(0, 150),

    smtp_host: String(combinada.smtp_host || '')
      .trim()
      .slice(0, 255),

    smtp_port: normalizarPuertoSmtp(combinada.smtp_port, 587),

    smtp_secure: normalizarBooleano(
      combinada.smtp_secure,
      CONFIGURACION_CORREO_DEFAULT.smtp_secure
    ),

    smtp_require_tls: normalizarBooleano(
      combinada.smtp_require_tls,
      CONFIGURACION_CORREO_DEFAULT.smtp_require_tls
    ),

    smtp_usuario: String(combinada.smtp_usuario || '')
      .trim()
      .slice(0, 255),

    /* La contraseña nunca se carga desde la API. */
    smtp_password: String(combinada.smtp_password || ''),

    password_configurada: normalizarBooleano(
      combinada.password_configurada,
      false
    ),
  };
};


const normalizarListaSucursales = (respuesta = {}) => {
  const lista =
    Array.isArray(respuesta)
      ? respuesta
      : Array.isArray(respuesta?.sucursales)
        ? respuesta.sucursales
        : Array.isArray(respuesta?.data)
          ? respuesta.data
          : Array.isArray(respuesta?.resultado)
            ? respuesta.resultado
            : [];

  return lista
    .map((sucursal) => {
      const id = Number(
        sucursal?.id_sucursal ??
          sucursal?.idSucursal ??
          sucursal?.id ??
          sucursal?.value
      );

      if (!Number.isInteger(id) || id <= 0) return null;

      const nombre =
        sucursal?.nombre_sucursal ??
        sucursal?.nombreSucursal ??
        sucursal?.nombre ??
        sucursal?.sucursal ??
        sucursal?.razon_social ??
        `Sucursal ${id}`;

      return {
        id_sucursal: id,
        nombre: String(nombre).trim() || `Sucursal ${id}`,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es-MX'));
};

const limpiarTexto = (texto = '') =>
  String(texto || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const centrar = (texto = '', ancho = 30) => {
  const limpio = limpiarTexto(texto).slice(0, ancho);
  const espacios = Math.max(Math.floor((ancho - limpio.length) / 2), 0);

  return `${' '.repeat(espacios)}${limpio}`;
};

const fila = (izquierda = '', derecha = '', ancho = 30) => {
  const izq = limpiarTexto(izquierda);
  const der = limpiarTexto(derecha);
  const espacios = Math.max(ancho - izq.length - der.length, 1);

  return `${izq}${' '.repeat(espacios)}${der}`.slice(0, ancho);
};

const partirTexto = (texto = '', largo = 16) => {
  const limpio = limpiarTexto(texto);

  if (!limpio) return [''];

  const palabras = limpio.split(' ');
  const lineas = [];
  let actual = '';

  for (const palabra of palabras) {
    const palabraLimpia = palabra.slice(0, largo);

    if (`${actual} ${palabraLimpia}`.trim().length <= largo) {
      actual = `${actual} ${palabraLimpia}`.trim();
    } else {
      if (actual) lineas.push(actual);
      actual = palabraLimpia;
    }
  }

  if (actual) lineas.push(actual);

  return lineas.length ? lineas : [''];
};

const generarVistaPrevia = (configuracion) => {
  const ancho = 30;
  const lineas = [];

  const productos = [
    {
      cantidad: 1,
      nombre: 'PARACETAMOL 500 MG',
      importe: 25,
      lote: 'LT-001',
      caducidad: '12/2027',
    },
    {
      cantidad: 2,
      nombre: 'VITAMINA C',
      importe: 60,
      lote: 'LT-025',
      caducidad: '08/2027',
    },
    {
      cantidad: 1,
      nombre: 'SUERO ORAL',
      importe: 36,
      lote: 'LT-110',
      caducidad: '02/2028',
    },
  ];

  const agregarCentrado = (texto) => {
    partirTexto(texto, ancho).forEach((linea) => {
      lineas.push(centrar(linea, ancho));
    });
  };

  if (configuracion.mostrar_nombre_negocio) {
    agregarCentrado(configuracion.nombre_negocio);
  }



  configuracion.encabezado.forEach(agregarCentrado);

  if (configuracion.mostrar_rfc && configuracion.rfc) {
    agregarCentrado(`RFC: ${configuracion.rfc}`);
  }

  if (configuracion.mostrar_direccion) {
    agregarCentrado(
      configuracion.direccion || 'AV. PRINCIPAL 123, CENTRO'
    );
  }

  if (configuracion.mostrar_telefono) {
    agregarCentrado(
      `TEL. ${configuracion.telefono || '771 000 0000'}`
    );
  }

  if (lineas.length > 0) lineas.push('');

  if (configuracion.mostrar_fecha) {
    agregarCentrado('23/06/2026, 11:45 A.M.');
  }

  const datosVenta = [];

  if (configuracion.mostrar_cajero) {
    datosVenta.push('CAJERO: ADMINISTRADOR');
  }

  if (configuracion.mostrar_caja) {
    datosVenta.push('CAJA: CAJA PRINCIPAL');
  }

  if (configuracion.mostrar_folio) {
    datosVenta.push('FOLIO: TEST-LOCAL-001');
  }

  if (configuracion.mostrar_fecha || datosVenta.length > 0) {
    lineas.push('');
  }

  lineas.push(...datosVenta);

  if (datosVenta.length > 0) lineas.push('');

  if (configuracion.mostrar_articulos) {
    lineas.push('CANT DESCRIPCION       IMPORTE');
    lineas.push('='.repeat(ancho));

    productos.forEach((producto) => {
      const nombreLineas = partirTexto(producto.nombre, 16);

      lineas.push(
        `${String(producto.cantidad).padEnd(3, ' ')} ${nombreLineas[0]
          .padEnd(16, ' ')
          .slice(0, 16)} ${producto.importe.toFixed(2).padStart(8, ' ')}`
      );

      nombreLineas.slice(1).forEach((lineaExtra) => {
        lineas.push(`    ${lineaExtra}`);
      });

      if (configuracion.mostrar_lote) {
        lineas.push(`    Lote: ${producto.lote}`);
      }

      if (configuracion.mostrar_caducidad) {
        lineas.push(`    Cad: ${producto.caducidad}`);
      }
    });
  }

  const totales = [];

  if (configuracion.mostrar_numero_articulos) {
    totales.push(fila('NO. DE ARTICULOS:', '4', ancho));
  }

  if (configuracion.mostrar_subtotal) {
    totales.push(fila('SUBTOTAL:', '121.00', ancho));
  }

  if (configuracion.mostrar_impuesto) {
    totales.push(fila('IMPUESTO:', '0.00', ancho));
  }

  if (configuracion.mostrar_descuento) {
    totales.push(fila('DESCUENTO:', '5.00', ancho));
  }

  if (configuracion.mostrar_total) {
    totales.push(fila('TOTAL:', '116.00', ancho));
  }

  if (totales.length > 0) {
    lineas.push('');
    lineas.push(...totales);
    lineas.push('');
  }

  if (configuracion.mostrar_pagos) {
    lineas.push(fila('EFECTIVO', '120.00', ancho));
  }

  if (configuracion.mostrar_metodo_pago) {
    lineas.push(fila('METODO:', 'EFECTIVO', ancho));
  }

  if (configuracion.mostrar_cambio) {
    lineas.push(fila('SU CAMBIO:', '4.00', ancho));
  }

  if (configuracion.mostrar_ahorro) {
    lineas.push(fila('USTED AHORRO:', '5.00', ancho));
  }

  if (configuracion.pie_ticket.length > 0) {
    lineas.push('');

    configuracion.pie_ticket.forEach(agregarCentrado);
  }

  for (let i = 0; i < configuracion.lineas_finales; i += 1) {
    lineas.push('');
  }

  return lineas.join('\n');
};

function Interruptor({ activo, onChange, titulo, descripcion, disabled = false }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-xl border p-4 transition ${
        disabled
          ? 'border-slate-100 bg-slate-50 opacity-60'
          : 'border-slate-200 bg-white hover:border-sky-300'
      }`}
    >
      <div>
        <p className="text-sm font-semibold text-slate-800">{titulo}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{descripcion}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={activo}
        disabled={disabled}
        onClick={onChange}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          activo ? 'bg-sky-600' : 'bg-slate-300'
        } ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
            activo ? 'left-6' : 'left-1'
          }`}
        />
      </button>
    </div>
  );
}

function SeccionOpciones({
  titulo,
  descripcion,
  icono,
  opciones,
  formulario,
  alternarCampo,
  deshabilitarDependientes = false,
}) {
  const Icono = icono;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="rounded-xl bg-sky-50 p-2 text-sky-700">
          <Icono size={20} />
        </div>

        <div>
          <h2 className="font-bold text-slate-800">{titulo}</h2>
          <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {opciones.map((opcion) => {
          const deshabilitado =
            deshabilitarDependientes &&
            ['mostrar_lote', 'mostrar_caducidad'].includes(opcion.campo) &&
            !formulario.mostrar_articulos;

          return (
            <Interruptor
              key={opcion.campo}
              activo={Boolean(formulario[opcion.campo])}
              titulo={opcion.titulo}
              descripcion={opcion.descripcion}
              disabled={deshabilitado}
              onChange={() => alternarCampo(opcion.campo)}
            />
          );
        })}
      </div>
    </section>
  );
}

export default function ConfiguracionTicket() {
  const [registro, setRegistro] = useState(null);
  const [formulario, setFormulario] = useState(CONFIGURACION_DEFAULT);
  const [configuracionGuardada, setConfiguracionGuardada] = useState(
    CONFIGURACION_DEFAULT
  );

  const [registroCorreo, setRegistroCorreo] = useState(null);
  const [formularioCorreo, setFormularioCorreo] = useState(
    CONFIGURACION_CORREO_DEFAULT
  );
  const [configuracionCorreoGuardada, setConfiguracionCorreoGuardada] =
    useState(CONFIGURACION_CORREO_DEFAULT);
  const [correoPrueba, setCorreoPrueba] = useState('');

  // Vacío = configuración global. Un ID = configuración exclusiva de sucursal.
  const [idSucursalSeleccionada, setIdSucursalSeleccionada] = useState('');
  const [sucursales, setSucursales] = useState([]);
  const [cargandoSucursales, setCargandoSucursales] = useState(true);

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [cargandoCorreo, setCargandoCorreo] = useState(true);
  const [guardandoCorreo, setGuardandoCorreo] = useState(false);
  const [probandoCorreo, setProbandoCorreo] = useState(false);

  const esConfiguracionSucursal = Boolean(idSucursalSeleccionada);

  const sucursalSeleccionada = useMemo(() => {
    if (!esConfiguracionSucursal) return null;

    return (
      sucursales.find(
        (sucursal) =>
          String(sucursal.id_sucursal) === String(idSucursalSeleccionada)
      ) || null
    );
  }, [esConfiguracionSucursal, idSucursalSeleccionada, sucursales]);

  const hayCambiosTicket = useMemo(() => {
    return (
      JSON.stringify(formulario) !== JSON.stringify(configuracionGuardada)
    );
  }, [formulario, configuracionGuardada]);

  const hayCambiosCorreo = useMemo(() => {
    return (
      JSON.stringify(formularioCorreo) !==
      JSON.stringify(configuracionCorreoGuardada)
    );
  }, [formularioCorreo, configuracionCorreoGuardada]);

  const hayCambios = hayCambiosTicket || hayCambiosCorreo;

  const ticketVistaPrevia = useMemo(() => {
    return generarVistaPrevia(formulario);
  }, [formulario]);

  const cargarSucursales = useCallback(async () => {
    try {
      setCargandoSucursales(true);

      const { data } = await api.get('/sucursales');

      if (data?.ok === false) {
        throw new Error(data?.mensaje || 'No se pudieron cargar las sucursales.');
      }

      setSucursales(normalizarListaSucursales(data));
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
      setSucursales([]);

      Swal.fire({
        icon: 'warning',
        title: 'Sucursales no disponibles',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'Solo podrás editar la configuración global hasta recargar la pantalla.',
      });
    } finally {
      setCargandoSucursales(false);
    }
  }, []);

  const cargarConfiguracion = useCallback(async () => {
    try {
      setCargando(true);

      const params = esConfiguracionSucursal
        ? { id_sucursal: Number(idSucursalSeleccionada) }
        : {};

      const { data } = await api.get('/configuracion-ticket', { params });

      if (!data.ok) {
        throw new Error(
          data.mensaje || 'No se pudo cargar la configuración de ticket.'
        );
      }

      const configuracionNueva = normalizarConfiguracion(
        data.configuracion?.configuracion || {}
      );

      setRegistro(data.configuracion || null);
      setFormulario(configuracionNueva);
      setConfiguracionGuardada(clonar(configuracionNueva));
    } catch (error) {
      console.error('Error al cargar configuración de ticket:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo cargar la configuración de ticket.',
      });
    } finally {
      setCargando(false);
    }
  }, [esConfiguracionSucursal, idSucursalSeleccionada]);

  const cargarConfiguracionCorreo = useCallback(async () => {
    try {
      setCargandoCorreo(true);

      const params = esConfiguracionSucursal
        ? { id_sucursal: Number(idSucursalSeleccionada) }
        : {};

      const { data } = await api.get('/configuracion-correo-smtp', {
        params,
      });

      if (!data?.ok) {
        throw new Error(
          data?.mensaje || 'No se pudo cargar la configuración de correo.'
        );
      }

      const configuracionNueva = normalizarConfiguracionCorreo(
        data.configuracion || {}
      );

      configuracionNueva.smtp_password = '';

      setRegistroCorreo(data.configuracion || null);
      setFormularioCorreo(configuracionNueva);
      setConfiguracionCorreoGuardada(clonar(configuracionNueva));
    } catch (error) {
      console.error('Error al cargar configuración SMTP:', error);

      Swal.fire({
        icon: 'error',
        title: 'Correo no disponible',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo cargar la configuración de ticket digital por correo.',
      });
    } finally {
      setCargandoCorreo(false);
    }
  }, [esConfiguracionSucursal, idSucursalSeleccionada]);

  useEffect(() => {
    cargarSucursales();
  }, [cargarSucursales]);

  useEffect(() => {
    cargarConfiguracion();
  }, [cargarConfiguracion]);

  useEffect(() => {
    cargarConfiguracionCorreo();
  }, [cargarConfiguracionCorreo]);

  const actualizarCampo = (campo, valor) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const alternarCampo = (campo) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: !anterior[campo],
    }));
  };

  const actualizarCampoCorreo = (campo, valor) => {
    setFormularioCorreo((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const alternarCampoCorreo = (campo) => {
    setFormularioCorreo((anterior) => {
      const nuevoValor = !anterior[campo];

      /* No permitimos envío automático si el servicio SMTP queda apagado. */
      if (campo === 'activo' && !nuevoValor) {
        return {
          ...anterior,
          activo: false,
          enviar_ticket_automatico: false,
        };
      }

      return {
        ...anterior,
        [campo]: nuevoValor,
      };
    });
  };

  const restaurarCambios = async () => {
    if (!hayCambios) return;

    const confirmacion = await Swal.fire({
      icon: 'warning',
      title: '¿Descartar cambios?',
      text: 'Se restaurará la última configuración guardada.',
      showCancelButton: true,
      confirmButtonText: 'Sí, restaurar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#0369a1',
      cancelButtonColor: '#64748b',
    });

    if (!confirmacion.isConfirmed) return;

    setFormulario(clonar(configuracionGuardada));
    setFormularioCorreo(clonar(configuracionCorreoGuardada));
  };

  const cambiarSucursal = async (event) => {
    const siguienteIdSucursal = event.target.value;

    if (siguienteIdSucursal === idSucursalSeleccionada) return;

    if (hayCambios) {
      const confirmacion = await Swal.fire({
        icon: 'warning',
        title: '¿Cambiar de configuración?',
        text: 'Los cambios sin guardar se perderán.',
        showCancelButton: true,
        confirmButtonText: 'Sí, cambiar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0369a1',
        cancelButtonColor: '#64748b',
      });

      if (!confirmacion.isConfirmed) return;
    }

    setIdSucursalSeleccionada(siguienteIdSucursal);
  };

  const guardarConfiguracion = async () => {
    const configuracionFinal = normalizarConfiguracion(formulario);

    if (!configuracionFinal.nombre_negocio.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Nombre requerido',
        text: 'Captura el nombre del negocio para el ticket.',
      });
      return;
    }

    try {
      setGuardando(true);

      const body = {
        nombre_configuracion: esConfiguracionSucursal
          ? `Ticket - ${sucursalSeleccionada?.nombre || 'Sucursal'}`
          : 'Configuración global de ticket',
        activo: true,
        configuracion: configuracionFinal,
      };

      if (esConfiguracionSucursal) {
        body.id_sucursal = Number(idSucursalSeleccionada);
      }

      const { data } = await api.put('/configuracion-ticket', body);

      if (!data.ok) {
        throw new Error(
          data.mensaje || 'No se pudo guardar la configuración.'
        );
      }

      const configuracionGuardadaNueva = normalizarConfiguracion(
        data.configuracion?.configuracion || configuracionFinal
      );

      setRegistro(data.configuracion || registro);
      setFormulario(configuracionGuardadaNueva);
      setConfiguracionGuardada(clonar(configuracionGuardadaNueva));

      Swal.fire({
        icon: 'success',
        title: 'Configuración guardada',
        text: esConfiguracionSucursal
          ? 'La configuración exclusiva de la sucursal fue guardada correctamente.'
          : 'La configuración global de tickets fue actualizada correctamente.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al guardar configuración de ticket:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo guardar la configuración del ticket.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const guardarConfiguracionCorreo = async () => {
    const configuracionFinal = normalizarConfiguracionCorreo(formularioCorreo);

    try {
      setGuardandoCorreo(true);

      const {
        smtp_password,
        password_configurada,
        origen_configuracion,
        id_configuracion_correo,
        id_sucursal: idSucursalRegistro,
        fecha_creacion,
        fecha_actualizacion,
        ...datosCorreo
      } = configuracionFinal;

      const body = {
        ...datosCorreo,
      };

      /*
       * Si se deja vacío, el backend conserva la contraseña cifrada existente.
       * La contraseña nunca se recibe de vuelta desde la API.
       */
      if (smtp_password.trim()) {
        body.smtp_password = smtp_password;
      }

      if (esConfiguracionSucursal) {
        body.id_sucursal = Number(idSucursalSeleccionada);
      }

      const { data } = await api.put('/configuracion-correo-smtp', body);

      if (!data?.ok) {
        throw new Error(
          data?.mensaje || 'No se pudo guardar la configuración de correo.'
        );
      }

      const configuracionGuardadaNueva = normalizarConfiguracionCorreo(
        data.configuracion || {}
      );

      configuracionGuardadaNueva.smtp_password = '';

      setRegistroCorreo(data.configuracion || registroCorreo);
      setFormularioCorreo(configuracionGuardadaNueva);
      setConfiguracionCorreoGuardada(clonar(configuracionGuardadaNueva));

      Swal.fire({
        icon: 'success',
        title: 'Correo configurado',
        text: esConfiguracionSucursal
          ? 'La configuración de correo de esta sucursal fue guardada correctamente.'
          : 'La configuración global de correo fue guardada correctamente.',
        timer: 1800,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al guardar configuración SMTP:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error de configuración',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo guardar la configuración de correo.',
      });
    } finally {
      setGuardandoCorreo(false);
    }
  };

  const enviarCorreoPrueba = async () => {
    const destino = String(correoPrueba || '').trim().toLowerCase();

    if (!destino) {
      Swal.fire({
        icon: 'warning',
        title: 'Correo requerido',
        text: 'Escribe el correo al que deseas enviar la prueba.',
      });
      return;
    }

    if (hayCambiosCorreo) {
      Swal.fire({
        icon: 'warning',
        title: 'Guarda primero la configuración',
        text: 'El correo de prueba utiliza la configuración guardada en el servidor.',
      });
      return;
    }

    try {
      setProbandoCorreo(true);

      const body = {
        correo_destino: destino,
      };

      if (esConfiguracionSucursal) {
        body.id_sucursal = Number(idSucursalSeleccionada);
      }

      const { data } = await api.post(
        '/configuracion-correo-smtp/probar',
        body
      );

      if (!data?.ok) {
        throw new Error(
          data?.mensaje || 'No se pudo enviar el correo de prueba.'
        );
      }

      Swal.fire({
        icon: 'success',
        title: 'Correo enviado',
        text: `La prueba fue enviada a ${destino}.`,
        timer: 2200,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Error al enviar correo SMTP de prueba:', error);

      Swal.fire({
        icon: 'error',
        title: 'No se pudo enviar la prueba',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'Verifica la configuración SMTP e inténtalo de nuevo.',
      });
    } finally {
      setProbandoCorreo(false);
    }
  };

  if (cargando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 text-slate-600 shadow-sm">
          <Loader2 className="animate-spin text-sky-600" size={22} />
          Cargando configuración de ticket...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <section className="rounded-2xl bg-gradient-to-r from-sky-700 to-blue-700 p-6 text-white shadow-lg">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-white/15 p-3">
              <ReceiptText size={30} />
            </div>

            <div>
              <p className="text-sm font-medium text-sky-100">
                {esConfiguracionSucursal
                  ? `Configuración de ${sucursalSeleccionada?.nombre || 'sucursal'}`
                  : 'Configuración global'}
              </p>

              <h1 className="mt-1 text-2xl font-bold">
                Ticket de venta
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-sky-100">
                Personaliza la información, secciones y mensajes que aparecerán
                en los tickets de venta.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                cargarConfiguracion();
                cargarConfiguracionCorreo();
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/20"
            >
              <RefreshCw size={17} />
              Recargar
            </button>

            <button
              type="button"
              onClick={restaurarCambios}
              disabled={!hayCambios || guardando || guardandoCorreo}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={17} />
              Restablecer cambios
            </button>

            <button
              type="button"
              onClick={guardarConfiguracion}
              disabled={!hayCambiosTicket || guardando}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {guardando ? (
                <Loader2 className="animate-spin" size={17} />
              ) : (
                <Save size={17} />
              )}
              Guardar ticket
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-sky-50 p-2 text-sky-700">
                    <Store size={20} />
                  </div>

                  <div>
                    <h2 className="font-bold text-slate-800">
                      Configuración a editar
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Selecciona la configuración global o una sucursal específica.
                    </p>
                  </div>
                </div>
              </div>

              <label className="block w-full lg:w-[360px]">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Aplicar configuración a
                </span>

                <div className="relative">
                  <select
                    value={idSucursalSeleccionada}
                    onChange={cambiarSucursal}
                    disabled={cargandoSucursales || guardando}
                    className="w-full appearance-none rounded-xl border border-slate-300 bg-white px-3 py-2.5 pr-10 text-sm font-medium text-slate-800 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    <option value="">Global — Todas las sucursales</option>

                    {sucursales.map((sucursal) => (
                      <option
                        key={sucursal.id_sucursal}
                        value={String(sucursal.id_sucursal)}
                      >
                        {sucursal.nombre}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={18}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                  />
                </div>

                {cargandoSucursales && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Cargando sucursales...
                  </p>
                )}
              </label>
            </div>

            {esConfiguracionSucursal && registro?.origen_configuracion === 'GLOBAL' && (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Esta sucursal está usando actualmente la configuración global.
                Al guardar se creará una configuración independiente para{' '}
                <strong>{sucursalSeleccionada?.nombre || 'esta sucursal'}</strong>.
              </div>
            )}

            {esConfiguracionSucursal && registro?.origen_configuracion === 'SUCURSAL' && (
              <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                Estás editando una configuración exclusiva para{' '}
                <strong>{sucursalSeleccionada?.nombre || 'esta sucursal'}</strong>.
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-xl bg-sky-50 p-2 text-sky-700">
                <Building2 size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Información del negocio
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Estos datos se utilizarán como valores principales del
                  encabezado del ticket.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Nombre del negocio
                </span>

                <input
                  type="text"
                  maxLength={100}
                  value={formulario.nombre_negocio}
                  onChange={(event) =>
                    actualizarCampo('nombre_negocio', event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="Ej. FARMACIAS SHADDAI"
                />
              </label>

              <label>
                <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Hash size={15} />
                  RFC
                </span>

                <input
                  type="text"
                  maxLength={30}
                  value={formulario.rfc}
                  onChange={(event) =>
                    actualizarCampo('rfc', event.target.value.toUpperCase())
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm uppercase outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="XAXX010101000"
                />
              </label>

              <label>
                <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <Phone size={15} />
                  Teléfono
                </span>

                <input
                  type="text"
                  maxLength={50}
                  value={formulario.telefono}
                  onChange={(event) =>
                    actualizarCampo('telefono', event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="771 000 0000"
                />
              </label>

              <label className="md:col-span-2">
                <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MapPin size={15} />
                  Dirección
                </span>

                <input
                  type="text"
                  maxLength={200}
                  value={formulario.direccion}
                  onChange={(event) =>
                    actualizarCampo('direccion', event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder="Ej. Av. Principal 123, Centro, Hidalgo"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-start gap-3">
              <div className="rounded-xl bg-violet-50 p-2 text-violet-700">
                <FileText size={20} />
              </div>

              <div>
                <h2 className="font-bold text-slate-800">
                  Encabezado y mensaje final
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Escribe una línea por renglón. El ticket ajustará el texto al
                  ancho de la impresora.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Líneas adicionales de encabezado
                </span>

                <textarea
                  rows={5}
                  value={formulario.encabezado.join('\n')}
                  onChange={(event) =>
                    actualizarCampo(
                      'encabezado',
                      normalizarLineas(event.target.value, 6)
                    )
                  }
                  className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder={'SUCURSAL CENTRO\nVENTA AL PUBLICO EN GENERAL'}
                />
              </label>

              <label>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Mensaje final
                </span>

                <textarea
                  rows={5}
                  value={formulario.pie_ticket.join('\n')}
                  onChange={(event) =>
                    actualizarCampo(
                      'pie_ticket',
                      normalizarLineas(event.target.value, 8)
                    )
                  }
                  className="w-full resize-y rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                  placeholder={'*** GRACIAS POR SU COMPRA ***\nCONSERVE SU TICKET'}
                />
              </label>

              <label className="md:col-span-2">
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Líneas vacías al final del ticket
                </span>

                <input
                  type="number"
                  min="0"
                  max="10"
                  value={formulario.lineas_finales}
                  onChange={(event) =>
                    actualizarCampo(
                      'lineas_finales',
                      Math.min(
                        Math.max(Number(event.target.value || 0), 0),
                        10
                      )
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100"
                />

                <p className="mt-1.5 text-xs text-slate-500">
                  Sirven para facilitar el corte físico del ticket.
                </p>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                  <Mail size={20} />
                </div>

                <div>
                  <h2 className="font-bold text-slate-800">
                    Ticket digital por correo
                  </h2>
                  <p className="mt-1 max-w-2xl text-sm text-slate-500">
                    Configura el correo que enviará los tickets digitales. La
                    contraseña SMTP se guarda cifrada y nunca vuelve a mostrarse.
                  </p>
                </div>
              </div>

              {cargandoCorreo ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  <Loader2 className="animate-spin" size={14} />
                  Cargando correo...
                </span>
              ) : formularioCorreo.password_configurada ? (
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  <ShieldCheck size={15} />
                  Contraseña SMTP configurada
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-800">
                  <KeyRound size={15} />
                  Falta contraseña SMTP
                </span>
              )}
            </div>

            {esConfiguracionSucursal &&
              registroCorreo?.origen_configuracion === 'GLOBAL' && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Esta sucursal está usando la configuración global de correo.
                  Al guardar se creará una configuración independiente para{' '}
                  <strong>{sucursalSeleccionada?.nombre || 'esta sucursal'}</strong>.
                </div>
              )}

            {esConfiguracionSucursal &&
              registroCorreo?.origen_configuracion === 'SUCURSAL' && (
                <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                  Estás editando una configuración de correo exclusiva para{' '}
                  <strong>{sucursalSeleccionada?.nombre || 'esta sucursal'}</strong>.
                </div>
              )}

            <div className="grid gap-3 md:grid-cols-2">
              <Interruptor
                activo={Boolean(formularioCorreo.activo)}
                titulo="Servicio de correo activo"
                descripcion="Permite usar esta configuración SMTP para enviar tickets digitales."
                onChange={() => alternarCampoCorreo('activo')}
                disabled={cargandoCorreo || guardandoCorreo}
              />

              <Interruptor
                activo={Boolean(formularioCorreo.enviar_ticket_automatico)}
                titulo="Enviar ticket automáticamente"
                descripcion="Después se usará al finalizar una venta con tarjeta de fidelidad y correo registrado."
                onChange={() =>
                  alternarCampoCorreo('enviar_ticket_automatico')
                }
                disabled={
                  cargandoCorreo ||
                  guardandoCorreo ||
                  !formularioCorreo.activo
                }
              />
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Nombre del remitente
                </span>

                <input
                  type="text"
                  maxLength={150}
                  value={formularioCorreo.nombre_remitente}
                  disabled={cargandoCorreo || guardandoCorreo}
                  onChange={(event) =>
                    actualizarCampoCorreo(
                      'nombre_remitente',
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="Farmacias Shaddai"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Correo remitente
                </span>

                <input
                  type="email"
                  maxLength={150}
                  value={formularioCorreo.correo_remitente}
                  disabled={cargandoCorreo || guardandoCorreo}
                  onChange={(event) =>
                    actualizarCampoCorreo(
                      'correo_remitente',
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="tickets@tudominio.com"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Servidor SMTP
                </span>

                <input
                  type="text"
                  maxLength={255}
                  value={formularioCorreo.smtp_host}
                  disabled={cargandoCorreo || guardandoCorreo}
                  onChange={(event) =>
                    actualizarCampoCorreo('smtp_host', event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="mail.korreoweb.com"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Puerto SMTP
                </span>

                <input
                  type="number"
                  min="1"
                  max="65535"
                  value={formularioCorreo.smtp_port}
                  disabled={cargandoCorreo || guardandoCorreo}
                  onChange={(event) =>
                    actualizarCampoCorreo(
                      'smtp_port',
                      normalizarPuertoSmtp(event.target.value, 587)
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </label>

              <label>
                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Usuario SMTP
                </span>

                <input
                  type="text"
                  maxLength={255}
                  value={formularioCorreo.smtp_usuario}
                  disabled={cargandoCorreo || guardandoCorreo}
                  onChange={(event) =>
                    actualizarCampoCorreo('smtp_usuario', event.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder="correo@tudominio.com"
                />
              </label>

              <label>
                <span className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <KeyRound size={15} />
                  Contraseña SMTP
                </span>

                <input
                  type="password"
                  autoComplete="new-password"
                  value={formularioCorreo.smtp_password}
                  disabled={cargandoCorreo || guardandoCorreo}
                  onChange={(event) =>
                    actualizarCampoCorreo(
                      'smtp_password',
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                  placeholder={
                    formularioCorreo.password_configurada
                      ? 'Déjala vacía para conservar la actual'
                      : 'Contraseña del buzón SMTP'
                  }
                />

                <p className="mt-1.5 text-xs text-slate-500">
                  {formularioCorreo.password_configurada
                    ? 'Hay una contraseña cifrada guardada. Solo escribe aquí si deseas reemplazarla.'
                    : 'La contraseña se cifrará antes de guardarse en la base de datos.'}
                </p>
              </label>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <Interruptor
                activo={Boolean(formularioCorreo.smtp_secure)}
                titulo="Conexión SSL directa"
                descripcion="Actívala únicamente cuando el proveedor indique SSL directo, normalmente puerto 465."
                onChange={() => alternarCampoCorreo('smtp_secure')}
                disabled={cargandoCorreo || guardandoCorreo}
              />

              <Interruptor
                activo={Boolean(formularioCorreo.smtp_require_tls)}
                titulo="Requerir TLS"
                descripcion="Para puerto 587 normalmente debe permanecer activado (STARTTLS)."
                onChange={() => alternarCampoCorreo('smtp_require_tls')}
                disabled={cargandoCorreo || guardandoCorreo}
              />
            </div>

            <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                <label className="block w-full lg:max-w-lg">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Correo para prueba SMTP
                  </span>

                  <input
                    type="email"
                    value={correoPrueba}
                    disabled={cargandoCorreo || guardandoCorreo || probandoCorreo}
                    onChange={(event) => setCorreoPrueba(event.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    placeholder="tu_correo@gmail.com"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={guardarConfiguracionCorreo}
                    disabled={!hayCambiosCorreo || guardandoCorreo || cargandoCorreo}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {guardandoCorreo ? (
                      <Loader2 className="animate-spin" size={17} />
                    ) : (
                      <Save size={17} />
                    )}
                    Guardar correo
                  </button>

                  <button
                    type="button"
                    onClick={enviarCorreoPrueba}
                    disabled={
                      !correoPrueba.trim() ||
                      hayCambiosCorreo ||
                      cargandoCorreo ||
                      guardandoCorreo ||
                      probandoCorreo
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {probandoCorreo ? (
                      <Loader2 className="animate-spin" size={17} />
                    ) : (
                      <Send size={17} />
                    )}
                    Enviar prueba
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs leading-5 text-slate-500">
                Guarda primero la configuración. La prueba utiliza los datos SMTP
                almacenados para la configuración global o la sucursal seleccionada.
              </p>
            </div>
          </section>

          <SeccionOpciones
            titulo="Encabezado"
            descripcion="Controla la información inicial impresa antes del detalle de la venta."
            icono={Store}
            opciones={OPCIONES_ENCABEZADO}
            formulario={formulario}
            alternarCampo={alternarCampo}
          />

          <SeccionOpciones
            titulo="Datos de venta"
            descripcion="Selecciona los datos operativos que aparecerán en cada venta."
            icono={UserRound}
            opciones={OPCIONES_VENTA}
            formulario={formulario}
            alternarCampo={alternarCampo}
          />

          <SeccionOpciones
            titulo="Artículos"
            descripcion="Configura la información de productos y control de lotes."
            icono={Package}
            opciones={OPCIONES_ARTICULOS}
            formulario={formulario}
            alternarCampo={alternarCampo}
            deshabilitarDependientes
          />

          <SeccionOpciones
            titulo="Totales"
            descripcion="Define qué importes se mostrarán al finalizar el detalle de artículos."
            icono={Settings}
            opciones={OPCIONES_TOTALES}
            formulario={formulario}
            alternarCampo={alternarCampo}
          />

          <SeccionOpciones
            titulo="Pagos"
            descripcion="Controla la sección donde se muestran pagos, método y cambio."
            icono={WalletCards}
            opciones={OPCIONES_PAGO}
            formulario={formulario}
            alternarCampo={alternarCampo}
          />
        </div>

        <aside className="xl:sticky xl:top-5 xl:h-fit">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-5 py-4">
              <div className="flex items-center gap-2">
                <Eye size={19} className="text-sky-700" />
                <div>
                  <h2 className="font-bold text-slate-800">Vista previa</h2>
                  <p className="text-xs text-slate-500">
                    Simulación local, no imprime.
                  </p>
                </div>
              </div>

              <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-bold text-sky-700">
                58 mm
              </span>
            </div>

            <div className="bg-slate-200 p-5">
              <pre className="max-h-[690px] overflow-auto bg-white p-4 font-mono text-[11px] leading-[1.45] text-slate-900 shadow-lg">
                {ticketVistaPrevia}
              </pre>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <CalendarDays
                size={19}
                className="mt-0.5 shrink-0 text-amber-700"
              />

              <div>
                <p className="text-sm font-bold text-amber-900">
                  Configuración activa
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-800">
                  {esConfiguracionSucursal
                    ? registro?.origen_configuracion === 'SUCURSAL'
                      ? `Configuración exclusiva activa para ${sucursalSeleccionada?.nombre || 'la sucursal seleccionada'}.`
                      : 'Esta sucursal está heredando la configuración global hasta que guardes cambios.'
                    : 'Estás editando la configuración global para todas las sucursales.'}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-start gap-3">
              <Mail
                size={19}
                className="mt-0.5 shrink-0 text-emerald-700"
              />

              <div>
                <p className="text-sm font-bold text-emerald-900">
                  Ticket digital
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-800">
                  {cargandoCorreo
                    ? 'Cargando configuración de correo...'
                    : formularioCorreo.activo
                      ? formularioCorreo.enviar_ticket_automatico
                        ? 'El envío automático está habilitado en esta configuración.'
                        : 'El servicio SMTP está configurado, pero el envío automático permanece desactivado.'
                      : 'El servicio de correo está desactivado para esta configuración.'}
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}