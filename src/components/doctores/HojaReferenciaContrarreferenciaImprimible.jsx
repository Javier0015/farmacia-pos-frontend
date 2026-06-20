import logoFarmacia from '../../assets/logoShaddai.png';

const OPCIONES = {
  sexo: {
    HOMBRE: 'Hombre',
    MUJER: 'Mujer',
    MASCULINO: 'Hombre',
    FEMENINO: 'Mujer',
    INTERSEXUAL: 'Intersexual',
    NO_ESPECIFICADO: 'No especificado',
  },
  si_no: {
    SI: 'Sí',
    NO: 'No',
  },
  motivo_referencia: {
    SIN_ESPECIALISTA: 'No se cuenta con médico especialista en turno',
    SIN_INFRAESTRUCTURA: 'No se cuenta con infraestructura para atender padecimiento',
    HOSPITAL_SATURADO: 'Hospital saturado',
    TERCER_NIVEL: 'Requiere atención de 3er nivel',
    REGIONALIZACION: 'Por regionalización operativa',
    DERECHOHABIENCIA: 'Derechohabiencia a IMSS/ISSSTE/PEMEX/SEDENA',
    CONSULTA_EXTERNA: 'Consulta externa y/o especialidad/subespecialidad',
    VALORACION_MEDICA: 'Valoración médica',
  },
  motivo_contrarreferencia: {
    ALTA_MEDICA: 'Alta médica',
    REFERENCIA: 'Referencia',
    SEGUIMIENTO: 'Seguimiento',
    MEJORIA: 'Mejoría',
  },
};

const pares = (catalogo) =>
  Object.entries(catalogo || {}).map(([value, label]) => ({ value, label }));

const valor = (v) => {
  if (v === undefined || v === null || v === '') return '';
  return v;
};

const textoCatalogo = (catalogo, v) => {
  if (!v) return '';
  return OPCIONES[catalogo]?.[v] || v;
};

const formatearFecha = (fecha) => {
  if (!fecha) return '';

  const d = new Date(fecha);
  if (Number.isNaN(d.getTime())) return fecha;

  return d.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const nombrePacienteCompleto = (expediente = {}, paciente = {}, datos = {}) => {
  const partes = [
    datos.nombre_paciente || expediente.nombre_paciente || paciente.nombre_paciente,
    datos.primer_apellido || expediente.primer_apellido,
    datos.segundo_apellido || expediente.segundo_apellido,
  ].filter(Boolean);

  return partes.length ? partes.join(' ') : '';
};

const nombreResponsable = (perfilDoctor = {}, datos = {}) => {
  return (
    datos.medico_refiere ||
    datos.responsable_nombre ||
    perfilDoctor?.nombre_completo ||
    ''
  );
};

const cedulaResponsable = (perfilDoctor = {}, datos = {}) => {
  return datos.cedula_profesional || perfilDoctor?.cedula_profesional || '';
};

const Check = ({ label, checked }) => (
  <span className="rr-check">
    <span className="rr-check-box">{checked ? 'X' : ''}</span>
    <span>{label}</span>
  </span>
);

const GrupoChecks = ({ titulo, opciones = [], selected, cols = 2 }) => {
  const selectedArray = Array.isArray(selected) ? selected : selected ? [selected] : [];

  return (
    <div className="rr-box">
      <div className="rr-box-title">{titulo}</div>
      <div
        className="rr-check-grid"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {opciones.map((opcion) => (
          <Check
            key={opcion.value}
            label={opcion.label}
            checked={selectedArray.includes(opcion.value)}
          />
        ))}
      </div>
    </div>
  );
};

const Field = ({ label, value, span = 1 }) => (
  <div className="rr-field" style={{ gridColumn: `span ${span}` }}>
    <span className="rr-label">{label}: </span>
    <span>{valor(value)}</span>
  </div>
);

const Texto = ({ titulo, value, height = 82, className = '' }) => (
  <div className={`rr-box rr-text-box ${className}`}>
    <div className="rr-box-title">{titulo}</div>
    <div className="rr-text-lines" style={{ minHeight: height }}>
      {value ? <span>{value}</span> : null}
    </div>
  </div>
);

function HojaReferencia({ datos = {}, expediente, paciente, perfilDoctor }) {
  const pacienteNombre = nombrePacienteCompleto(expediente, paciente, datos);
  const medico = nombreResponsable(perfilDoctor, datos);
  const cedula = cedulaResponsable(perfilDoctor, datos);

  return (
    <div className="rr-sheet">
      <div className="rr-sheet-content">
        <header className="rr-header">
          <img src={logoFarmacia} alt="Logo" className="rr-logo" />

          <div className="rr-header-center">
            <div className="rr-institution">Farmacia Shaddai</div>
            <div className="rr-title">Formato de referencia y contrarreferencia</div>
            <div className="rr-subtitle">Hoja de referencia</div>
          </div>

          <div className="rr-meta">
            <div><strong>Núm. control:</strong> {valor(datos.numero_control)}</div>
            <div><strong>Folio aceptación:</strong> {valor(datos.folio_aceptacion)}</div>
            <div><strong>Exp:</strong> #{valor(expediente?.id_expediente)}</div>
          </div>
        </header>

        <section className="rr-box">
          <div className="rr-box-title">Datos de referencia</div>
          <div className="rr-grid rr-grid-4">
            <Field label="Fecha de referencia" value={formatearFecha(datos.fecha_referencia)} />
            <Field label="Expediente" value={datos.expediente || expediente?.id_expediente} />
            <Field label="Atención" value={datos.atencion} />
            <Field label="Médica urgente" value={textoCatalogo('si_no', datos.medica_urgente)} />
            <Field label="Unidad médica que refiere" value={datos.unidad_refiere} span={2} />
            <Field label="Hospital / unidad" value={datos.hospital_refiere} span={2} />
          </div>
        </section>

        <section className="rr-box">
          <div className="rr-box-title">Datos del paciente</div>
          <div className="rr-grid rr-grid-4">
            <Field label="Nombre del paciente" value={pacienteNombre} span={2} />
            <Field label="Sexo" value={textoCatalogo('sexo', datos.sexo || expediente?.sexo || paciente?.sexo)} />
            <Field label="Edad" value={datos.edad || expediente?.edad || paciente?.edad} />

            <Field label="Fecha nacimiento" value={formatearFecha(datos.fecha_nacimiento || expediente?.fecha_nacimiento)} />
            <Field label="Urgencia" value={textoCatalogo('si_no', datos.urgencia)} />
            <Field label="Teléfono" value={datos.telefono || expediente?.telefono || paciente?.telefono} />
            <Field label="Domicilio" value={datos.domicilio || expediente?.direccion} />

            <Field label="Municipio" value={datos.municipio} />
            <Field label="Estado" value={datos.estado} />
            <Field label="Colonia" value={datos.colonia} />
            <Field label="Número ext." value={datos.numero_exterior} />
          </div>
        </section>

        <section className="rr-box">
          <div className="rr-box-title">Unidad destino</div>
          <div className="rr-grid rr-grid-3">
            <Field label="Unidad a la que se refiere" value={datos.unidad_destino} />
            <Field label="Servicio al que se envía" value={datos.servicio_destino} />
            <Field label="Especialidad" value={datos.especialidad_destino} />
          </div>
        </section>

        <section className="rr-box">
          <div className="rr-box-title">Somatometría y signos vitales</div>
          <div className="rr-grid rr-grid-8">
            <Field label="T/A" value={datos.ta} />
            <Field label="Temp." value={datos.temperatura} />
            <Field label="F.C." value={datos.frecuencia_cardiaca} />
            <Field label="F.R." value={datos.frecuencia_respiratoria} />
            <Field label="Peso" value={datos.peso} />
            <Field label="Talla" value={datos.talla} />
            <Field label="IMC" value={datos.imc} />
            <Field label="SpO2" value={datos.spo2} />
          </div>
        </section>

        <GrupoChecks
          titulo="Motivo de referencia"
          opciones={pares(OPCIONES.motivo_referencia)}
          selected={datos.motivos_referencia}
          cols={2}
        />

        <div className="rr-fill-space">
          <Texto
            titulo="Diagnóstico presuncional"
            value={datos.diagnostico_presuncional}
            height={48}
            className="rr-diagnostico"
          />

          <Texto
            titulo="Resumen clínico"
            value={datos.resumen_clinico}
            height={220}
            className="rr-resumen rr-grow"
          />

          <Texto
            titulo="Tratamiento"
            value={datos.tratamiento}
            height={110}
            className="rr-tratamiento"
          />
        </div>

        <footer className="rr-footer">
          <div className="rr-sign">
            <div className="rr-line" />
            <div>Nombre y firma de paciente o familiar</div>
          </div>

          <div className="rr-sign">
            <div className="rr-line" />
            <div>Nombre, firma y cédula profesional del médico tratante</div>
            <div className="rr-sign-small">{medico}</div>
            <div className="rr-sign-small">Cédula: {cedula}</div>
          </div>

          <div className="rr-seal">
            Sello de unidad
          </div>
        </footer>
      </div>
    </div>
  );
}

function HojaContrarreferencia({ datos = {}, expediente }) {
  return (
    <div className="rr-sheet rr-page-break rr-contrarreferencia">
      <div className="rr-sheet-content">
        <header className="rr-header">
          <img src={logoFarmacia} alt="Logo" className="rr-logo" />

          <div className="rr-header-center">
            <div className="rr-institution">Farmacia Shaddai</div>
            <div className="rr-title">Formato de referencia y contrarreferencia</div>
            <div className="rr-subtitle">Hoja de contrarreferencia</div>
          </div>

          <div className="rr-meta">
            <div><strong>Núm. control:</strong> {valor(datos.numero_control)}</div>
            <div><strong>Exp:</strong> #{valor(expediente?.id_expediente)}</div>
          </div>
        </header>

        <section className="rr-box">
          <div className="rr-box-title">Datos de contrarreferencia</div>
          <div className="rr-grid rr-grid-4">
            <Field label="Fecha ingreso" value="" />
            <Field label="Fecha egreso" value="" />
            <Field label="Atención" value="" />
            <Field label="Edad" value="" />
            <Field label="Unidad médica que contrarrefiere" value="" span={2} />
            <Field label="Unidad de salud a la que se contrarrefiere" value="" span={2} />
            <Field label="Nombre del paciente" value="" span={2} />
            <Field label="Sexo" value="" />
            <Field label="Fecha nacimiento" value="" />
          </div>
        </section>

        <section className="rr-grid rr-grid-2 rr-diagnosticos-contra">
          <Texto titulo="Diagnóstico de ingreso" value="" height={70} />
          <Texto titulo="Diagnóstico de egreso" value="" height={70} />
        </section>

        <section className="rr-box">
          <div className="rr-box-title">Servicio</div>
          <div className="rr-grid rr-grid-1">
            <Field label="Servicio" value="" />
          </div>
        </section>

        <GrupoChecks
          titulo="Motivo de contrarreferencia"
          opciones={pares(OPCIONES.motivo_contrarreferencia)}
          selected={[]}
          cols={4}
        />

        <div className="rr-fill-space">
          <Texto
            titulo="Resumen clínico / evolución, estado actual, estudios realizados y tratamiento médico y/o quirúrgico"
            value=""
            height={300}
            className="rr-resumen rr-grow"
          />

          <Texto
            titulo="Indicaciones y recomendaciones para el manejo del paciente en la unidad de adscripción"
            value=""
            height={150}
            className="rr-indicaciones"
          />
        </div>

        <section className="rr-box rr-justificada">
          <div className="rr-box-title">Contrarreferencia justificada</div>
          <div className="rr-check-grid" style={{ gridTemplateColumns: 'repeat(2, 120px)' }}>
            <Check label="Sí" checked={false} />
            <Check label="No" checked={false} />
          </div>
        </section>

        <footer className="rr-footer">
          <div className="rr-sign">
            <div className="rr-line" />
            <div>Nombre, firma y cédula profesional del médico tratante</div>
          </div>

          <div className="rr-sign">
            <div className="rr-line" />
            <div>Nombre y firma del paciente y familiar responsable</div>
          </div>

          <div className="rr-seal">
            Sello de unidad
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function HojaReferenciaContrarreferenciaImprimible({
  datos,
  expediente,
  paciente,
  perfilDoctor,
  tipo = 'referencia',
}) {
  const imprimirReferencia = tipo === 'referencia';
  const imprimirContrarreferencia = tipo === 'contrarreferencia';
  const imprimirAmbas = tipo === 'ambas';

  return (
    <>
      <style>
        {`
          #hoja-referencia-contrarreferencia {
            --rr-border: #1f2937;
            --rr-soft: #cbd5e1;
            --rr-head: #e5e7eb;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8px;
            line-height: 1.15;
            width: 100%;
            background: #ffffff;
          }

          #hoja-referencia-contrarreferencia,
          #hoja-referencia-contrarreferencia * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #hoja-referencia-contrarreferencia .rr-sheet {
            display: block !important;
            width: 204mm !important;
            max-width: 204mm !important;
            min-width: 204mm !important;
            height: 267mm !important;
            min-height: 267mm !important;
            margin: 0 auto !important;
            padding: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            background: #ffffff !important;
            transform: none !important;
            zoom: 1 !important;
            overflow: hidden !important;
            page-break-after: always !important;
            break-after: page !important;
          }

          #hoja-referencia-contrarreferencia .rr-sheet:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }

          #hoja-referencia-contrarreferencia .rr-sheet-content {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            height: 100% !important;
            min-height: 0 !important;
            padding: 5mm 5mm 4mm !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }

          #hoja-referencia-contrarreferencia .rr-header {
            display: grid;
            grid-template-columns: 62px 1fr 120px;
            align-items: center;
            gap: 8px;
            margin-bottom: 5px;
            padding-bottom: 4px;
            border-bottom: 2px solid var(--rr-border);
            flex: 0 0 auto;
          }

          #hoja-referencia-contrarreferencia .rr-logo {
            width: 50px;
            height: 42px;
            object-fit: contain;
          }

          #hoja-referencia-contrarreferencia .rr-header-center {
            text-align: center;
            text-transform: uppercase;
            font-weight: 900;
          }

          #hoja-referencia-contrarreferencia .rr-institution {
            font-size: 8px;
            letter-spacing: .03em;
          }

          #hoja-referencia-contrarreferencia .rr-title {
            font-size: 10px;
            line-height: 1.08;
          }

          #hoja-referencia-contrarreferencia .rr-subtitle {
            margin-top: 5px;
            font-size: 9px;
            background: var(--rr-head);
            border: 1px solid var(--rr-soft);
            padding: 2px;
          }

          #hoja-referencia-contrarreferencia .rr-meta {
            text-align: right;
            font-size: 7px;
            line-height: 1.2;
          }

          #hoja-referencia-contrarreferencia .rr-box {
            border: 1px solid var(--rr-border);
            margin-bottom: 4px;
            break-inside: avoid;
            page-break-inside: avoid;
            flex: 0 0 auto;
          }

          #hoja-referencia-contrarreferencia .rr-fill-space {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }

          #hoja-referencia-contrarreferencia .rr-fill-space .rr-box:last-child {
            margin-bottom: 0;
          }

          #hoja-referencia-contrarreferencia .rr-text-box {
            display: flex;
            flex-direction: column;
          }

          #hoja-referencia-contrarreferencia .rr-grow {
            flex: 1 1 auto;
            min-height: 0;
          }

          #hoja-referencia-contrarreferencia .rr-grow .rr-text-lines {
            flex: 1 1 auto;
            min-height: 0 !important;
          }

          #hoja-referencia-contrarreferencia .rr-resumen .rr-text-lines {
            min-height: 0 !important;
          }

          #hoja-referencia-contrarreferencia .rr-box-title {
            background: var(--rr-head);
            border-bottom: 1px solid var(--rr-border);
            padding: 2px 4px;
            font-size: 7.6px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: .03em;
            flex: 0 0 auto;
          }

          #hoja-referencia-contrarreferencia .rr-grid {
            display: grid;
            gap: 0 5px;
            padding: 3px 4px;
          }

          #hoja-referencia-contrarreferencia .rr-grid-1 {
            grid-template-columns: 1fr;
          }

          #hoja-referencia-contrarreferencia .rr-grid-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 5px;
            padding: 0;
          }

          #hoja-referencia-contrarreferencia .rr-grid-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }

          #hoja-referencia-contrarreferencia .rr-grid-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }

          #hoja-referencia-contrarreferencia .rr-grid-8 {
            grid-template-columns: repeat(8, minmax(0, 1fr));
          }

          #hoja-referencia-contrarreferencia .rr-diagnosticos-contra {
            margin-bottom: 4px;
            flex: 0 0 auto;
          }

          #hoja-referencia-contrarreferencia .rr-diagnosticos-contra .rr-box {
            margin-bottom: 0;
          }

          #hoja-referencia-contrarreferencia .rr-field {
            min-width: 0;
            border-bottom: 1px solid var(--rr-soft);
            padding: 1px 0;
            overflow-wrap: anywhere;
          }

          #hoja-referencia-contrarreferencia .rr-label {
            font-weight: 900;
          }

          #hoja-referencia-contrarreferencia .rr-check-grid {
            display: grid;
            gap: 2px 8px;
            padding: 4px;
          }

          #hoja-referencia-contrarreferencia .rr-check {
            display: inline-flex;
            align-items: flex-start;
            gap: 4px;
            min-width: 0;
            font-size: 7.6px;
            line-height: 1.08;
          }

          #hoja-referencia-contrarreferencia .rr-check-box {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            flex: 0 0 auto;
            width: 9px;
            height: 9px;
            border: 1px solid var(--rr-border);
            font-size: 6px;
            font-weight: 900;
            line-height: 1;
          }

          #hoja-referencia-contrarreferencia .rr-text-lines {
            padding: 4px;
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            overflow: hidden;
            background-image: repeating-linear-gradient(
              to bottom,
              transparent 0,
              transparent 15px,
              #d1d5db 16px
            );
          }

          #hoja-referencia-contrarreferencia .rr-footer {
            display: grid;
            grid-template-columns: 1fr 1fr 130px;
            gap: 10px;
            margin-top: 6px !important;
            align-items: end;
            flex: 0 0 auto;
          }

          #hoja-referencia-contrarreferencia .rr-sign {
            text-align: center;
            font-size: 7.2px;
          }

          #hoja-referencia-contrarreferencia .rr-line {
            border-top: 1px solid var(--rr-border);
            height: 32px;
          }

          #hoja-referencia-contrarreferencia .rr-sign-small {
            font-size: 6.8px;
            line-height: 1.12;
          }

          #hoja-referencia-contrarreferencia .rr-seal {
            height: 58px;
            border: 1px solid var(--rr-soft);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 7px;
            color: #64748b;
          }

          #hoja-referencia-contrarreferencia .rr-page-break {
            page-break-before: always;
            break-before: page;
          }

          @media print {
            @page {
              size: letter portrait;
              margin: 6mm;
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

            #hoja-referencia-contrarreferencia {
              display: block !important;
              width: 100% !important;
              max-width: none !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              transform: none !important;
              zoom: 1 !important;
            }

            #hoja-referencia-contrarreferencia .rr-sheet {
              display: block !important;
              width: 204mm !important;
              max-width: 204mm !important;
              min-width: 204mm !important;
              height: 267mm !important;
              min-height: 267mm !important;
              margin: 0 auto !important;
              padding: 0 !important;
              border: 0 !important;
              box-shadow: none !important;
              background: #ffffff !important;
              overflow: hidden !important;
              page-break-after: always !important;
              break-after: page !important;
            }

            #hoja-referencia-contrarreferencia .rr-sheet:last-child {
              page-break-after: auto !important;
              break-after: auto !important;
            }

            #hoja-referencia-contrarreferencia .rr-sheet-content {
              display: flex !important;
              flex-direction: column !important;
              width: 100% !important;
              height: 100% !important;
              min-height: 0 !important;
              padding: 5mm 5mm 4mm !important;
              overflow: hidden !important;
            }

            #hoja-referencia-contrarreferencia .rr-page-break {
              page-break-before: always !important;
              break-before: page !important;
            }

            #hoja-referencia-contrarreferencia .rr-fill-space {
              flex: 1 1 auto !important;
              display: flex !important;
              flex-direction: column !important;
              min-height: 0 !important;
            }

            #hoja-referencia-contrarreferencia .rr-text-box {
              display: flex !important;
              flex-direction: column !important;
            }

            #hoja-referencia-contrarreferencia .rr-grow {
              flex: 1 1 auto !important;
              min-height: 0 !important;
            }

            #hoja-referencia-contrarreferencia .rr-grow .rr-text-lines {
              flex: 1 1 auto !important;
              min-height: 0 !important;
            }

            #hoja-referencia-contrarreferencia .rr-footer {
              margin-top: 6px !important;
            }

            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div id="hoja-referencia-contrarreferencia">
        {(imprimirReferencia || imprimirAmbas) && (
          <HojaReferencia
            datos={datos}
            expediente={expediente}
            paciente={paciente}
            perfilDoctor={perfilDoctor}
          />
        )}

        {(imprimirContrarreferencia || imprimirAmbas) && (
          <HojaContrarreferencia
            datos={datos}
            expediente={expediente}
          />
        )}
      </div>
    </>
  );
}
