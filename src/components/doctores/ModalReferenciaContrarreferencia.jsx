import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeftRight,
  CheckCircle2,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Save,
  X,
} from 'lucide-react';
import Swal from 'sweetalert2';
import HojaReferenciaContrarreferenciaImprimible from './HojaReferenciaContrarreferenciaImprimible';
import { referenciasService } from '../../services/referenciasService';

const formInicial = {
  numero_control: '',
  folio_aceptacion: '',
  fecha_referencia: '',
  expediente: '',

  unidad_refiere: 'Farmacia Shaddai',
  hospital_refiere: '',
  atencion: '',
  medica_urgente: '',

  nombre_paciente: '',
  primer_apellido: '',
  segundo_apellido: '',
  sexo: '',
  fecha_nacimiento: '',
  edad: '',
  urgencia: '',
  telefono: '',
  domicilio: '',
  colonia: '',
  municipio: '',
  estado: '',
  numero_exterior: '',

  unidad_destino: '',
  servicio_destino: '',
  especialidad_destino: '',

  ta: '',
  temperatura: '',
  frecuencia_cardiaca: '',
  frecuencia_respiratoria: '',
  peso: '',
  talla: '',
  imc: '',
  spo2: '',
  perimetro_cefalico: '',

  motivos_referencia: [],

  diagnostico_presuncional: '',
  resumen_clinico: '',
  tratamiento: '',

  medico_refiere: '',
  cedula_profesional: '',
};

const OPCIONES = {
  sexo: [
    ['HOMBRE', 'Hombre'],
    ['MUJER', 'Mujer'],
    ['INTERSEXUAL', 'Intersexual'],
    ['NO_ESPECIFICADO', 'No especificado'],
  ],
  si_no: [
    ['SI', 'Sí'],
    ['NO', 'No'],
  ],
  motivo_referencia: [
    ['SIN_ESPECIALISTA', 'No se cuenta con médico especialista en turno'],
    ['SIN_INFRAESTRUCTURA', 'No se cuenta con infraestructura para atender padecimiento'],
    ['HOSPITAL_SATURADO', 'Hospital saturado'],
    ['TERCER_NIVEL', 'Requiere atención de 3er nivel'],
    ['REGIONALIZACION', 'Por regionalización operativa'],
    ['DERECHOHABIENCIA', 'Derechohabiencia a IMSS/ISSSTE/PEMEX/SEDENA'],
    ['CONSULTA_EXTERNA', 'Consulta externa y/o especialidad/subespecialidad'],
    ['VALORACION_MEDICA', 'Valoración médica'],
  ],
};

const obtenerFechaHoy = () => new Date().toISOString().slice(0, 10);

const obtenerNombrePaciente = (expediente = {}, paciente = {}) => {
  if (paciente?.nombre_paciente) return paciente.nombre_paciente;

  const partes = [
    expediente?.nombre_paciente,
    expediente?.primer_apellido,
    expediente?.segundo_apellido,
  ].filter(Boolean);

  return partes.length ? partes.join(' ') : '';
};

const normalizarSexo = (valor) => {
  const texto = String(valor || '').trim().toUpperCase();

  if (texto === 'FEMENINO' || texto === 'MUJER') return 'MUJER';
  if (texto === 'MASCULINO' || texto === 'HOMBRE') return 'HOMBRE';
  if (texto === 'INTERSEXUAL') return 'INTERSEXUAL';

  return texto || '';
};

export default function ModalReferenciaContrarreferencia({
  abierto,
  onClose,
  expediente,
  paciente,
  perfilDoctor,
  idFila = null,
  idExpediente = null,
  idSucursal = null,
}) {
  const [form, setForm] = useState(formInicial);
  const [guardando, setGuardando] = useState(false);
  const [tipoVista, setTipoVista] = useState('referencia');
  const [referenciaGuardada, setReferenciaGuardada] = useState(null);

  const nombrePaciente = useMemo(() => {
    return obtenerNombrePaciente(expediente, paciente);
  }, [expediente, paciente]);

  const mostrarAlerta = (config) => {
    return Swal.fire({
      ...config,
      customClass: {
        container: 'swal-referencia-container',
        popup: 'swal-referencia-popup',
        ...(config.customClass || {}),
      },
    });
  };


  const obtenerIdExpediente = () => {
    return (
      expediente?.id_expediente ||
      paciente?.id_expediente ||
      idExpediente ||
      form.expediente ||
      null
    );
  };

  const obtenerIdFila = () => {
    return (
      paciente?.id_fila ||
      paciente?.idFila ||
      idFila ||
      null
    );
  };

  const obtenerIdSucursal = () => {
    return (
      paciente?.id_sucursal ||
      paciente?.idSucursal ||
      expediente?.id_sucursal ||
      expediente?.idSucursal ||
      idSucursal ||
      null
    );
  };

  useEffect(() => {
    if (!abierto) return;

    setForm({
      ...formInicial,
      fecha_referencia: obtenerFechaHoy(),
      expediente: expediente?.id_expediente || '',

      nombre_paciente:
        expediente?.nombre_paciente ||
        paciente?.nombre_paciente ||
        nombrePaciente ||
        '',
      primer_apellido: expediente?.primer_apellido || '',
      segundo_apellido: expediente?.segundo_apellido || '',
      sexo: normalizarSexo(paciente?.sexo || expediente?.sexo || ''),
      fecha_nacimiento: expediente?.fecha_nacimiento
        ? String(expediente.fecha_nacimiento).slice(0, 10)
        : '',
      edad: paciente?.edad || expediente?.edad || '',
      telefono: paciente?.telefono || expediente?.telefono || '',
      domicilio: expediente?.direccion || '',
      municipio: expediente?.municipio || '',
      estado: expediente?.entidad_nacimiento || '',

      diagnostico_presuncional: paciente?.diagnostico || '',
      tratamiento: paciente?.observaciones || '',

      medico_refiere: perfilDoctor?.nombre_completo || '',
      cedula_profesional: perfilDoctor?.cedula_profesional || '',
    });

    setTipoVista('ambas');
    setReferenciaGuardada(null);
  }, [abierto, expediente, paciente, nombrePaciente, perfilDoctor]);

  if (!abierto) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleMotivo = (value) => {
    setForm((prev) => {
      const actual = Array.isArray(prev.motivos_referencia)
        ? prev.motivos_referencia
        : [];

      if (actual.includes(value)) {
        return {
          ...prev,
          motivos_referencia: actual.filter((item) => item !== value),
        };
      }

      return {
        ...prev,
        motivos_referencia: [...actual, value],
      };
    });
  };

  const validar = () => {
    if (!form.nombre_paciente.trim()) {
      mostrarAlerta({
        icon: 'warning',
        title: 'Paciente requerido',
        text: 'Captura o carga el nombre del paciente.',
      });
      return false;
    }

    if (!form.fecha_referencia) {
      mostrarAlerta({
        icon: 'warning',
        title: 'Fecha requerida',
        text: 'Captura la fecha de referencia.',
      });
      return false;
    }

    if (!form.unidad_destino.trim()) {
      mostrarAlerta({
        icon: 'warning',
        title: 'Unidad destino requerida',
        text: 'Captura la unidad a la que se refiere el paciente.',
      });
      return false;
    }

    if (!form.servicio_destino.trim()) {
      mostrarAlerta({
        icon: 'warning',
        title: 'Servicio requerido',
        text: 'Captura el servicio al que se envía.',
      });
      return false;
    }

    if (!form.diagnostico_presuncional.trim()) {
      mostrarAlerta({
        icon: 'warning',
        title: 'Diagnóstico requerido',
        text: 'Captura el diagnóstico presuncional.',
      });
      return false;
    }

    if (!form.resumen_clinico.trim()) {
      mostrarAlerta({
        icon: 'warning',
        title: 'Resumen clínico requerido',
        text: 'Captura el resumen clínico del motivo de referencia.',
      });
      return false;
    }

    return true;
  };

  const guardarReferencia = async ({ mostrarMensaje = true } = {}) => {
    if (referenciaGuardada?.id_referencia) {
      if (mostrarMensaje) {
        mostrarAlerta({
          icon: 'info',
          title: 'Referencia ya guardada',
          text: 'Esta referencia ya fue guardada. Puedes imprimirla o cerrar el modal.',
        });
      }

      return referenciaGuardada;
    }

    if (!validar()) return null;

    try {
      setGuardando(true);

      const payload = {
        ...form,
        id_expediente: obtenerIdExpediente(),
        id_fila: obtenerIdFila(),
        id_sucursal: obtenerIdSucursal(),
      };

      const data = await referenciasService.crearReferencia(payload);

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo guardar la referencia.');
      }

      const referencia = data.referencia || null;

      setReferenciaGuardada(referencia);

      if (referencia) {
        setForm((prev) => ({
          ...prev,
          numero_control: referencia.numero_control ?? prev.numero_control,
          folio_aceptacion: referencia.folio_aceptacion ?? prev.folio_aceptacion,
          fecha_referencia: referencia.fecha_referencia
            ? String(referencia.fecha_referencia).slice(0, 10)
            : prev.fecha_referencia,
        }));
      }

      if (mostrarMensaje) {
        mostrarAlerta({
          icon: 'success',
          title: 'Referencia guardada',
          text: 'La referencia quedó guardada correctamente.',
          timer: 1500,
          showConfirmButton: false,
        });
      }

      setTipoVista('ambas');

      return referencia;
    } catch (error) {
      console.error('Error al guardar referencia:', error);

      mostrarAlerta({
        icon: 'error',
        title: 'Error al guardar',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo guardar la referencia.',
      });

      return null;
    } finally {
      setGuardando(false);
    }
  };

  const esperarRender = () =>
    new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 300);
        });
      });
    });

  const imprimirDesdeIframe = (imprimible) => {
    const iframe = document.createElement('iframe');

    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';

    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow.document;

    const estilos = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    )
      .map((node) => node.outerHTML)
      .join('\n');

    iframeDoc.open();
    iframeDoc.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Referencia y contrarreferencia</title>
          ${estilos}

          <style>
            @page {
              size: letter portrait;
              margin: 6mm;
            }

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              width: 216mm !important;
              min-height: 279mm !important;
              background: #ffffff !important;
              overflow: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body * {
              visibility: visible !important;
            }

            #hoja-referencia-contrarreferencia {
              position: static !important;
              display: block !important;
              width: 204mm !important;
              max-width: 204mm !important;
              min-width: 204mm !important;
              height: auto !important;
              margin: 0 auto !important;
              padding: 0 !important;
              overflow: visible !important;
              background: #ffffff !important;
              transform: none !important;
              zoom: 1 !important;
            }

            #hoja-referencia-contrarreferencia .rr-sheet {
              position: relative !important;
              display: block !important;
              width: 204mm !important;
              max-width: 204mm !important;
              min-width: 204mm !important;
              height: 267mm !important;
              min-height: 267mm !important;
              max-height: 267mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              border: 0 !important;
              box-shadow: none !important;
              overflow: hidden !important;
              background: #ffffff !important;
              page-break-after: always !important;
              break-after: page !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            #hoja-referencia-contrarreferencia .rr-sheet:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }

            #hoja-referencia-contrarreferencia .rr-page-break {
              page-break-before: always !important;
              break-before: page !important;
            }
          </style>
        </head>

        <body>
          ${imprimible.outerHTML}
        </body>
      </html>
    `);
    iframeDoc.close();

    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();

      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };
  };

  const imprimir = async (tipo = 'ambas') => {
    const tipoFinal = tipo || 'ambas';

    if (tipoFinal === 'referencia' || tipoFinal === 'ambas') {
      if (!validar()) return;
    }

    if (!referenciaGuardada?.id_referencia) {
      const result = await mostrarAlerta({
        icon: 'question',
        title: 'Guardar antes de imprimir',
        text: 'Para imprimir este documento primero debe guardarse en el expediente del paciente.',
        showCancelButton: true,
        confirmButtonText: 'Guardar e imprimir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0284c7',
        cancelButtonColor: '#64748b',
      });

      if (!result.isConfirmed) return;

      const referencia = await guardarReferencia({ mostrarMensaje: false });

      if (!referencia?.id_referencia) {
        return;
      }

      await mostrarAlerta({
        icon: 'success',
        title: 'Referencia guardada',
        text: 'Ahora se abrirá la ventana de impresión.',
        timer: 1200,
        showConfirmButton: false,
      });
    }

    setTipoVista(tipoFinal);

    await esperarRender();

    const imprimible = document.getElementById('hoja-referencia-contrarreferencia');

    if (!imprimible) {
      mostrarAlerta({
        icon: 'error',
        title: 'No se encontró el documento',
        text: 'No se pudo preparar la hoja para impresión.',
      });

      return;
    }

    imprimirDesdeIframe(imprimible);
  };

  return (
    <>
      <style>
        {`
          .swal-referencia-container {
            z-index: 20000 !important;
          }

          .swal-referencia-popup {
            z-index: 20001 !important;
          }
        `}
      </style>

      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <div className="relative z-[10000] flex max-h-[94vh] w-[96vw] max-w-[1580px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 no-print">
            <div className="flex min-w-0 items-center gap-3">
              <div className="shrink-0 rounded-2xl bg-sky-100 p-3 text-sky-700">
                <ArrowLeftRight size={24} />
              </div>

              <div className="min-w-0">
                <h2 className="truncate text-xl font-black text-slate-800">
                  Referencia y contrarreferencia
                </h2>
                <p className="truncate text-sm text-slate-500">
                  Captura la hoja de referencia. La contrarreferencia se imprime vacía para respuesta.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid min-h-0 flex-1 overflow-hidden lg:grid-cols-[470px_minmax(0,1fr)]">
            <div className="flex min-h-0 flex-col border-r border-slate-100 bg-white no-print">
              <div className="border-b border-slate-100 px-5 py-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-slate-700">
                    Parámetros del documento
                  </p>

                  {referenciaGuardada?.id_referencia && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                      Guardada #{referenciaGuardada.id_referencia}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                 

                  <button
                    type="button"
                    onClick={() => setTipoVista('contrarreferencia')}
                    className={`rounded-2xl px-3 py-2 text-xs font-black transition ${tipoVista === 'contrarreferencia'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    Contrarreferencia
                  </button>

                  <button
                    type="button"
                    onClick={() => setTipoVista('ambas')}
                    className={`rounded-2xl px-3 py-2 text-xs font-black transition ${tipoVista === 'ambas'
                      ? 'bg-sky-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                  >
                    Ambas
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <FormularioReferencia
                  form={form}
                  handleChange={handleChange}
                  toggleMotivo={toggleMotivo}
                />
              </div>

              <div className="border-t border-slate-100 bg-white px-5 py-4">
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    onClick={guardarReferencia}
                    disabled={guardando || Boolean(referenciaGuardada?.id_referencia)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                  >
                    {guardando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    Guardar referencia
                  </button>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setTipoVista('referencia')}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                    >
                      <FileText size={18} />
                      Vista referencia
                    </button>

                    <button
                      type="button"
                      onClick={() => imprimir('ambas')}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-bold text-white hover:bg-sky-800"
                    >
                      <Printer size={18} />
                      Imprimir ambas hojas
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex min-h-0 flex-col bg-slate-100">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 no-print">
                <div>
                  <p className="text-sm font-black text-slate-700">
                    Vista previa del documento
                  </p>
                  <p className="text-xs text-slate-500">
                    Selecciona referencia, contrarreferencia vacía o ambas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev }))}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw size={14} />
                  Actualizar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="mx-auto w-full max-w-[820px] rounded-2xl bg-white p-4 shadow-sm">
                  <HojaReferenciaContrarreferenciaImprimible
                    expediente={expediente}
                    paciente={paciente}
                    perfilDoctor={perfilDoctor}
                    datos={form}
                    tipo={tipoVista}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function FormularioReferencia({ form, handleChange, toggleMotivo }) {
  return (
    <div className="space-y-5">
      <TituloSeccion
        titulo="Hoja de referencia"
        descripcion="Captura los datos clínicos y administrativos de envío."
      />

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
          Datos generales
        </h4>

        <div className="grid gap-4 md:grid-cols-2">
          <CampoTexto label="Fecha referencia" type="date" name="fecha_referencia" value={form.fecha_referencia} onChange={handleChange} />
          <CampoTexto label="Núm. control" name="numero_control" value={form.numero_control} onChange={handleChange} />
          <CampoTexto label="Folio aceptación" name="folio_aceptacion" value={form.folio_aceptacion} onChange={handleChange} />
          <CampoTexto label="Expediente" name="expediente" value={form.expediente} onChange={handleChange} />
          <CampoTexto label="Unidad médica que refiere" name="unidad_refiere" value={form.unidad_refiere} onChange={handleChange} />
          <CampoTexto label="Hospital / unidad" name="hospital_refiere" value={form.hospital_refiere} onChange={handleChange} />
          <CampoTexto label="Atención" name="atencion" value={form.atencion} onChange={handleChange} placeholder="Ej. médica urgente" />
          <CampoSelect label="¿Médica urgente?" name="medica_urgente" value={form.medica_urgente} onChange={handleChange} opciones={OPCIONES.si_no} />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
          Paciente
        </h4>

        <div className="grid gap-4 md:grid-cols-2">
          <CampoTexto label="Nombre(s)" name="nombre_paciente" value={form.nombre_paciente} onChange={handleChange} />
          <CampoTexto label="Primer apellido" name="primer_apellido" value={form.primer_apellido} onChange={handleChange} />
          <CampoTexto label="Segundo apellido" name="segundo_apellido" value={form.segundo_apellido} onChange={handleChange} />
          <CampoSelect label="Sexo" name="sexo" value={form.sexo} onChange={handleChange} opciones={OPCIONES.sexo} />
          <CampoTexto label="Fecha nacimiento" type="date" name="fecha_nacimiento" value={form.fecha_nacimiento} onChange={handleChange} />
          <CampoTexto label="Edad" type="number" name="edad" value={form.edad} onChange={handleChange} />
          <CampoSelect label="¿Urgencia?" name="urgencia" value={form.urgencia} onChange={handleChange} opciones={OPCIONES.si_no} />
          <CampoTexto label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} />
          <CampoTexto label="Domicilio" name="domicilio" value={form.domicilio} onChange={handleChange} />
          <CampoTexto label="Colonia" name="colonia" value={form.colonia} onChange={handleChange} />
          <CampoTexto label="Municipio" name="municipio" value={form.municipio} onChange={handleChange} />
          <CampoTexto label="Estado" name="estado" value={form.estado} onChange={handleChange} />
          <CampoTexto label="Número exterior" name="numero_exterior" value={form.numero_exterior} onChange={handleChange} />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
          Unidad destino
        </h4>

        <div className="grid gap-4 md:grid-cols-2">
          <CampoTexto label="Unidad a la que se refiere *" name="unidad_destino" value={form.unidad_destino} onChange={handleChange} />
          <CampoTexto label="Servicio al que se envía *" name="servicio_destino" value={form.servicio_destino} onChange={handleChange} placeholder="Ej. Urgencias" />
          <CampoTexto label="Especialidad" name="especialidad_destino" value={form.especialidad_destino} onChange={handleChange} placeholder="Ej. Cirugía plástica" />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
          Signos vitales y somatometría
        </h4>

        <div className="grid gap-4 md:grid-cols-2">
          <CampoTexto label="T/A" name="ta" value={form.ta} onChange={handleChange} placeholder="Ej. 120/80" />
          <CampoTexto label="Temperatura" name="temperatura" value={form.temperatura} onChange={handleChange} />
          <CampoTexto label="Frecuencia cardiaca" name="frecuencia_cardiaca" value={form.frecuencia_cardiaca} onChange={handleChange} />
          <CampoTexto label="Frecuencia respiratoria" name="frecuencia_respiratoria" value={form.frecuencia_respiratoria} onChange={handleChange} />
          <CampoTexto label="Peso" name="peso" value={form.peso} onChange={handleChange} />
          <CampoTexto label="Talla" name="talla" value={form.talla} onChange={handleChange} />
          <CampoTexto label="IMC" name="imc" value={form.imc} onChange={handleChange} />
          <CampoTexto label="SpO2" name="spo2" value={form.spo2} onChange={handleChange} />
          <CampoTexto label="Perímetro cefálico" name="perimetro_cefalico" value={form.perimetro_cefalico} onChange={handleChange} />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
          Motivo de referencia
        </h4>

        <GrupoMultiple
          titulo="Selecciona uno o varios motivos"
          name="motivos_referencia"
          valores={form.motivos_referencia}
          opciones={OPCIONES.motivo_referencia}
          onToggle={(_, value) => toggleMotivo(value)}
        />
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
          Resumen clínico
        </h4>

        <CampoArea
          label="Diagnóstico presuncional *"
          name="diagnostico_presuncional"
          value={form.diagnostico_presuncional}
          onChange={handleChange}
          rows={3}
        />

        <div className="mt-4">
          <CampoArea
            label="Resumen clínico *"
            name="resumen_clinico"
            value={form.resumen_clinico}
            onChange={handleChange}
            rows={6}
          />
        </div>

        <div className="mt-4">
          <CampoArea
            label="Tratamiento"
            name="tratamiento"
            value={form.tratamiento}
            onChange={handleChange}
            rows={4}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
        <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
          Responsable
        </h4>

        <div className="grid gap-4 md:grid-cols-2">
          <CampoTexto label="Médico que refiere" name="medico_refiere" value={form.medico_refiere} onChange={handleChange} />
          <CampoTexto label="Cédula profesional" name="cedula_profesional" value={form.cedula_profesional} onChange={handleChange} />
        </div>
      </section>
    </div>
  );
}

function TituloSeccion({ titulo, descripcion }) {
  return (
    <div>
      <h3 className="text-lg font-black text-slate-800">{titulo}</h3>
      <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
    </div>
  );
}

function CampoTexto({ label, name, value, onChange, placeholder, type = 'text' }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value || ''}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

function CampoSelect({ label, name, value, onChange, opciones = [] }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <select
        name={name}
        value={value || ''}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      >
        <option value="">Seleccionar</option>
        {opciones.map(([valueOption, labelOption]) => (
          <option key={valueOption} value={valueOption}>
            {labelOption}
          </option>
        ))}
      </select>
    </div>
  );
}

function CampoArea({ label, name, value, onChange, rows = 3 }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <textarea
        name={name}
        value={value || ''}
        onChange={onChange}
        rows={rows}
        className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

function GrupoMultiple({ titulo, name, valores = [], opciones = [], onToggle }) {
  return (
    <div>
      <p className="mb-2 text-sm font-bold text-slate-700">{titulo}</p>

      <div className="grid gap-2 sm:grid-cols-2">
        {opciones.map(([value, label]) => {
          const activo = valores.includes(value);

          return (
            <button
              key={value}
              type="button"
              onClick={() => onToggle(name, value)}
              className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-left text-sm font-bold transition ${activo
                ? 'border-sky-300 bg-sky-50 text-sky-700'
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-md border ${activo
                  ? 'border-sky-600 bg-sky-600 text-white'
                  : 'border-slate-300 bg-white'
                  }`}
              >
                {activo && <CheckCircle2 size={13} />}
              </span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
