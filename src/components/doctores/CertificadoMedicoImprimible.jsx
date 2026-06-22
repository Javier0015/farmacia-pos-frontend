import api from '../../api/axios';
import logoFarmacia from '../../assets/logoCompleto.jpeg';

const TIPOS_CERTIFICADO = {
  LABORAL: {
    badge: 'CERTIFICADO LABORAL',
  },
  ESCOLAR: {
    badge: 'CERTIFICADO ESCOLAR',
  },
  PRENUPCIAL: {
    badge: 'CERTIFICADO PRENUPCIAL',
  },
  PERSONALIZADO: {
    badge: 'CERTIFICADO MÉDICO',
  },
};

const formatearFechaLarga = (fecha) => {
  if (!fecha) return '';

  const valor = new Date(`${String(fecha).slice(0, 10)}T00:00:00`);

  if (Number.isNaN(valor.getTime())) return fecha;

  return valor.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatearFechaCorta = (fecha) => {
  if (!fecha) return '';

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) return fecha;

  return valor.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const obtenerUrlArchivo = (ruta) => {
  if (!ruta) return '';

  if (ruta.startsWith('http://') || ruta.startsWith('https://')) {
    return ruta;
  }

  const baseURL = api.defaults.baseURL || '';
  const baseSinApi = baseURL.replace(/\/api\/?$/, '');

  if (ruta.startsWith('/')) {
    return `${baseSinApi}${ruta}`;
  }

  return `${baseSinApi}/${ruta}`;
};

const primerTexto = (...valores) => {
  const encontrado = valores.find((valor) => {
    if (valor === undefined || valor === null) return false;
    return String(valor).trim() !== '';
  });

  return encontrado !== undefined && encontrado !== null
    ? String(encontrado).trim()
    : '';
};

const obtenerNombrePaciente = ({ certificado, expediente, paciente, nombrePaciente }) => {
  const datosPaciente = certificado?.datos_paciente || {};

  return primerTexto(
    nombrePaciente,
    datosPaciente.nombre_paciente,
    certificado?.nombre_paciente,
    [
      expediente?.nombre_paciente || paciente?.nombre_paciente,
      expediente?.primer_apellido,
      expediente?.segundo_apellido,
    ]
      .filter(Boolean)
      .join(' '),
    paciente?.nombre_paciente,
    'Paciente'
  );
};

export default function CertificadoMedicoImprimible({
  form = null,
  certificado = null,
  tipoInfo = null,
  expediente = null,
  paciente = null,
  perfilDoctor = null,
  nombrePaciente = '',
  edadPaciente = '',
  sexoPaciente = '',
  fechaNacimiento = '',
  logoUniversidadUrl = '',
}) {
  const datosPaciente = certificado?.datos_paciente || {};
  const datosDoctor = certificado?.datos_doctor || perfilDoctor || {};
  const datosBase = certificado || form || {};

  const tipoCertificado =
    datosBase.tipo_certificado ||
    form?.tipo_certificado ||
    'PERSONALIZADO';

  const badge =
    tipoInfo?.badge ||
    TIPOS_CERTIFICADO[tipoCertificado]?.badge ||
    'CERTIFICADO MÉDICO';

  const pacienteNombre = obtenerNombrePaciente({
    certificado,
    expediente,
    paciente,
    nombrePaciente,
  });

  const pacienteEdad = primerTexto(
    edadPaciente,
    datosPaciente.edad,
    certificado?.edad_paciente,
    expediente?.edad,
    paciente?.edad,
    'N/A'
  );

  const pacienteSexo = primerTexto(
    sexoPaciente,
    datosPaciente.sexo,
    certificado?.sexo_paciente,
    expediente?.sexo,
    paciente?.sexo,
    'No especificado'
  );

  const nacimiento = primerTexto(
    fechaNacimiento,
    datosPaciente.fecha_nacimiento,
    certificado?.fecha_nacimiento,
    expediente?.fecha_nacimiento,
    paciente?.fecha_nacimiento
  );

  const lugarExpedicion = primerTexto(
    datosBase.lugar_expedicion,
    'Pachuca Hidalgo'
  );

  const fechaExpedicion = primerTexto(
    datosBase.fecha_expedicion,
    datosBase.fecha_creacion,
    new Date().toISOString().slice(0, 10)
  );

  const destinatario = primerTexto(
    datosBase.destinatario,
    'A quien corresponda'
  );

  const estadoSalud = primerTexto(
    datosBase.estado_salud,
    'BUEN ESTADO DE SALUD ACTUAL'
  );

  const antecedentes = primerTexto(datosBase.antecedentes);
  const exploracionFisica = primerTexto(datosBase.exploracion_fisica);
  const conclusion = primerTexto(datosBase.conclusion);
  const textoLibre = primerTexto(datosBase.texto_libre);

  const folioCertificado = primerTexto(
    datosBase.folio_certificado,
    datosBase.folio,
    datosBase.id_certificado ? `CERT-${datosBase.id_certificado}` : ''
  );

  const logoUniversidadFinal = obtenerUrlArchivo(
    logoUniversidadUrl || datosDoctor.logo_universidad_url || ''
  );

  return (
    <div id="certificado-medico-imprimible" className="cert-wrapper">
      <style>
        {`
          .cert-wrapper,
          .cert-wrapper * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .cert-sheet {
            width: 100%;
            max-width: 216mm;
            min-height: 279.4mm;
            margin: 0 auto;
            background: white;
            color: #111827;
            font-family: Georgia, 'Times New Roman', serif;
            padding: 16mm 18mm 14mm;
            border: 1px solid #dbeafe;
            box-shadow: 0 12px 30px rgba(15, 23, 42, 0.15);
            display: flex;
            flex-direction: column;
          }

          .cert-header {
            display: grid;
            grid-template-columns: 66mm 1fr;
            gap: 10mm;
            align-items: center;
            border-bottom: 2px solid #0f766e;
            padding-bottom: 7mm;
          }

          .cert-logos {
            display: flex;
            align-items: center;
            gap: 6mm;
          }

          .cert-logo-farmacia {
            width: 58mm;
            height: 25mm;
            object-fit: contain;
          }

          .cert-logo-universidad {
            width: 18mm;
            height: 18mm;
            object-fit: contain;
          }

          .cert-contacto {
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9px;
            line-height: 1.35;
            color: #334155;
            text-align: left;
          }

          .cert-contacto p {
            margin: 0 0 2px;
          }

          .cert-contacto b {
            color: #0f172a;
          }

          .cert-fecha {
            margin-top: 9mm;
            text-align: right;
            font-size: 13px;
          }

          .cert-destinatario {
            margin-top: 12mm;
            font-size: 14px;
          }

          .cert-parrafo {
            margin-top: 7mm;
            text-align: justify;
            font-size: 14px;
            line-height: 1.65;
          }

          .cert-title {
            margin: 12mm 0 6mm;
            text-align: center;
            font-size: 22px;
            font-weight: 900;
            letter-spacing: 0.08em;
          }

          .cert-badge {
            display: inline-block;
            margin-top: 5mm;
            border: 1px solid #0f766e;
            border-radius: 999px;
            padding: 2mm 5mm;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9px;
            font-weight: 900;
            letter-spacing: 0.12em;
            color: #0f766e;
          }

          .cert-paciente {
            font-weight: 900;
            text-transform: uppercase;
          }

          .cert-extra {
            margin-top: 7mm;
            padding: 5mm;
            border-left: 3px solid #0f766e;
            background: #f8fafc;
            font-size: 13px;
            line-height: 1.55;
            white-space: pre-wrap;
          }

          .cert-firma {
            margin-top: auto;
            padding-top: 22mm;
            text-align: center;
          }

          .cert-linea {
            width: 75mm;
            margin: 0 auto 2mm;
            border-top: 1px solid #111827;
          }

          .cert-firma strong {
            display: block;
            font-size: 14px;
          }

          .cert-firma span {
            display: block;
            margin-top: 1mm;
            font-size: 13px;
          }

          .cert-footer {
            margin-top: 10mm;
            text-align: center;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 8px;
            color: #94a3b8;
          }

          @media print {
            .cert-sheet {
              width: 100% !important;
              max-width: none !important;
              min-height: calc(279.4mm - 16mm) !important;
              margin: 0 !important;
              padding: 10mm 13mm 9mm !important;
              border: 0 !important;
              box-shadow: none !important;
            }
          }
        `}
      </style>

      <article className="cert-sheet">
        <header className="cert-header">
          <div className="cert-logos">
            <img
              src={logoFarmacia}
              alt="Farmacia Shaddai"
              className="cert-logo-farmacia"
            />

            {logoUniversidadFinal && (
              <img
                src={logoUniversidadFinal}
                alt="Logo universidad"
                className="cert-logo-universidad"
              />
            )}
          </div>

          <div className="cert-contacto">
            <p>
              <b>Dirección:</b>{' '}
              {datosDoctor.direccion_consultorio ||
                'Calle Cofre de Perote #804, Colonia San Cayetano el Bordo, Pachuca de Soto Hidalgo.'}
            </p>
            <p>
              <b>Teléfono:</b> {datosDoctor.telefono || 'N/A'}
            </p>
            <p>
              <b>Correo:</b> {datosDoctor.correo || 'N/A'}
            </p>
          </div>
        </header>

        <div className="cert-fecha">
          {lugarExpedicion}, a {formatearFechaLarga(fechaExpedicion)}.
        </div>

        <div className="cert-destinatario">
          {destinatario}:
        </div>

        <p className="cert-parrafo">
          Por medio del presente, el/la que suscribe{' '}
          <b>
            {datosDoctor.especialidad || 'Médico cirujano'}{' '}
            {datosDoctor.nombre_completo || 'Doctor Shaddai'}
          </b>
          , legalmente autorizado(a) para ejercer su profesión médica con cédula
          profesional <b>{datosDoctor.cedula_profesional || 'N/A'}</b>.
        </p>

        <div className="cert-title">
          CERTIFICA
         
         
        </div>

        <p className="cert-parrafo">
          Que <span className="cert-paciente">{pacienteNombre}</span>, de{' '}
          <b>{pacienteEdad}</b> años de edad, sexo <b>{pacienteSexo}</b>
          {nacimiento
            ? `, con fecha de nacimiento ${formatearFechaCorta(nacimiento)}`
            : ''}
          , cuenta con <b>{estadoSalud}</b>.
        </p>

        {antecedentes && (
          <p className="cert-parrafo">
            En relación con sus antecedentes, presenta los siguientes datos
            relevantes: {antecedentes}
          </p>
        )}

        {exploracionFisica && (
          <p className="cert-parrafo">
            {exploracionFisica}
          </p>
        )}

        {conclusion && (
          <p className="cert-parrafo">
            {conclusion}
          </p>
        )}

        {textoLibre && (
          <div className="cert-extra">
            {textoLibre}
          </div>
        )}

        <p className="cert-parrafo">
          Se expide el presente certificado médico a solicitud del interesado para
          los fines que estime convenientes.
        </p>

        <div className="cert-firma">
          <div className="cert-linea" />
          <strong>{datosDoctor.nombre_completo || 'Doctor Shaddai'}</strong>
          <span>Cédula profesional: {datosDoctor.cedula_profesional || 'N/A'}</span>
        </div>

      {/*  <div className="cert-footer">
          Documento clínico interno · Expediente #{expediente?.id_expediente || datosPaciente.id_expediente || 'N/A'}
          {folioCertificado ? ` · ${folioCertificado}` : ''}
        </div>
        */}
      </article>
    </div>
  );
}
