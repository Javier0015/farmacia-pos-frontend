import logoFarmacia from '../../assets/logoShaddai.png';

const TIPO_NOTA_INFO = {
  NOTA_INICIAL: {
    label: 'Nota médica inicial',
    shortLabel: 'Inicial',
  },
  NOTA_EVOLUCION: {
    label: 'Nota de evolución',
    shortLabel: 'Evolución',
  },
};

const formatearFecha = (fecha) => {
  if (!fecha) return 'N/A';

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) return 'N/A';

  return valor.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
};

const formatearHora = (fecha) => {
  if (!fecha) return '';

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) return '';

  return valor.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const obtenerTipoNota = (tipoNota) => {
  const tipo = String(tipoNota || 'NOTA_INICIAL').trim().toUpperCase();

  return TIPO_NOTA_INFO[tipo] || TIPO_NOTA_INFO.NOTA_INICIAL;
};

const obtenerNombrePaciente = (nota = {}) => {
  const partes = [
    nota.nombre_paciente,
    nota.primer_apellido,
    nota.segundo_apellido,
  ].filter(Boolean);

  return partes.length ? partes.join(' ') : 'Paciente no especificado';
};

const obtenerNombreDoctor = (nota = {}, perfilDoctor = {}) => {
  return (
    nota.doctor_nombre_completo ||
    perfilDoctor?.nombre_completo ||
    nota.doctor_usuario ||
    'Doctor Shaddai'
  );
};

const obtenerCedulaDoctor = (nota = {}, perfilDoctor = {}) => {
  return nota.cedula_profesional || perfilDoctor?.cedula_profesional || 'N/A';
};

const obtenerEspecialidadDoctor = (nota = {}, perfilDoctor = {}) => {
  return nota.especialidad || perfilDoctor?.especialidad || 'N/A';
};

const obtenerTelefonoDoctor = (nota = {}, perfilDoctor = {}) => {
  return (
    nota.doctor_telefono ||
    nota.telefono_doctor ||
    perfilDoctor?.telefono ||
    perfilDoctor?.doctor_telefono ||
    'N/A'
  );
};

const limpiarValor = (valor) => {
  if (valor === undefined || valor === null || valor === '') return 'N/A';
  return valor;
};

const DatoLinea = ({ label, value }) => (
  <div className="min-w-0 leading-tight">
    <span className="font-black text-slate-700">{label}: </span>
    <span className="text-slate-900">{limpiarValor(value)}</span>
  </div>
);

const SignoVital = ({ label, value }) => (
  <div className="border-r border-slate-300 px-1 py-0.5 text-center last:border-r-0">
    <p className="text-[8px] font-black uppercase leading-none text-slate-500">
      {label}
    </p>
    <p className="mt-0.5 text-[11px] font-bold leading-tight text-slate-900">
      {limpiarValor(value)}
    </p>
  </div>
);

const BloqueTextoCompacto = ({ titulo, contenido }) => (
  <section className="nota-bloque border border-slate-300">
    <div className="nota-bloque-titulo border-b border-slate-300 bg-slate-100 px-2 py-0.5">
      <h3 className="text-[9px] font-black uppercase tracking-wide text-slate-700">
        {titulo}
      </h3>
    </div>

    <div className="nota-bloque-contenido whitespace-pre-wrap break-words px-2 py-1 text-[11px] leading-tight text-slate-900">
      {contenido || 'Sin registro.'}
    </div>
  </section>
);

export default function NotaMedicaImprimible({
  nota,
  expediente,
  perfilDoctor,
  farmaciaNombre = 'Farmacia Shaddai',
}) {
  const notaFinal = {
    ...(expediente || {}),
    ...(nota || {}),
  };

  const fechaNota =
    notaFinal.fecha_nota ||
    notaFinal.fecha_creacion ||
    new Date().toISOString();

  const tipoNota = obtenerTipoNota(notaFinal.tipo_nota);

  const nombrePaciente = obtenerNombrePaciente(notaFinal);
  const nombreDoctor = obtenerNombreDoctor(notaFinal, perfilDoctor);
  const cedulaDoctor = obtenerCedulaDoctor(notaFinal, perfilDoctor);
  const especialidadDoctor = obtenerEspecialidadDoctor(notaFinal, perfilDoctor);

  const telefonoDoctor = obtenerTelefonoDoctor(notaFinal, perfilDoctor);

  const expedienteId =
    notaFinal.id_expediente ||
    expediente?.id_expediente ||
    'N/A';

  const folioNota = notaFinal.id_nota
    ? `NM-${notaFinal.id_nota}`
    : 'Vista previa';

  return (
    <>
      <style>
        {`
    @media print {
      @page {
        size: letter portrait;
        margin: 0;
      }

      html,
      body {
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
        background: #ffffff !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      body {
        padding: 6mm !important;
      }

      body * {
        visibility: hidden !important;
      }

      #nota-medica-imprimible,
      #nota-medica-imprimible * {
        visibility: visible !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      #nota-medica-imprimible {
        position: static !important;
        display: block !important;
        width: 100% !important;
        max-width: 204mm !important;
        margin: 0 auto !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #0f172a !important;
        overflow: visible !important;
      }

      #nota-medica-imprimible .nota-hoja {
        width: 100% !important;
        max-width: 204mm !important;
        min-height: auto !important;
        margin: 0 auto !important;
        padding: 6mm 7mm !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background: #ffffff !important;
        overflow: visible !important;
      }

      #nota-medica-imprimible header {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      #nota-medica-imprimible footer {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      #nota-medica-imprimible section {
        page-break-inside: auto !important;
        break-inside: auto !important;
      }

      #nota-medica-imprimible .nota-bloque {
        page-break-inside: auto !important;
        break-inside: auto !important;
      }

      #nota-medica-imprimible .nota-bloque-titulo {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }

      #nota-medica-imprimible .nota-bloque-contenido {
        page-break-before: avoid !important;
        break-before: avoid !important;
        overflow: visible !important;
        max-height: none !important;
      }

      #nota-medica-imprimible p,
      #nota-medica-imprimible div,
      #nota-medica-imprimible span {
        overflow-wrap: anywhere !important;
      }

      #nota-medica-imprimible img {
        print-color-adjust: exact !important;
        -webkit-print-color-adjust: exact !important;
      }

      .no-print {
        display: none !important;
      }
    }
  `}
      </style>
      <div
        id="nota-medica-imprimible"
        className="mx-auto w-full max-w-5xl bg-white text-slate-900 print:max-w-none"
      >
        <div className="nota-hoja rounded-2xl border border-slate-300 bg-white p-4 shadow-sm print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <header className="mb-2 border-b-2 border-sky-700 pb-1.5">
            <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                <img
                  src={logoFarmacia}
                  alt="Logo"
                  className="h-full w-full object-contain p-1"
                />
              </div>

              <div className="min-w-0">
                <h1 className="text-base font-black uppercase leading-tight tracking-wide text-sky-800">
                  {tipoNota.label}
                </h1>

                <p className="text-xs font-black leading-tight text-slate-900">
                  {farmaciaNombre}
                </p>

                <p className="text-[10px] font-semibold leading-tight text-slate-500">
                  Expediente clínico / Atención médica
                </p>
              </div>

              <div className="text-right text-[10px] leading-tight">
                <p>
                  <span className="font-black text-slate-600">Folio:</span>{' '}
                  <span className="font-black text-slate-900">{folioNota}</span>
                </p>

                <p>
                  <span className="font-black text-slate-600">Exp:</span>{' '}
                  <span className="font-bold text-slate-900">#{expedienteId}</span>
                </p>

                <p>
                  <span className="font-black text-slate-600">Tipo:</span>{' '}
                  <span className="font-bold text-sky-700">{tipoNota.shortLabel}</span>
                </p>

                <p className="mt-0.5 font-bold text-slate-800">
                  {formatearFecha(fechaNota)}
                </p>

                {formatearHora(fechaNota) && (
                  <p className="font-bold text-slate-800">
                    {formatearHora(fechaNota)}
                  </p>
                )}
              </div>
            </div>
          </header>

          <section className="mb-1.5 border border-slate-300">
            <div className="border-b border-slate-300 bg-slate-100 px-2 py-0.5">
              <h2 className="text-[9px] font-black uppercase tracking-wide text-slate-700">
                Datos del paciente
              </h2>
            </div>

            <div className="grid gap-x-3 gap-y-0.5 px-2 py-1 text-[11px] leading-tight md:grid-cols-3">
              <DatoLinea label="Paciente" value={nombrePaciente} />
              <DatoLinea label="CURP" value={notaFinal.curp} />
              <DatoLinea label="Edad" value={notaFinal.edad} />
              <DatoLinea label="Sexo" value={notaFinal.sexo} />
              <DatoLinea label="Teléfono" value={notaFinal.telefono} />
              <DatoLinea
                label="Fecha nac."
                value={
                  notaFinal.fecha_nacimiento
                    ? formatearFecha(notaFinal.fecha_nacimiento)
                    : null
                }
              />
              {/*
             
             <DatoLinea label="Sucursal" value={notaFinal.sucursal_nombre} />
              <DatoLinea
                label="Atención"
                value={notaFinal.id_fila ? `#${notaFinal.id_fila}` : 'N/A'}
              />
              <DatoLinea label="Nota" value={tipoNota.label} />
             */}
            </div>
          </section>

          <section className="mb-1.5 border border-slate-300">
            <div className="border-b border-slate-300 bg-slate-100 px-2 py-0.5">
              <h2 className="text-[9px] font-black uppercase tracking-wide text-slate-700">
                Signos vitales
              </h2>
            </div>

            <div className="grid grid-cols-7 divide-x divide-slate-300 text-center">
              <SignoVital
                label="Peso"
                value={notaFinal.peso_kg ? `${notaFinal.peso_kg} kg` : null}
              />
              <SignoVital
                label="Talla"
                value={notaFinal.talla_cm ? `${notaFinal.talla_cm} cm` : null}
              />
              <SignoVital label="IMC" value={notaFinal.imc} />
              <SignoVital label="TA" value={notaFinal.presion_arterial} />
              <SignoVital
                label="FC"
                value={
                  notaFinal.frecuencia_cardiaca
                    ? `${notaFinal.frecuencia_cardiaca} lpm`
                    : null
                }
              />
              <SignoVital
                label="Temp."
                value={notaFinal.temperatura ? `${notaFinal.temperatura} °C` : null}
              />
              <SignoVital
                label="Sat. O₂"
                value={
                  notaFinal.saturacion_oxigeno
                    ? `${notaFinal.saturacion_oxigeno}%`
                    : null
                }
              />
            </div>
          </section>

          <section className="mb-1.5 grid gap-1.5 md:grid-cols-2">
            <section className="border border-slate-300">
              <div className="border-b border-slate-300 bg-slate-100 px-2 py-0.5">
                <h3 className="text-[9px] font-black uppercase tracking-wide text-slate-700">
                  Motivo de consulta
                </h3>
              </div>

              <div className="min-h-[20px] whitespace-pre-wrap break-words px-2 py-1 text-[11px] leading-tight text-slate-900">
                {notaFinal.motivo_consulta || 'Sin registro.'}
              </div>
            </section>

            <section className="border border-slate-300">
              <div className="border-b border-slate-300 bg-slate-100 px-2 py-0.5">
                <h3 className="text-[9px] font-black uppercase tracking-wide text-slate-700">
                  Diagnóstico
                </h3>
              </div>

              <div className="min-h-[20px] whitespace-pre-wrap break-words px-2 py-1 text-[11px] leading-tight text-slate-900">
                {notaFinal.diagnostico || 'Sin registro.'}
              </div>
            </section>
          </section>

          <section className="space-y-1.5">
            <BloqueTextoCompacto
              titulo={
                tipoNota.shortLabel === 'Evolución'
                  ? 'Evolución / padecimiento actual'
                  : 'Antecedentes y padecimiento actual'
              }
              contenido={notaFinal.antecedentes_padecimiento_actual}
            />

            <BloqueTextoCompacto
              titulo="Exploración física"
              contenido={notaFinal.exploracion_fisica}
            />

            <BloqueTextoCompacto
              titulo="Plan"
              contenido={notaFinal.plan}
            />

            <div className="grid gap-1.5 md:grid-cols-2">
              <BloqueTextoCompacto
                titulo="Pronóstico"
                contenido={notaFinal.pronostico}
              />

              <BloqueTextoCompacto
                titulo="Pasa a / seguimiento"
                contenido={notaFinal.pasa_a}
              />
            </div>

            <BloqueTextoCompacto
              titulo="Observaciones"
              contenido={notaFinal.observaciones}
            />
          </section>

          <footer className="mt-3 grid grid-cols-[1fr_230px] gap-5 border-t border-slate-300 pt-2.5">
            <div className="text-[11px] leading-tight">
              <p className="font-black uppercase tracking-wide text-slate-500">
                Médico que elaboró
              </p>

              <p className="mt-0.5 text-xs font-black text-slate-900">
                {nombreDoctor}
              </p>

              <p className="font-semibold text-slate-700">
                Especialidad: {especialidadDoctor}
              </p>

              <p className="font-semibold text-slate-700">
                Cédula profesional: {cedulaDoctor}
              </p>
              <p className="font-semibold text-slate-700">
                Teléfono: {telefonoDoctor}
              </p>
            </div>

            <div className="flex flex-col justify-end">
              <div className="border-t border-slate-900 pt-1 text-center">
                <p className="text-[11px] font-black text-slate-800">
                  Firma del médico
                </p>
              </div>
            </div>
          </footer>

          {/* 
         <p className="mt-1.5 text-center text-[8px] leading-tight text-slate-400">
            Documento generado electrónicamente para control interno del expediente clínico.
          </p>
         */}
        </div>
      </div>
    </>
  );
}