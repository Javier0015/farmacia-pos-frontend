import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Bot,
  ChevronRight,
  MessageCircle,
  PackageSearch,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Store,
  Tags,
  X,
} from 'lucide-react';
import api from '../../api/axios';

const TIPO_MENSAJE = {
  TEXTO: 'TEXTO',
  OPCIONES: 'OPCIONES',
  PRODUCTOS: 'PRODUCTOS',
  CATEGORIAS: 'CATEGORIAS',
};

const MODO_ENTRADA = {
  LIBRE: 'LIBRE',
  BUSCAR_PRODUCTO: 'BUSCAR_PRODUCTO',
};

const OPCIONES_MENU = [
  {
    id: 'buscar',
    etiqueta: 'Buscar un producto',
    descripcion: 'Escribe el nombre y consulta su disponibilidad.',
    icono: 'buscar',
  },
  {
    id: 'promociones',
    etiqueta: 'Ver promociones',
    descripcion: 'Revisa los productos que actualmente tienen oferta.',
    icono: 'promociones',
  },
  {
    id: 'categorias',
    etiqueta: 'Explorar categorías',
    descripcion: 'Navega por medicamentos, higiene y otras categorías.',
    icono: 'categorias',
  },
  {
    id: 'whatsapp',
    etiqueta: 'Hablar con una sucursal',
    descripcion: 'Continúa la conversación directamente por WhatsApp.',
    icono: 'whatsapp',
  },
];

const OPCIONES_DESPUES_RESULTADOS = [
  {
    id: 'buscar',
    etiqueta: 'Buscar otro producto',
    icono: 'buscar',
    compacta: true,
  },
  {
    id: 'menu',
    etiqueta: 'Volver al menú',
    icono: 'menu',
    compacta: true,
  },
];

const ICONOS_OPCION = {
  buscar: Search,
  promociones: Sparkles,
  categorias: Tags,
  whatsapp: MessageCircle,
  menu: RotateCcw,
};

const esperar = (milisegundos) =>
  new Promise((resolve) => window.setTimeout(resolve, milisegundos));

/**
 * Simula un tiempo de respuesta más natural.
 * Los mensajes cortos tardan aproximadamente 1.6 segundos
 * y los mensajes largos llegan hasta un máximo de 3 segundos.
 */
const calcularDemoraEscritura = (texto, demoraMinima = 1600) => {
  const longitud = String(texto || '').trim().length;
  const demoraPorLongitud = 1300 + longitud * 18;

  return Math.min(
    3000,
    Math.max(demoraMinima, demoraPorLongitud)
  );
};

const obtenerNombreProducto = (producto) =>
  producto?.titulo_catalogo ||
  producto?.nombre_producto ||
  producto?.nombre ||
  'Producto sin nombre';

const obtenerPrecioProducto = (producto) =>
  Number(producto?.precio_final ?? producto?.precio_venta ?? 0);

const obtenerDescripcionProducto = (producto) =>
  producto?.nombre_categoria ||
  producto?.presentacion ||
  producto?.laboratorio ||
  producto?.codigo_barras ||
  'Producto del catálogo';

const limpiarConsultaProducto = (valor) => {
  const original = String(valor || '').trim();

  const limpio = original
    .replace(/[¿?¡!,.;:]/g, ' ')
    .replace(
      /\b(hola|buenas|busco|buscar|quiero|quisiera|necesito|tienen|tiene|hay|producto|productos|medicamento|medicamentos|por favor|favor|muéstrame|muestrame|mostrar|consultar|disponibilidad)\b/gi,
      ' '
    )
    .replace(/\s+/g, ' ')
    .trim();

  return limpio.length >= 2 ? limpio : original;
};


const normalizarMensaje = (valor) =>
  String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[¿?¡!,.;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const EXPRESIONES_SALUDO = [
  'hola',
  'holi',
  'holis',
  'buen dia',
  'buenos dias',
  'buenas',
  'buenas tardes',
  'buenas noches',
  'que tal',
  'que onda',
  'saludos',
];

const EXPRESIONES_AYUDA = [
  'ayuda',
  'necesito ayuda',
  'quiero ayuda',
  'me ayudas',
  'puedes ayudarme',
  'en que me puedes ayudar',
  'que puedes hacer',
  'como funciona',
  'como puedes ayudarme',
  'no se que buscar',
];

const EXPRESIONES_AGRADECIMIENTO = [
  'gracias',
  'muchas gracias',
  'te agradezco',
  'perfecto gracias',
  'excelente gracias',
  'muy amable',
];

const EXPRESIONES_DESPEDIDA = [
  'adios',
  'hasta luego',
  'nos vemos',
  'hasta pronto',
  'bye',
  'eso es todo',
  'seria todo',
];

const coincideExpresion = (mensaje, expresiones) =>
  expresiones.some(
    (expresion) =>
      mensaje === expresion ||
      mensaje.startsWith(`${expresion} `) ||
      mensaje.endsWith(` ${expresion}`)
  );

const quitarSaludoInicial = (mensaje) => {
  let resultado = mensaje;

  const saludosOrdenados = [...EXPRESIONES_SALUDO].sort(
    (a, b) => b.length - a.length
  );

  for (const saludo of saludosOrdenados) {
    if (resultado === saludo) return '';

    if (resultado.startsWith(`${saludo} `)) {
      resultado = resultado.slice(saludo.length).trim();
      break;
    }
  }

  return resultado
    .replace(/^(como estas|como esta|como andas)\b/, '')
    .trim();
};

const obtenerSaludoSegunHora = () => {
  const hora = new Date().getHours();

  if (hora >= 6 && hora < 12) return '¡Buenos días! 😊';
  if (hora >= 12 && hora < 19) return '¡Buenas tardes! 😊';

  return '¡Buenas noches! 😊';
};

function IndicadorEscritura() {
  return (
    <div className="flex items-start gap-2.5 chatbot-mensaje-entrada">
      <AvatarBot />

      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-emerald-100 bg-white px-4 py-3 shadow-sm">
        <span
          className="chatbot-punto h-2 w-2 rounded-full bg-emerald-500"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="chatbot-punto h-2 w-2 rounded-full bg-emerald-500"
          style={{ animationDelay: '200ms' }}
        />
        <span
          className="chatbot-punto h-2 w-2 rounded-full bg-emerald-500"
          style={{ animationDelay: '400ms' }}
        />
      </div>
    </div>
  );
}

function AvatarBot() {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-700 to-lime-500 text-white shadow-md shadow-emerald-500/20">
      <Bot size={19} />
    </div>
  );
}

function BurbujaUsuario({ texto }) {
  return (
    <div className="flex justify-end chatbot-mensaje-entrada">
      <div className="max-w-[84%] rounded-2xl rounded-tr-md bg-gradient-to-br from-emerald-700 to-green-600 px-4 py-3 text-sm font-bold leading-relaxed text-white shadow-md shadow-emerald-900/10">
        {texto}
      </div>
    </div>
  );
}

function BotonOpcion({ opcion, onClick, disabled }) {
  const Icono = ICONOS_OPCION[opcion.icono] || ChevronRight;

  if (opcion.compacta) {
    return (
      <button
        type="button"
        onClick={() => onClick(opcion)}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-700 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Icono size={15} />
        {opcion.etiqueta}
      </button>
    );
  }

  const clasesIcono = {
    buscar: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    promociones: 'border-rose-100 bg-rose-50 text-rose-700',
    categorias: 'border-violet-100 bg-violet-50 text-violet-700',
    whatsapp: 'border-emerald-100 bg-emerald-50 text-emerald-700',
  };

  return (
    <button
      type="button"
      onClick={() => onClick(opcion)}
      disabled={disabled}
      className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${
          clasesIcono[opcion.icono] ||
          'border-slate-200 bg-slate-50 text-slate-600'
        }`}
      >
        <Icono size={20} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-slate-900">{opcion.etiqueta}</p>

        {opcion.descripcion && (
          <p className="mt-0.5 text-xs font-semibold leading-relaxed text-slate-500">
            {opcion.descripcion}
          </p>
        )}
      </div>

      <ChevronRight
        size={18}
        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600"
      />
    </button>
  );
}

function ProductoChatCard({
  producto,
  onSeleccionar,
  onVerDetalle,
  disabled,
}) {
  const nombre = obtenerNombreProducto(producto);
  const precio = obtenerPrecioProducto(producto);

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <button
        type="button"
        onClick={() => onSeleccionar(producto)}
        disabled={disabled}
        className="flex w-full gap-3 p-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-emerald-50 text-emerald-600">
          {producto.imagen_url ? (
            <img
              src={producto.imagen_url}
              alt={nombre}
              className="h-full w-full object-contain"
            />
          ) : (
            <PackageSearch size={25} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-2 text-sm font-black leading-snug text-slate-900">
              {nombre}
            </h4>

            {producto.tiene_oferta && (
              <span className="shrink-0 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-rose-600">
                Oferta
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-xs font-semibold text-slate-500">
            {obtenerDescripcionProducto(producto)}
          </p>

          <div className="mt-2 flex items-center justify-between gap-2">
            <p className="text-base font-black text-emerald-700">
              {precio.toLocaleString('es-MX', {
                style: 'currency',
                currency: 'MXN',
              })}
            </p>

            <span className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600">
              Seleccionar
              <ChevronRight size={14} />
            </span>
          </div>
        </div>
      </button>

      <button
        type="button"
        onClick={() => onVerDetalle?.(producto)}
        disabled={disabled}
        className="inline-flex w-full items-center justify-center gap-2 border-t border-slate-100 px-3 py-2.5 text-xs font-black text-slate-500 transition hover:bg-slate-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Ver información del producto
        <ArrowUpRight size={14} />
      </button>
    </article>
  );
}

function MensajeBot({
  mensaje,
  onOpcion,
  onCategoria,
  onSeleccionarProducto,
  onVerDetalle,
  disabled,
}) {
  return (
    <div className="flex items-start gap-2.5 chatbot-mensaje-entrada">
      <AvatarBot />

      <div className="min-w-0 max-w-[calc(100%_-_46px)] flex-1">
        <div className="rounded-2xl rounded-tl-md border border-emerald-100 bg-white px-4 py-3 text-sm font-semibold leading-relaxed text-slate-700 shadow-sm">
          {mensaje.texto}
        </div>

        {mensaje.tipo === TIPO_MENSAJE.OPCIONES && (
          <div
            className={`mt-2.5 ${
              mensaje.opciones?.every((opcion) => opcion.compacta)
                ? 'flex flex-wrap gap-2'
                : 'space-y-2'
            }`}
          >
            {(mensaje.opciones || []).map((opcion) => (
              <BotonOpcion
                key={`${mensaje.id}-${opcion.id}`}
                opcion={opcion}
                onClick={onOpcion}
                disabled={disabled}
              />
            ))}
          </div>
        )}

        {mensaje.tipo === TIPO_MENSAJE.CATEGORIAS && (
          <div className="mt-2.5 grid grid-cols-2 gap-2">
            {(mensaje.categorias || []).map((categoria) => (
              <button
                key={categoria.id_categoria}
                type="button"
                onClick={() => onCategoria(categoria)}
                disabled={disabled}
                className="group flex min-h-[82px] flex-col items-start justify-between rounded-2xl border border-violet-100 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Tags size={18} className="text-violet-600" />
                <span className="mt-2 line-clamp-2 text-xs font-black leading-snug text-slate-800">
                  {categoria.nombre}
                </span>
              </button>
            ))}
          </div>
        )}

        {mensaje.tipo === TIPO_MENSAJE.PRODUCTOS && (
          <div className="mt-2.5 space-y-2.5">
            {(mensaje.productos || []).map((producto) => (
              <ProductoChatCard
                key={`${mensaje.id}-${producto.id_catalogo}`}
                producto={producto}
                onSeleccionar={onSeleccionarProducto}
                onVerDetalle={onVerDetalle}
                disabled={disabled}
              />
            ))}

            {mensaje.total > mensaje.productos.length && (
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-xs font-bold text-slate-500">
                Mostrando {mensaje.productos.length} de {mensaje.total}{' '}
                resultados. Escribe una búsqueda más específica para reducirlos.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ChatbotDisponibilidad({
  onVerDisponibilidad,
  onVerDetalle,
  onAbrirWhatsApp,
}) {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [entrada, setEntrada] = useState('');
  const [modoEntrada, setModoEntrada] = useState(MODO_ENTRADA.LIBRE);
  const [categorias, setCategorias] = useState([]);
  const [escribiendo, setEscribiendo] = useState(false);
  const [procesando, setProcesando] = useState(false);
  const [iniciado, setIniciado] = useState(false);

  const contenedorMensajesRef = useRef(null);
  const contadorMensajesRef = useRef(0);
  const sesionRef = useRef(0);
  const inicioEnCursoRef = useRef(false);

  const bloqueado = escribiendo || procesando;

  const placeholder = useMemo(() => {
    if (modoEntrada === MODO_ENTRADA.BUSCAR_PRODUCTO) {
      return 'Escribe el nombre del producto...';
    }

    return 'Escribe un producto o una pregunta...';
  }, [modoEntrada]);

  const crearId = () => {
    contadorMensajesRef.current += 1;
    return `${Date.now()}-${contadorMensajesRef.current}`;
  };

  const agregarMensaje = (mensaje) => {
    setMensajes((actuales) => [
      ...actuales,
      {
        id: crearId(),
        tipo: TIPO_MENSAJE.TEXTO,
        ...mensaje,
      },
    ]);
  };

  const agregarMensajeUsuario = (texto) => {
    agregarMensaje({
      autor: 'usuario',
      texto,
    });
  };

  const responderBot = async (
    texto,
    configuracion = {},
    demoraMinima = 1600
  ) => {
    const sesion = sesionRef.current;
    const demoraReal = calcularDemoraEscritura(
      texto,
      demoraMinima
    );

    setEscribiendo(true);
    await esperar(demoraReal);

    if (sesion !== sesionRef.current) return false;

    agregarMensaje({
      autor: 'bot',
      texto,
      ...configuracion,
    });

    setEscribiendo(false);
    return true;
  };

  const mostrarMenu = async (mensajePrevio = null) => {
    setModoEntrada(MODO_ENTRADA.LIBRE);

    if (mensajePrevio) {
      const continuo = await responderBot(mensajePrevio, {}, 400);
      if (!continuo) return;
    }

    await responderBot(
      '¿Qué te gustaría consultar?',
      {
        tipo: TIPO_MENSAJE.OPCIONES,
        opciones: OPCIONES_MENU,
      },
      450
    );
    await responderBot ('Selecciona una opción o escribe el nombre de un producto para buscalo. 😊')
  };

  const iniciarConversacion = async () => {
    const sesion = sesionRef.current;

    inicioEnCursoRef.current = true;
    setIniciado(true);
    setModoEntrada(MODO_ENTRADA.LIBRE);

    const saludoInicial =
      '¡Hola! Soy tu asistente de Farmacias Shaddai.';

    setEscribiendo(true);
    await esperar(calcularDemoraEscritura(saludoInicial, 1800));

    if (sesion !== sesionRef.current) return;

    agregarMensaje({
      autor: 'bot',
      texto: saludoInicial,
    });

    setEscribiendo(false);

    const continuo = await responderBot(
      'Puedo ayudarte a encontrar productos, promociones y disponibilidad por sucursal.',
      {},
      500
    );

    if (!continuo) return;

    await mostrarMenu();
  };

  const reiniciarConversacion = () => {
    sesionRef.current += 1;
    setMensajes([]);
    setEntrada('');
    setModoEntrada(MODO_ENTRADA.LIBRE);
    setEscribiendo(false);
    setProcesando(false);
    inicioEnCursoRef.current = false;
    setIniciado(false);
  };

  const consultarCatalogo = async (params = {}) => {
    const { data } = await api.get('/public/catalogo', { params });

    if (!data?.ok) {
      throw new Error(data?.mensaje || 'No se pudo consultar el catálogo.');
    }

    return data.catalogo || [];
  };

  const mostrarProductos = async ({
    productos,
    titulo,
    textoVacio,
  }) => {
    if (productos.length === 0) {
      await responderBot(textoVacio, {}, 450);

      await responderBot(
        'Puedes intentar con otro nombre o contactar directamente a una sucursal.',
        {
          tipo: TIPO_MENSAJE.OPCIONES,
          opciones: [
            {
              id: 'buscar',
              etiqueta: 'Intentar otra búsqueda',
              icono: 'buscar',
              compacta: true,
            },
            {
              id: 'whatsapp',
              etiqueta: 'Contactar por WhatsApp',
              icono: 'whatsapp',
              compacta: true,
            },
          ],
        },
        350
      );

      return;
    }

    await responderBot(
      `${titulo} Selecciona un producto para continuar.`,
      {
        tipo: TIPO_MENSAJE.PRODUCTOS,
        productos: productos.slice(0, 8),
        total: productos.length,
      },
      500
    );

    await responderBot(
      'También puedes escribir otra búsqueda cuando quieras.',
      {
        tipo: TIPO_MENSAJE.OPCIONES,
        opciones: OPCIONES_DESPUES_RESULTADOS,
      },
      300
    );
  };

  const buscarProductos = async (consultaOriginal) => {
    const termino = limpiarConsultaProducto(consultaOriginal);

    try {
      setProcesando(true);
      setModoEntrada(MODO_ENTRADA.LIBRE);

      await responderBot(
        `Buscaré “${termino}” en nuestro catálogo.`,
        {},
        350
      );

      let productos = await consultarCatalogo({ q: termino });

      if (
        productos.length === 0 &&
        termino.toLowerCase() !== consultaOriginal.trim().toLowerCase()
      ) {
        productos = await consultarCatalogo({
          q: consultaOriginal.trim(),
        });
      }

      await mostrarProductos({
        productos,
        titulo:
          productos.length === 1
            ? 'Encontré un producto.'
            : `Encontré ${productos.length} productos.`,
        textoVacio: `No encontré productos relacionados con “${termino}”.`,
      });
    } catch (error) {
      console.error('Error al buscar productos desde el chatbot:', error);

      await responderBot(
        error.response?.data?.mensaje ||
          error.message ||
          'No fue posible consultar los productos en este momento.',
        {},
        350
      );
    } finally {
      setProcesando(false);
    }
  };

  const cargarPromociones = async () => {
    try {
      setProcesando(true);

      await responderBot(
        'Estoy revisando las promociones disponibles.',
        {},
        350
      );

      const catalogo = await consultarCatalogo();
      const promociones = catalogo.filter(
        (producto) => producto.tiene_oferta
      );

      await mostrarProductos({
        productos: promociones,
        titulo:
          promociones.length === 1
            ? 'Encontré una promoción.'
            : `Encontré ${promociones.length} promociones.`,
        textoVacio:
          'Por el momento no hay productos con promoción activa.',
      });
    } catch (error) {
      console.error('Error al cargar promociones:', error);

      await responderBot(
        error.response?.data?.mensaje ||
          error.message ||
          'No fue posible consultar las promociones.',
        {},
        350
      );
    } finally {
      setProcesando(false);
    }
  };

  const cargarCategorias = async () => {
    try {
      setProcesando(true);

      await responderBot(
        'Claro. Estoy cargando las categorías disponibles.',
        {},
        350
      );

      let categoriasDisponibles = categorias;

      if (categoriasDisponibles.length === 0) {
        const { data } = await api.get('/public/catalogo/categorias');

        if (!data?.ok) {
          throw new Error(
            data?.mensaje || 'No se pudieron cargar las categorías.'
          );
        }

        categoriasDisponibles = data.categorias || [];
        setCategorias(categoriasDisponibles);
      }

      if (categoriasDisponibles.length === 0) {
        await responderBot(
          'Todavía no hay categorías disponibles en el catálogo.',
          {},
          350
        );
        return;
      }

      await responderBot(
        'Selecciona una categoría para ver sus productos.',
        {
          tipo: TIPO_MENSAJE.CATEGORIAS,
          categorias: categoriasDisponibles,
        },
        450
      );
    } catch (error) {
      console.error('Error al cargar categorías:', error);

      await responderBot(
        error.response?.data?.mensaje ||
          error.message ||
          'No fue posible consultar las categorías.',
        {},
        350
      );
    } finally {
      setProcesando(false);
    }
  };

  const seleccionarCategoria = async (categoria) => {
    if (bloqueado) return;

    agregarMensajeUsuario(categoria.nombre);

    try {
      setProcesando(true);

      await responderBot(
        `Consultaré los productos de ${categoria.nombre}.`,
        {},
        300
      );

      const productos = await consultarCatalogo({
        categoria: categoria.id_categoria,
      });

      await mostrarProductos({
        productos,
        titulo:
          productos.length === 1
            ? `Encontré un producto en ${categoria.nombre}.`
            : `Encontré ${productos.length} productos en ${categoria.nombre}.`,
        textoVacio:
          'Esta categoría todavía no tiene productos disponibles.',
      });
    } catch (error) {
      console.error('Error al consultar categoría:', error);

      await responderBot(
        error.response?.data?.mensaje ||
          error.message ||
          'No fue posible consultar esta categoría.',
        {},
        350
      );
    } finally {
      setProcesando(false);
    }
  };

  const seleccionarProducto = async (producto) => {
    if (bloqueado) return;

    const nombre = obtenerNombreProducto(producto);
    const precio = obtenerPrecioProducto(producto);

    agregarMensajeUsuario(nombre);

    await responderBot(
      `Seleccionaste ${nombre}, con precio de ${precio.toLocaleString(
        'es-MX',
        {
          style: 'currency',
          currency: 'MXN',
        }
      )}. ¿Qué deseas hacer?`,
      {
        tipo: TIPO_MENSAJE.OPCIONES,
        opciones: [
          {
            id: 'disponibilidad-producto',
            etiqueta: 'Ver disponibilidad',
            icono: 'buscar',
            compacta: true,
            producto,
          },
          {
            id: 'detalle-producto',
            etiqueta: 'Ver información',
            icono: 'menu',
            compacta: true,
            producto,
          },
          {
            id: 'whatsapp-producto',
            etiqueta: 'Preguntar por WhatsApp',
            icono: 'whatsapp',
            compacta: true,
            producto,
          },
        ],
      },
      400
    );
  };

  const abrirDisponibilidad = async (producto) => {
    await responderBot(
      'Abriré la disponibilidad por sucursal. Recuerda que las existencias pueden cambiar.',
      {},
      300
    );

    onVerDisponibilidad?.(producto);
  };

  const abrirDetalle = (producto) => {
    onVerDetalle?.(producto);
  };

  const abrirWhatsApp = async (producto = null) => {
    const texto = producto
      ? `Te mostraré las sucursales para que preguntes por ${obtenerNombreProducto(
          producto
        )}.`
      : 'Te mostraré las sucursales disponibles para continuar por WhatsApp.';

    await responderBot(texto, {}, 300);
    onAbrirWhatsApp?.();
  };

  const manejarOpcion = async (opcion) => {
    if (bloqueado) return;

    agregarMensajeUsuario(opcion.etiqueta);

    switch (opcion.id) {
      case 'buscar':
        setModoEntrada(MODO_ENTRADA.BUSCAR_PRODUCTO);
        await responderBot(
          'Escribe el nombre del medicamento o producto que deseas encontrar.',
          {},
          350
        );
        break;

      case 'promociones':
        await cargarPromociones();
        break;

      case 'categorias':
        await cargarCategorias();
        break;

      case 'whatsapp':
        await abrirWhatsApp();
        break;

      case 'menu':
        await mostrarMenu('Regresemos al menú principal.');
        break;

      case 'disponibilidad-producto':
        await abrirDisponibilidad(opcion.producto);
        break;

      case 'detalle-producto':
        abrirDetalle(opcion.producto);
        break;

      case 'whatsapp-producto':
        await abrirWhatsApp(opcion.producto);
        break;

      default:
        break;
    }
  };

  const interpretarEntrada = async (texto) => {
    const normalizadoOriginal = normalizarMensaje(texto);
    const contieneSaludo = coincideExpresion(
      normalizadoOriginal,
      EXPRESIONES_SALUDO
    );
    const mensajeSinSaludo = contieneSaludo
      ? quitarSaludoInicial(normalizadoOriginal)
      : normalizadoOriginal;

    if (contieneSaludo) {
      await responderBot(
        `${obtenerSaludoSegunHora()} ¿En qué puedo ayudarte?`,
        {},
        320
      );

      if (!mensajeSinSaludo) {
        await mostrarMenu();
        return;
      }
    }

    const normalizado = mensajeSinSaludo || normalizadoOriginal;

    if (coincideExpresion(normalizado, EXPRESIONES_AYUDA)) {
      await responderBot(
        'Claro. Puedo buscar productos, mostrar promociones, explorar categorías, consultar disponibilidad y ayudarte a contactar una sucursal.',
        {},
        350
      );

      await mostrarMenu();
      return;
    }

    if (coincideExpresion(normalizado, EXPRESIONES_AGRADECIMIENTO)) {
      await responderBot(
        '¡Con gusto! 😊 Estoy aquí para ayudarte cuando lo necesites.',
        {
          tipo: TIPO_MENSAJE.OPCIONES,
          opciones: [
            {
              id: 'buscar',
              etiqueta: 'Buscar otro producto',
              icono: 'buscar',
              compacta: true,
            },
            {
              id: 'menu',
              etiqueta: 'Ver opciones',
              icono: 'menu',
              compacta: true,
            },
          ],
        },
        320
      );
      return;
    }

    if (coincideExpresion(normalizado, EXPRESIONES_DESPEDIDA)) {
      await responderBot(
        '¡Gracias por consultar Farmacias Shaddai! Que tengas un excelente día. 👋',
        {
          tipo: TIPO_MENSAJE.OPCIONES,
          opciones: [
            {
              id: 'menu',
              etiqueta: 'Volver al menú',
              icono: 'menu',
              compacta: true,
            },
          ],
        },
        320
      );
      return;
    }

    if (
      normalizado.includes('promoc') ||
      normalizado.includes('oferta') ||
      normalizado.includes('descuento')
    ) {
      await cargarPromociones();
      return;
    }

    if (
      normalizado.includes('categor') ||
      normalizado.includes('seccion')
    ) {
      await cargarCategorias();
      return;
    }

    if (
      normalizado.includes('whatsapp') ||
      normalizado.includes('sucursal') ||
      normalizado.includes('contactar') ||
      normalizado.includes('hablar con')
    ) {
      await abrirWhatsApp();
      return;
    }

    if (
      normalizado === 'menu' ||
      normalizado.includes('opciones')
    ) {
      await mostrarMenu();
      return;
    }

    await buscarProductos(mensajeSinSaludo || texto);
  };

  const enviarMensaje = async (event) => {
    event?.preventDefault();

    const texto = entrada.trim();

    if (!texto || bloqueado) return;

    setEntrada('');
    agregarMensajeUsuario(texto);

    if (modoEntrada === MODO_ENTRADA.BUSCAR_PRODUCTO) {
      await buscarProductos(texto);
      return;
    }

    await interpretarEntrada(texto);
  };

  useEffect(() => {
    if (abierto && !iniciado && !inicioEnCursoRef.current) {
      iniciarConversacion();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, iniciado]);

  useEffect(() => {
    const contenedor = contenedorMensajesRef.current;

    if (!contenedor) return;

    contenedor.scrollTo({
      top: contenedor.scrollHeight,
      behavior: 'smooth',
    });
  }, [mensajes, escribiendo]);

  return (
    <>
      <style>
        {`
          @keyframes chatbotMensajeEntrada {
            from {
              opacity: 0;
              transform: translateY(8px) scale(.985);
            }
            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }

          @keyframes chatbotPunto {
            0%, 15%, 45%, 100% {
              transform: translateY(0);
              opacity: .35;
            }

            30% {
              transform: translateY(-5px);
              opacity: 1;
            }
          }

          @keyframes chatbotPulso {
            0%, 100% {
              transform: scale(1);
              box-shadow: 0 18px 40px rgba(5, 150, 105, .30);
            }
            50% {
              transform: scale(1.035);
              box-shadow: 0 22px 52px rgba(34, 197, 94, .42);
            }
          }

          .chatbot-mensaje-entrada {
            animation: chatbotMensajeEntrada .28s ease-out both;
          }

          .chatbot-punto {
            animation: chatbotPunto 1.2s ease-in-out infinite;
            will-change: transform, opacity;
          }

          .chatbot-boton-pulso {
            animation: chatbotPulso 2.8s ease-in-out infinite;
          }
        `}
      </style>

      {!abierto && (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="chatbot-boton-pulso fixed bottom-5 right-5 z-[950] inline-flex items-center gap-3 rounded-full border border-white/30 bg-gradient-to-r from-emerald-700 to-lime-500 px-4 py-4 font-black text-white transition hover:-translate-y-1 sm:px-5"
          aria-label="Abrir asistente del catálogo"
        >
          <span className="relative flex h-7 w-7 items-center justify-center">
            <MessageCircle size={25} />
            <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-lime-400 bg-emerald-400" />
          </span>

          <span className="hidden sm:inline">¿Buscas un producto?</span>
        </button>
      )}

      {abierto && (
        <section
          className="
            fixed bottom-3 right-3 z-[950]
            flex h-[min(720px,calc(100vh-1.5rem))]
            w-[calc(100vw-1.5rem)] max-w-[440px]
            flex-col overflow-hidden rounded-[2rem]
            border border-white bg-white
            shadow-2xl shadow-slate-950/30
            sm:bottom-5 sm:right-5 sm:h-[min(720px,calc(100vh-3rem))]
          "
          aria-label="Asistente del catálogo"
        >
          <header className="relative overflow-hidden bg-gradient-to-br from-emerald-800 via-emerald-600 to-lime-500 px-5 pb-5 pt-4 text-white">
            <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 -left-10 h-32 w-32 rounded-full bg-lime-200/15" />

            <div className="relative flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
                  <Bot size={26} />
                </div>

                <div className="min-w-0">
                  <h2 className="truncate text-lg font-black">
                    Asistente Shaddai
                  </h2>

                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-bold text-emerald-100">
                    <span className="h-2 w-2 rounded-full bg-emerald-300" />
                    Atención automática en línea
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={reiniciarConversacion}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Reiniciar conversación"
                  title="Reiniciar conversación"
                >
                  <RotateCcw size={18} />
                </button>

                <button
                  type="button"
                  onClick={() => setAbierto(false)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white transition hover:bg-white/20"
                  aria-label="Cerrar asistente"
                  title="Cerrar"
                >
                  <X size={21} />
                </button>
              </div>
            </div>
          </header>

          <div
            ref={contenedorMensajesRef}
            className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-4"
          >
            {mensajes.map((mensaje) =>
              mensaje.autor === 'usuario' ? (
                <BurbujaUsuario key={mensaje.id} texto={mensaje.texto} />
              ) : (
                <MensajeBot
                  key={mensaje.id}
                  mensaje={mensaje}
                  onOpcion={manejarOpcion}
                  onCategoria={seleccionarCategoria}
                  onSeleccionarProducto={seleccionarProducto}
                  onVerDetalle={abrirDetalle}
                  disabled={bloqueado}
                />
              )
            )}

            {escribiendo && <IndicadorEscritura />}
          </div>

          <div className="border-t border-slate-100 bg-white p-3">
            <form onSubmit={enviarMensaje} className="relative">
              <input
                type="text"
                value={entrada}
                onChange={(event) => setEntrada(event.target.value)}
                placeholder={placeholder}
                disabled={bloqueado}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-4 pr-14 text-sm font-bold text-slate-700 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
              />

              <button
                type="submit"
                disabled={!entrada.trim() || bloqueado}
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-emerald-500 text-slate-950 shadow-md shadow-amber-500/25 transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
                aria-label="Enviar mensaje"
              >
                {procesando ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <Send size={18} />
                )}
              </button>
            </form>

            <div className="mt-2 flex items-start gap-2 px-1 text-[10px] font-semibold leading-relaxed text-slate-400">
              <Store size={13} className="mt-0.5 shrink-0" />
              Consulta informativa. Confirma existencias con la sucursal. El
              asistente no proporciona diagnósticos ni recomendaciones médicas.
            </div>
          </div>
        </section>
      )}
    </>
  );
}
