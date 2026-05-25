import { useEffect, useMemo, useState } from 'react';
import { FileSignature, Loader2, Printer, Save, X } from 'lucide-react';
import Swal from 'sweetalert2';
import ConsentimientoInformadoImprimible from './ConsentimientoInformadoImprimible';
import { consentimientosService } from '../../services/consentimientosService';

const formInicial = {
  fecha: '',
  hora: '',

  nombre_responsable: '',
  domicilio: '',
  municipio: '',
  caracter: 'Paciente',

  padecimiento: '',
  diagnostico: '',
  tratamiento: '',
  riesgos: '',

  beneficios: '',
  alternativas: '',
  observaciones: '',

  nombre_testigo: '',
  parentesco_testigo: '',
};

const obtenerHoraActual = () => {
  const ahora = new Date();

  return `${String(ahora.getHours()).padStart(2, '0')}:${String(
    ahora.getMinutes()
  ).padStart(2, '0')}`;
};

const obtenerNombrePaciente = (expediente = {}, paciente = {}) => {
  if (paciente?.nombre_paciente) return paciente.nombre_paciente;

  const partes = [
    expediente?.nombre_paciente,
    expediente?.primer_apellido,
    expediente?.segundo_apellido,
  ].filter(Boolean);

  return partes.length ? partes.join(' ') : '';
};

export default function ModalConsentimientoInformado({
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
  const [vistaPrevia, setVistaPrevia] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [consentimientoGuardado, setConsentimientoGuardado] = useState(null);

  const nombrePaciente = useMemo(() => {
    return obtenerNombrePaciente(expediente, paciente);
  }, [expediente, paciente]);

  useEffect(() => {
    if (!abierto) return;

    setForm({
      ...formInicial,
      fecha: new Date().toISOString().slice(0, 10),
      hora: obtenerHoraActual(),
      nombre_responsable: nombrePaciente || '',
      domicilio:
        expediente?.direccion ||
        expediente?.domicilio ||
        paciente?.direccion ||
        paciente?.domicilio ||
        '',
      municipio:
        expediente?.municipio ||
        expediente?.municipio_nombre ||
        expediente?.nombre_municipio ||
        expediente?.municipio_residencia ||
        paciente?.municipio ||
        paciente?.municipio_nombre ||
        paciente?.nombre_municipio ||
        '',
      padecimiento: paciente?.diagnostico || '',
      diagnostico: paciente?.diagnostico || '',
      tratamiento: paciente?.observaciones || '',
    });

    setConsentimientoGuardado(null);
    setVistaPrevia(false);
  }, [abierto, expediente, paciente, nombrePaciente]);

  const mostrarAlerta = (config) => {
    return Swal.fire({
      ...config,
      target: document.body,
      customClass: {
        container: 'swal-consentimiento-container',
        popup: 'swal-consentimiento-popup',
        ...(config.customClass || {}),
      },
    });
  };

  if (!abierto) return null;

  const obtenerIdExpediente = () => {
    return (
      expediente?.id_expediente ||
      paciente?.id_expediente ||
      idExpediente ||
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

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validar = () => {
    if (!form.nombre_responsable.trim()) {
      mostrarAlerta({
        icon: 'warning',
        title: 'Responsable requerido',
        text: 'Captura el nombre del paciente o responsable.',
      });
      return false;
    }

    if (!form.diagnostico.trim()) {
      mostrarAlerta({
        icon: 'warning',
        title: 'Diagnóstico requerido',
        text: 'Captura el diagnóstico o motivo clínico.',
      });
      return false;
    }

    if (!form.tratamiento.trim()) {
      mostrarAlerta({
        icon: 'warning',
        title: 'Tratamiento requerido',
        text: 'Captura el tratamiento, procedimiento o atención autorizada.',
      });
      return false;
    }

    return true;
  };

  const imprimir = async () => {
    if (!validar()) return;

    let consentimientoFinal = consentimientoGuardado;

    if (!consentimientoFinal?.id_consentimiento) {
      const result = await mostrarAlerta({
        icon: 'question',
        title: 'Guardar antes de imprimir',
        text: 'Para imprimir este consentimiento primero debe guardarse en el expediente del paciente.',
        showCancelButton: true,
        confirmButtonText: 'Guardar e imprimir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#0284c7',
        cancelButtonColor: '#64748b',
      });

      if (!result.isConfirmed) return;

      consentimientoFinal = await guardarTemporal({ mostrarMensaje: false });

      if (!consentimientoFinal?.id_consentimiento) return;

      await mostrarAlerta({
        icon: 'success',
        title: 'Consentimiento guardado',
        text: 'Ahora se abrirá la ventana de impresión.',
        timer: 1200,
        showConfirmButton: false,
      });
    }

    setVistaPrevia(true);

    await new Promise((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(resolve, 350);
        });
      });
    });

    const imprimible = document.getElementById(
      'consentimiento-informado-imprimible'
    );

    if (!imprimible) {
      mostrarAlerta({
        icon: 'error',
        title: 'No se encontró el documento',
        text: 'No se pudo preparar el consentimiento para imprimir.',
      });

      return;
    }

    const iframe = document.createElement('iframe');

    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';

    document.body.appendChild(iframe);

    const iframeWindow = iframe.contentWindow;
    const iframeDoc = iframeWindow.document;

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
        <title></title>
        ${estilos}
        <style>
          @page {
            size: letter portrait;
            margin: 0;
          }

          html,
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body {
            padding: 4mm !important;
          }

          body * {
            visibility: visible !important;
          }

          #consentimiento-informado-imprimible {
            position: static !important;
            display: block !important;
            width: 100% !important;
            max-width: 208mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111827 !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          #consentimiento-informado-imprimible,
          #consentimiento-informado-imprimible * {
            visibility: visible !important;
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #consentimiento-informado-imprimible .hoja-consentimiento {
            width: 100% !important;
            max-width: 208mm !important;
            margin: 0 auto !important;
            padding: 4mm 6mm !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            overflow: hidden !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          #consentimiento-informado-imprimible p,
          #consentimiento-informado-imprimible div,
          #consentimiento-informado-imprimible span {
            overflow-wrap: anywhere !important;
          }

          .no-print {
            display: none !important;
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
      try {
        iframeWindow.document.title = '';
        iframeWindow.focus();

        setTimeout(() => {
          iframeWindow.print();

          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 1000);
        }, 300);
      } catch (error) {
        console.error('Error al imprimir consentimiento:', error);

        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }

        mostrarAlerta({
          icon: 'error',
          title: 'Error de impresión',
          text: 'No se pudo abrir la ventana de impresión.',
        });
      }
    };
  };

  const guardarTemporal = async ({ mostrarMensaje = true } = {}) => {
    if (consentimientoGuardado?.id_consentimiento) {
      if (mostrarMensaje) {
        mostrarAlerta({
          icon: 'info',
          title: 'Consentimiento ya guardado',
          text: 'Este consentimiento ya fue guardado. Puedes imprimirlo o cerrar el modal.',
        });
      }

      return consentimientoGuardado;
    }

    if (!validar()) return null;

    try {
      setGuardando(true);

      const payload = {
        id_expediente: obtenerIdExpediente(),
        id_fila: obtenerIdFila(),
        id_sucursal: obtenerIdSucursal(),

        fecha_consentimiento: form.fecha,
        hora_consentimiento: form.hora || null,

        nombre_paciente: nombrePaciente || form.nombre_responsable,
        curp: expediente?.curp || null,
        edad: paciente?.edad || expediente?.edad || null,
        sexo: paciente?.sexo || expediente?.sexo || null,
        fecha_nacimiento: expediente?.fecha_nacimiento
          ? String(expediente.fecha_nacimiento).slice(0, 10)
          : null,

        domicilio:
          form.domicilio ||
          expediente?.direccion ||
          expediente?.domicilio ||
          paciente?.direccion ||
          paciente?.domicilio ||
          null,
        telefono: paciente?.telefono || expediente?.telefono || null,
        municipio:
          form.municipio ||
          expediente?.municipio ||
          expediente?.municipio_nombre ||
          expediente?.nombre_municipio ||
          expediente?.municipio_residencia ||
          paciente?.municipio ||
          paciente?.municipio_nombre ||
          paciente?.nombre_municipio ||
          null,

        nombre_responsable: form.nombre_responsable,
        parentesco_responsable: form.caracter,
        domicilio_responsable: form.domicilio,
        telefono_responsable: paciente?.telefono || expediente?.telefono || null,

        diagnostico: form.diagnostico,
        procedimiento_tratamiento: form.tratamiento,
        riesgos_frecuentes: form.riesgos,
        beneficios: form.beneficios,
        alternativas: form.alternativas,
        observaciones: form.observaciones || form.padecimiento,

        autoriza_atencion: true,
        motivo_consentimiento: form.padecimiento,

        nombre_testigo: form.nombre_testigo,
        parentesco_testigo: form.parentesco_testigo,

        medico_responsable: perfilDoctor?.nombre_completo || 'Doctor Shaddai',
        cedula_profesional: perfilDoctor?.cedula_profesional || null,
      };

      const data = await consentimientosService.crearConsentimiento(payload);

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo guardar el consentimiento.');
      }

      const consentimiento = data.consentimiento || null;

      setConsentimientoGuardado(consentimiento);
      setVistaPrevia(true);

      if (mostrarMensaje) {
        mostrarAlerta({
          icon: 'success',
          title: 'Consentimiento guardado',
          text: 'El consentimiento informado quedó guardado correctamente.',
          timer: 1500,
          showConfirmButton: false,
        });
      }

      return consentimiento;
    } catch (error) {
      console.error('Error al guardar consentimiento informado:', error);

      mostrarAlerta({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo guardar el consentimiento informado.',
      });

      return null;
    } finally {
      setGuardando(false);
    }
  };



  return (
    <>
      <style>
        {`
          .swal-consentimiento-container {
            z-index: 30000 !important;
          }

          .swal-consentimiento-popup {
            z-index: 30001 !important;
          }
        `}
      </style>

      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
        <div className="max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                <FileSignature size={24} />
              </div>

              <div>
                <h2 className="text-xl font-black text-slate-800">
                  Consentimiento informado
                </h2>
                <p className="text-sm text-slate-500">
                  Llena los datos para generar la carta de consentimiento.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              <X size={20} />
            </button>
          </div>

          <div className="grid max-h-[calc(94vh-73px)] overflow-y-auto lg:grid-cols-[0.95fr_1.05fr]">
            <form className="space-y-4 border-r border-slate-100 p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <CampoTexto
                  label="Fecha"
                  type="date"
                  name="fecha"
                  value={form.fecha}
                  onChange={handleChange}
                />

                <CampoTexto
                  label="Hora"
                  type="time"
                  name="hora"
                  value={form.hora}
                  onChange={handleChange}
                />

                <CampoTexto
                  label="Carácter"
                  name="caracter"
                  value={form.caracter}
                  onChange={handleChange}
                  placeholder="Paciente / padre / tutor / responsable"
                />

                <CampoTexto
                  label="Paciente o responsable *"
                  name="nombre_responsable"
                  value={form.nombre_responsable}
                  onChange={handleChange}
                  placeholder="Nombre completo"
                />

                <CampoTexto
                  label="Municipio"
                  name="municipio"
                  value={form.municipio}
                  onChange={handleChange}
                  placeholder="Ej. Pachuca, Hidalgo"
                />

                <div className="md:col-span-2">
                  <CampoTexto
                    label="Domicilio"
                    name="domicilio"
                    value={form.domicilio}
                    onChange={handleChange}
                    placeholder="Domicilio completo"
                  />
                </div>

                <div className="md:col-span-2">
                  <CampoArea
                    label="Padecimiento"
                    name="padecimiento"
                    value={form.padecimiento}
                    onChange={handleChange}
                    placeholder="Ej. Diabetes mellitus, hipertensión, infección..."
                  />
                </div>

                <div className="md:col-span-2">
                  <CampoArea
                    label="Diagnóstico(s) *"
                    name="diagnostico"
                    value={form.diagnostico}
                    onChange={handleChange}
                    placeholder="Diagnóstico o motivo clínico"
                  />
                </div>

                <div className="md:col-span-2">
                  <CampoArea
                    label="Tratamiento(s) / procedimiento(s) *"
                    name="tratamiento"
                    value={form.tratamiento}
                    onChange={handleChange}
                    placeholder="Tratamiento, procedimiento, estudios o atención autorizada"
                  />
                </div>

                <div className="md:col-span-2">
                  <CampoArea
                    label="Riesgos frecuentes"
                    name="riesgos"
                    value={form.riesgos}
                    onChange={handleChange}
                    placeholder="Riesgos o posibles complicaciones"
                  />
                </div>

                <div className="md:col-span-2">
                  <CampoArea
                    label="Beneficios"
                    name="beneficios"
                    value={form.beneficios}
                    onChange={handleChange}
                    placeholder="Beneficios esperados de la atención"
                  />
                </div>

                <div className="md:col-span-2">
                  <CampoArea
                    label="Alternativas"
                    name="alternativas"
                    value={form.alternativas}
                    onChange={handleChange}
                    placeholder="Alternativas disponibles o indicaciones"
                  />
                </div>

                <div className="md:col-span-2">
                  <CampoArea
                    label="Observaciones"
                    name="observaciones"
                    value={form.observaciones}
                    onChange={handleChange}
                    placeholder="Observaciones adicionales"
                  />
                </div>

                <CampoTexto
                  label="Nombre del testigo"
                  name="nombre_testigo"
                  value={form.nombre_testigo}
                  onChange={handleChange}
                  placeholder="Opcional"
                />

                <CampoTexto
                  label="Parentesco del testigo"
                  name="parentesco_testigo"
                  value={form.parentesco_testigo}
                  onChange={handleChange}
                  placeholder="Opcional"
                />
              </div>

              <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={guardarTemporal}
                  disabled={guardando}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                >
                  {guardando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {consentimientoGuardado?.id_consentimiento
                    ? `Guardado #${consentimientoGuardado.id_consentimiento}`
                    : 'Guardar consentimiento'}
                </button>

                <button
                  type="button"
                  onClick={imprimir}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-bold text-white hover:bg-sky-800"
                >
                  <Printer size={18} />
                  Guardar e imprimir
                </button>
              </div>
            </form>

            <div className="bg-slate-100 p-5">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-black text-slate-700">
                  Vista previa
                </p>

                <button
                  type="button"
                  onClick={() => setVistaPrevia(true)}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                >
                  Actualizar vista
                </button>
              </div>

              <div className="max-h-[76vh] overflow-y-auto rounded-2xl bg-white p-4 shadow-sm">
                <ConsentimientoInformadoImprimible
                  expediente={expediente}
                  paciente={paciente}
                  perfilDoctor={perfilDoctor}
                  datos={{
                    ...form,
                    id_consentimiento: consentimientoGuardado?.id_consentimiento || null,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function CampoTexto({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = 'text',
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}

function CampoArea({
  label,
  name,
  value,
  onChange,
  placeholder,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
      />
    </div>
  );
}