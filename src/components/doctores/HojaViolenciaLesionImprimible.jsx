import logoFarmacia from '../../assets/logoShaddai.png';

const OPCIONES = {
  sexo: {
    HOMBRE: 'Hombre',
    MUJER: 'Mujer',
    FEMENINO: 'Mujer',
    MASCULINO: 'Hombre',
    INTERSEXUAL: 'Intersexual',
    NO_ESPECIFICADO: 'No especificado',
  },

  afiliacion_salud: {
    NO_ESPECIFICADA: 'No especificada',
    NINGUNA: 'Ninguna',
    IMSS: 'IMSS',
    ISSSTE: 'ISSSTE',
    PEMEX: 'PEMEX',
    SEDENA: 'SEDENA',
    SEMAR: 'SEMAR',
    OTRA: 'Otra',
    IMSS_BIENESTAR: 'IMSS Bienestar',
    ISSFAM: 'ISSFAM',
    OPD_IMSS_BIENESTAR: 'OPD IMSS Bienestar',
  },

  escolaridad: {
    NINGUNA: 'Ninguna',
    PRIMARIA: 'Primaria',
    SECUNDARIA: 'Secundaria',
    BACHILLERATO: 'Bachillerato / preparatoria',
    PROFESIONAL: 'Profesional',
    LICENCIATURA: 'Profesional',
    POSGRADO: 'Posgrado',
    NO_ESPECIFICADO: 'No especificado',
  },

  escolaridad_estado: {
    COMPLETA: 'Completa',
    INCOMPLETA: 'Incompleta',
  },

  si_no: {
    SI: 'Sí',
    NO: 'No',
  },

  mujer_edad_fertil: {
    EMBARAZO: 'Embarazo',
    PUERPERIO: 'Puerperio',
    NO_EMBARAZADA_NO_PUERPERIO: 'No embarazada / no puerperio',
    NO_APLICA: 'No aplica',
  },

  referido_por: {
    UNIDAD_MEDICA: 'Unidad médica',
    SECRETARIA_EDUCACION_PUBLICA: 'Secretaría de Educación Pública',
    DESARROLLO_SOCIAL: 'Desarrollo Social',
    DIF: 'DIF',
    OTRAS_INSTITUCIONES_GUBERNAMENTALES: 'Otras instituciones gubernamentales',
    INSTITUCIONES_NO_GUBERNAMENTALES: 'Instituciones no gubernamentales',
    PROCURACION_JUSTICIA: 'Procuración de Justicia',
    SIN_REFERENCIA: 'Sin referencia / iniciativa propia',
  },

  sitio_ocurrencia: {
    VIVIENDA: 'Vivienda',
    INSTITUCION_RESIDENCIAL: 'Institución residencial',
    ESCUELA: 'Escuela',
    AREA_DEPORTE_ATLETISMO: 'Área deporte / atletismo',
    VIA_PUBLICA: 'Vía pública / peatonal',
    COMERCIO_SERVICIO: 'Comercio / servicio',
    TRABAJO: 'Trabajo',
    GRANJA: 'Granja',
    CLUB_CANTINA_BAR: 'Club, cantina, bar',
    VEHICULO_PUBLICO: 'Vehículo público',
    VEHICULO_PRIVADO: 'Vehículo privado',
    OTRO: 'Otro lugar',
    NO_ESPECIFICADO: 'No especificado',
  },

  intencionalidad: {
    ACCIDENTAL: 'Accidental',
    VIOLENCIA_FAMILIAR: 'Violencia familiar',
    VIOLENCIA_NO_FAMILIAR: 'Violencia no familiar',
    AUTOINFLIGIDO: 'Autoinfligido',
    TRATA_PERSONAS: 'Trata de personas',
  },

  recibio_atencion_prehospitalaria: {
    SI: 'Sí',
    NO: 'No',
  },

  sospecha_efectos: {
    ALCOHOL: 'Alcohol',
    DROGA_INDICACION_MEDICA: 'Droga por indicación médica',
    DROGAS_ILEGALES: 'Drogas ilegales',
    SE_IGNORA: 'Se ignora',
    NINGUNA: 'Ninguna',
  },

  accidente_vehiculo_motor: {
    SI: 'Sí',
    NO: 'No',
  },

  lesionado_es: {
    CONDUCTOR: 'Conductor',
    OCUPANTE: 'Ocupante',
    PEATON: 'Peatón',
  },

  uso_equipo_seguridad: {
    SI: 'Sí',
    NO: 'No',
    SE_IGNORA: 'Se ignora',
  },

  equipo_seguridad_utilizado: {
    CINTURON_SEGURIDAD: 'Cinturón seguridad',
    CASCO: 'Casco',
    SILLA_PORTA_INFANTE: 'Silla porta infante',
    OTRO: 'Otro',
  },

  agente_lesion: {
    FUEGO_FLAMA_SUSTANCIA_CALIENTE_VAPOR: 'Fuego/flama/sustancia caliente/vapor',
    INTOXICACION_DROGAS_MEDICAMENTOS: 'Intoxicación drogas/medicamentos',
    PIE_MANO: 'Pie o mano',
    CAIDA: 'Caída',
    OBJETO_CONTUNDENTE: 'Objeto contundente',
    OBJETO_PUNZOCORTANTE: 'Objeto punzocortante',
    GOLPE_CONTRA_PISO_PARED: 'Golpe contra piso/pared',
    CUERPO_EXTRAÑO: 'Cuerpo extraño',
    EXPLOSION: 'Explosión',
    ASFIXIA_SOFOCACION: 'Asfixia/sofocación',
    MULTIPLES_AGENTES: 'Múltiples agentes',
    PROYECTIL_ARMA_FUEGO: 'Proyectil arma fuego',
    AHORCAMIENTO: 'Ahorcamiento',
    RADIACION: 'Radiación',
    SUSTANCIAS_QUIMICAS: 'Sustancias químicas',
    CORRIENTE_ELECTRICA: 'Corriente eléctrica',
    HERRAMIENTA_MAQUINARIA: 'Herramienta/maquinaria',
    SACUDIDAS: 'Sacudidas',
    DESASTRE_NATURAL: 'Desastre natural',
    VEHICULO_MOTOR: 'Vehículo motor',
    AHOGAMIENTO_SUMERSION: 'Ahogamiento/sumersión',
    PIQUETE_MORDEDURA_ANIMAL: 'Piquete/mordedura animal',
    FUERZAS_NATURALEZA: 'Fuerzas naturaleza',
    INTOXICACION_PLANTAS_HONGOS: 'Intoxicación plantas/hongos',
    OTRA: 'Otra',
    SE_IGNORA: 'Se ignora',
    NO_APLICA: 'No aplica',
  },

  tipo_violencia: {
    FISICA: 'Violencia física',
    SEXUAL: 'Violencia sexual',
    PSICOLOGICA: 'Violencia psicológica',
    ECONOMICA_PATRIMONIAL: 'Violencia económica/patrimonial',
    ABANDONO_NEGLIGENCIA: 'Abandono/negligencia',
  },

  numero_agresores: {
    UNO: 'Único(a)',
    MAS_DE_UNO: 'Más de uno(a)',
  },

  agresor_sospecha_efectos: {
    ALCOHOL: 'Alcohol',
    DROGA_INDICACION_MEDICA: 'Droga por indicación médica',
    DROGAS_ILEGALES: 'Drogas ilegales',
    SE_IGNORA: 'Se ignora',
    NINGUNA: 'Ninguna',
  },

  evento_autoinfligido_ocurrio: {
    UNICA_VEZ: 'Única vez',
    REPETIDO: 'Repetido',
  },

  area_anatomica: {
    CABEZA: 'Cabeza',
    CARA: 'Cara',
    REGION_OCULAR: 'Región ocular',
    CUELLO: 'Cuello',
    COLUMNA_VERTEBRAL: 'Columna vertebral',
    EXT_SUPERIORES: 'Ext. superiores',
    MANO: 'Mano',
    TORAX: 'Tórax',
    ESPALDA_GLUTEOS: 'Espalda/glúteos',
    ABDOMEN: 'Abdomen',
    PELVIS: 'Pelvis',
    REGION_GENITAL: 'Región genital',
    EXT_INFERIORES: 'Ext. inferiores',
    PIES: 'Pies',
    MULTIPLES: 'Múltiples',
    OTROS: 'Otros',
    NO_HUBO_LESION: 'No hubo lesión',
  },

  consecuencia: {
    LACERACION_ABRASION: 'Laceración/abrasión',
    APLASTAMIENTO: 'Aplastamiento',
    CICATRICES: 'Cicatrices',
    DEPRESION: 'Depresión',
    CONTRACTURA_MAGULLAMIENTO: 'Contractura/magullamiento',
    CONGELAMIENTO: 'Congelamiento',
    ABORTO: 'Aborto',
    TRASTORNOS_ANSIEDAD_ESTRES_POSTRAUMATICO: 'Ansiedad/estrés postraumático',
    QUEMADURA_CORROSION: 'Quemadura/corrosión',
    ASFIXIA: 'Asfixia',
    EMBARAZO: 'Embarazo',
    TRASTORNOS_PSIQUIATRICOS: 'Trastornos psiquiátricos',
    LUXACION_ESGUINCE: 'Luxación/esguince',
    HERIDA: 'Herida',
    INFECCION_TRANSMISION_SEXUAL: 'ITS',
    MULTIPLE: 'Múltiple',
    AMPUTACION_AVULSION: 'Amputación/avulsión',
    FRACTURA: 'Fractura',
    DEFUNCION: 'Defunción',
    MALESTAR_EMOCIONAL: 'Malestar emocional',
    TRASTORNO_ESTADO_ANIMO: 'Trastorno estado ánimo',
    OTRA: 'Otra',
  },

  servicio_otorgado: {
    CONSULTA_EXTERNA: 'Consulta externa',
    URGENCIAS: 'Urgencias',
    HOSPITALIZACION: 'Hospitalización',
    REFERENCIA: 'Referencia',
    OTRO: 'Otro',
  },

  tipo_atencion: {
    MEDICA: 'Médica',
    PSICOLOGICA: 'Psicológica',
    QUIRURGICA: 'Quirúrgica',
    PSIQUIATRICA: 'Psiquiátrica',
    CONSEJERIA: 'Consejería',
    OTRA: 'Otra',
    PAE: 'PAE',
    PROFILAXIS_VIH: 'Profilaxis VIH',
    PROFILAXIS_ITS: 'Profilaxis ITS',
    IVE: 'IVE',
    VACUNA_VPH: 'Vacuna VPH',
  },

  aviso_ministerio_publico: {
    SI: 'Sí',
    NO: 'No',
  },

  destino_despues_atencion: {
    DOMICILIO: 'Domicilio',
    TRASLADO_UNIDAD_MEDICA: 'Traslado unidad médica',
    SERVICIO_ESPECIALIZADO_VIOLENCIA: 'Servicio especializado violencia',
    CONSULTA_EXTERNA: 'Consulta externa',
    DEFUNCION: 'Defunción',
    REFUGIO_ALBERGUE: 'Refugio/albergue',
    DIF: 'DIF',
    HOSPITALIZACION: 'Hospitalización',
    MINISTERIO_PUBLICO: 'Ministerio público',
    GRUPO_AYUDA_MUTUA: 'Grupo ayuda mutua',
  },

  responsable_atencion: {
    MEDICO_TRATANTE: 'Médica(o) tratante',
    PSICOLOGO_TRATANTE: 'Psicóloga(o) tratante',
    TRABAJADOR_SOCIAL: 'Trabajadora(or) social',
    OTRA: 'Otra',
  },
};

const pares = (catalogo) =>
  Object.entries(catalogo || {}).map(([value, label]) => ({ value, label }));

const obtenerPartesFecha = (fecha) => {
  if (!fecha) return null;

  if (fecha instanceof Date) {
    if (Number.isNaN(fecha.getTime())) return null;

    return {
      anio: String(fecha.getFullYear()),
      mes: String(fecha.getMonth() + 1).padStart(2, '0'),
      dia: String(fecha.getDate()).padStart(2, '0'),
    };
  }

  const texto = String(fecha).trim();

  // Ejemplos: 1998-10-12 o 1998-10-12T00:00:00.000Z
  const fechaISO = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(texto);

  if (fechaISO) {
    const [, anio, mes, dia] = fechaISO;

    return { anio, mes, dia };
  }

  // Ejemplo: 12/10/1998
  const fechaLatina = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto);

  if (fechaLatina) {
    const [, dia, mes, anio] = fechaLatina;

    return { anio, mes, dia };
  }

  return null;
};

const formatearFecha = (fecha) => {
  const partes = obtenerPartesFecha(fecha);

  if (!partes) return 'N/A';

  return `${partes.dia}/${partes.mes}/${partes.anio}`;
};

const formatearHora = (hora) => {
  if (!hora) return 'N/A';
  return hora;
};

const textoCatalogo = (catalogo, valor) => {
  if (!valor) return 'N/A';
  return OPCIONES[catalogo]?.[valor] || valor;
};

const valorTexto = (valor) => {
  if (valor === undefined || valor === null || valor === '') return 'N/A';
  return valor;
};

const obtenerNombrePaciente = (expediente = {}, paciente = {}, datos = {}) => {
  const partesDesdeDatos = [
    datos?.nombre_paciente,
    datos?.primer_apellido,
    datos?.segundo_apellido,
  ].filter(Boolean);

  if (partesDesdeDatos.length) return partesDesdeDatos.join(' ');

  if (paciente?.nombre_paciente) return paciente.nombre_paciente;

  const partes = [
    expediente?.nombre_paciente,
    expediente?.primer_apellido,
    expediente?.segundo_apellido,
  ].filter(Boolean);

  return partes.length ? partes.join(' ') : 'Paciente no especificado';
};

const obtenerNombreResponsable = (perfilDoctor = {}, datos = {}) => {
  const partes = [
    datos?.responsable_nombre,
    datos?.responsable_primer_apellido,
    datos?.responsable_segundo_apellido,
  ].filter(Boolean);

  if (partes.length) return partes.join(' ');

  return perfilDoctor?.nombre_completo || 'Doctor Shaddai';
};

const obtenerCedulaResponsable = (perfilDoctor = {}, datos = {}) => {
  return datos?.responsable_cedula || perfilDoctor?.cedula_profesional || 'N/A';
};

const obtenerTelefonoResponsable = (perfilDoctor = {}, datos = {}) => {
  return (
    datos?.responsable_telefono ||
    datos?.telefono_responsable ||
    datos?.medico_telefono ||
    datos?.doctor_telefono ||
    perfilDoctor?.telefono ||
    perfilDoctor?.telefono_contacto ||
    perfilDoctor?.telefono_consultorio ||
    perfilDoctor?.medico_telefono ||
    perfilDoctor?.doctor_telefono ||
    perfilDoctor?.celular ||
    'N/A'
  );
};

const obtenerEspecialidadDoctor = (perfilDoctor = {}) => {
  return perfilDoctor?.especialidad || 'N/A';
};

const Campo = ({ label, value }) => (
  <div className="vl-field">
    <span className="vl-label">{label}: </span>
    <span>{valorTexto(value)}</span>
  </div>
);

const Caja = ({ label, checked }) => (
  <span className="vl-check-item">
    <span className="vl-check-box">{checked ? 'X' : ''}</span>
    <span className="vl-check-label">{label}</span>
  </span>
);

const GrupoChecks = ({
  titulo,
  opciones = [],
  seleccionado,
  multiple = [],
  columnas = 2,
}) => {
  const valoresMultiples = Array.isArray(multiple) ? multiple : [];

  return (
    <section className="vl-box">
      <div className="vl-box-title">{titulo}</div>

      <div
        className="vl-check-grid"
        style={{
          gridTemplateColumns: `repeat(${columnas}, minmax(0, 1fr))`,
        }}
      >
        {opciones.map((opcion) => (
          <Caja
            key={opcion.value}
            label={opcion.label}
            checked={
              seleccionado === opcion.value ||
              valoresMultiples.includes(opcion.value)
            }
          />
        ))}
      </div>
    </section>
  );
};

const BloqueTexto = ({ titulo, contenido, alto = 30 }) => (
  <section className="vl-box">
    <div className="vl-box-title">{titulo}</div>

    <div
      className="vl-text-box"
      style={{
        minHeight: `${alto}px`,
      }}
    >
      {contenido || 'Sin registro.'}
    </div>
  </section>
);

export default function HojaViolenciaLesionImprimible({
  expediente,
  paciente,
  perfilDoctor,
  datos,
  farmaciaNombre = 'Farmacia Shaddai',
}) {
  const normalizarArrayLocal = (valor) => {
    if (Array.isArray(valor)) return valor;

    if (!valor) return [];

    if (typeof valor === 'string') {
      try {
        const parsed = JSON.parse(valor);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    return [];
  };

  const datosFinal = {
    ...(datos || {}),

    agentes_lesion: normalizarArrayLocal(datos?.agentes_lesion),
    areas_anatomicas: normalizarArrayLocal(datos?.areas_anatomicas),
    consecuencias: normalizarArrayLocal(datos?.consecuencias),
  };
  const nombrePaciente = obtenerNombrePaciente(expediente, paciente, datosFinal);
  const nombreResponsable = obtenerNombreResponsable(perfilDoctor, datosFinal);
  const cedulaResponsable = obtenerCedulaResponsable(perfilDoctor, datosFinal);
  const telefonoResponsable = obtenerTelefonoResponsable(
    perfilDoctor,
    datosFinal
  );
  const especialidadDoctor = obtenerEspecialidadDoctor(perfilDoctor);

  const areasSeleccionadas = datosFinal.areas_anatomicas || [];
  const consecuenciasSeleccionadas = datosFinal.consecuencias || [];
  const agentesSeleccionados = datosFinal.agentes_lesion || [];

  return (
    <>
      <style>
        {`
    #hoja-violencia-lesion-imprimible {
      --vl-border: #1e293b;
      --vl-soft-border: #cbd5e1;
      --vl-header: #f1f5f9;
      --vl-text: #0f172a;
      color: var(--vl-text);
      font-family: Arial, Helvetica, sans-serif;
      font-size: 7.2px;
      line-height: 1.15;
      width: 100%;
      background: #ffffff;
    }

    #hoja-violencia-lesion-imprimible,
    #hoja-violencia-lesion-imprimible * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    #hoja-violencia-lesion-imprimible .vl-sheet {
      width: 760px;
      max-width: 100%;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid var(--vl-border);
      border-radius: 10px;
      padding: 14px 18px 10px;
      box-shadow: 0 1px 4px rgba(15, 23, 42, 0.08);
    }

    #hoja-violencia-lesion-imprimible .vl-header {
      display: grid;
      grid-template-columns: 56px 1fr 92px;
      align-items: center;
      gap: 8px;
      padding-bottom: 8px;
      margin-bottom: 7px;
      border-bottom: 2px solid var(--vl-border);
    }

    #hoja-violencia-lesion-imprimible .vl-logo {
      width: 44px;
      height: 44px;
      object-fit: contain;
    }

    #hoja-violencia-lesion-imprimible .vl-institution {
      text-align: center;
      font-size: 8px;
      font-weight: 900;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    #hoja-violencia-lesion-imprimible .vl-title {
      text-align: center;
      font-size: 11.5px;
      line-height: 1.05;
      font-weight: 900;
      text-transform: uppercase;
      margin: 2px 0;
    }

    #hoja-violencia-lesion-imprimible .vl-subtitle {
      text-align: center;
      font-size: 7.2px;
      line-height: 1.1;
      font-weight: 700;
      text-transform: uppercase;
    }

    #hoja-violencia-lesion-imprimible .vl-meta {
      text-align: right;
      font-size: 6.8px;
      line-height: 1.15;
    }

    #hoja-violencia-lesion-imprimible .vl-grid {
      display: grid;
      gap: 5px;
    }

    #hoja-violencia-lesion-imprimible .vl-grid-2 {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    #hoja-violencia-lesion-imprimible .vl-grid-service {
      grid-template-columns: 0.82fr 1.18fr;
    }

    #hoja-violencia-lesion-imprimible .vl-box {
      border: 1px solid var(--vl-border);
      margin-bottom: 5px;
      break-inside: avoid;
      page-break-inside: avoid;
    }

    #hoja-violencia-lesion-imprimible .vl-box-title {
      background: var(--vl-header);
      border-bottom: 1px solid var(--vl-border);
      padding: 2px 3px;
      font-size: 7.2px;
      line-height: 1.05;
      font-weight: 900;
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    #hoja-violencia-lesion-imprimible .vl-data-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 0 5px;
      padding: 3px 4px;
    }

    #hoja-violencia-lesion-imprimible .vl-field {
      min-width: 0;
      padding: 1px 0;
      border-bottom: 1px solid var(--vl-soft-border);
      font-size: 7.2px;
      line-height: 1.12;
      overflow-wrap: anywhere;
    }

    #hoja-violencia-lesion-imprimible .vl-label {
      font-weight: 900;
    }

    #hoja-violencia-lesion-imprimible .vl-check-grid {
      display: grid;
      gap: 2px 5px;
      padding: 3px 4px;
    }

    #hoja-violencia-lesion-imprimible .vl-check-item {
      display: inline-flex;
      align-items: flex-start;
      min-width: 0;
      gap: 3px;
      font-size: 7px;
      line-height: 1.08;
      overflow-wrap: anywhere;
    }

    #hoja-violencia-lesion-imprimible .vl-check-box {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      width: 8px;
      height: 8px;
      margin-top: 0.2px;
      border: 1px solid var(--vl-border);
      font-size: 5.8px;
      line-height: 1;
      font-weight: 900;
    }

    #hoja-violencia-lesion-imprimible .vl-check-label {
      min-width: 0;
    }

    #hoja-violencia-lesion-imprimible .vl-text-box {
      padding: 3px 4px;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      font-size: 7.2px;
      line-height: 1.14;
    }

    #hoja-violencia-lesion-imprimible .vl-footer {
      display: grid;
      grid-template-columns: 1fr 210px;
      gap: 24px;
      margin-top: 7px;
      padding-top: 6px;
      border-top: 1.5px solid var(--vl-border);
      break-inside: avoid;
      page-break-inside: avoid;
    }

    #hoja-violencia-lesion-imprimible .vl-footer-title {
      font-size: 7.4px;
      font-weight: 900;
      text-transform: uppercase;
    }

    #hoja-violencia-lesion-imprimible .vl-footer-name {
      margin-top: 2px;
      font-size: 8.4px;
      font-weight: 900;
    }

    #hoja-violencia-lesion-imprimible .vl-footer-line {
      margin-top: 44px;
      border-top: 1px solid var(--vl-border);
      text-align: center;
      font-size: 7.2px;
      font-weight: 900;
      padding-top: 2px;
    }

    #hoja-violencia-lesion-imprimible .vl-note {
      margin-top: 4px;
      text-align: center;
      font-size: 6.4px;
      color: #64748b;
      line-height: 1.1;
    }

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
        padding: 5mm !important;
      }

      body * {
        visibility: hidden !important;
      }

      #hoja-violencia-lesion-imprimible,
      #hoja-violencia-lesion-imprimible * {
        visibility: visible !important;
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      #hoja-violencia-lesion-imprimible {
        position: static !important;
        display: block !important;
        width: 100% !important;
        max-width: 206mm !important;
        min-width: 0 !important;
        height: auto !important;
        margin: 0 auto !important;
        padding: 0 !important;
        overflow: visible !important;
        background: #ffffff !important;
        color: #0f172a !important;
        transform: none !important;
        zoom: 1 !important;
      }

      #hoja-violencia-lesion-imprimible .vl-sheet {
        display: block !important;
        width: 100% !important;
        max-width: 206mm !important;
        min-width: 0 !important;
        min-height: auto !important;
        margin: 0 auto !important;
        padding: 3mm 4mm !important;
        border: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        background: #ffffff !important;
        transform: none !important;
        zoom: 1 !important;
        overflow: visible !important;
      }

      #hoja-violencia-lesion-imprimible .vl-header,
      #hoja-violencia-lesion-imprimible .vl-box,
      #hoja-violencia-lesion-imprimible .vl-footer {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }

      #hoja-violencia-lesion-imprimible p,
      #hoja-violencia-lesion-imprimible div,
      #hoja-violencia-lesion-imprimible span {
        overflow-wrap: anywhere !important;
      }

      .no-print {
        display: none !important;
      }
    }
  `}
      </style>

      <div id="hoja-violencia-lesion-imprimible">
        <div className="vl-sheet">
          <header className="vl-header">
            <img src={logoFarmacia} alt="Logo" className="vl-logo" />

            <div>
              <p className="vl-institution">{farmaciaNombre}</p>
              <h1 className="vl-title">
                Hoja de registro de atención por violencia y/o lesión
              </h1>
              <p className="vl-subtitle">
                Documento clínico de apoyo / Control interno
              </p>
            </div>

            <div className="vl-meta">
              <p>
                <strong>Folio:</strong> {datosFinal.folio || 'Vista previa'}
              </p>
              <p>
                <strong>Exp:</strong> #
                {datosFinal.id_expediente || expediente?.id_expediente || 'N/A'}
              </p>
              <p>
                <strong>Fecha:</strong> {formatearFecha(datosFinal.fecha_atencion)}
              </p>
              <p>
                <strong>Hora:</strong> {formatearHora(datosFinal.hora_atencion)}
              </p>
            </div>
          </header>

          <section className="vl-box">
            <div className="vl-box-title">Paciente / identificación</div>

            <div className="vl-data-grid">
              <Campo label="Paciente" value={nombrePaciente} />
              <Campo label="CURP" value={datosFinal.curp || expediente?.curp} />
              <Campo
                label="Fecha nac."
                value={formatearFecha(
                  datosFinal.fecha_nacimiento || expediente?.fecha_nacimiento
                )}
              />
              <Campo
                label="Entidad/país nac."
                value={datosFinal.entidad_pais_nacimiento || expediente?.entidad_nacimiento}
              />

              <Campo
                label="Edad"
                value={`${datosFinal.edad_anios || paciente?.edad || expediente?.edad || 'N/A'} años / ${datosFinal.edad_meses || 0} meses / ${datosFinal.edad_dias || 0} días`}
              />
              <Campo
                label="Sexo"
                value={textoCatalogo(
                  'sexo',
                  datosFinal.sexo || paciente?.sexo || expediente?.sexo
                )}
              />
              <Campo
                label="Teléfono"
                value={datosFinal.telefono || paciente?.telefono || expediente?.telefono}
              />
              <Campo label="Ocupación" value={datosFinal.ocupacion} />

              <Campo
                label="Afiliación"
                value={textoCatalogo('afiliacion_salud', datosFinal.afiliacion_salud)}
              />
              <Campo label="Núm. afiliación" value={datosFinal.numero_afiliacion} />
              <Campo label="Gratuidad" value={textoCatalogo('si_no', datosFinal.gratuidad)} />
              <Campo
                label="Escolaridad"
                value={textoCatalogo('escolaridad', datosFinal.escolaridad)}
              />

              <Campo
                label="Estado escolar"
                value={textoCatalogo('escolaridad_estado', datosFinal.escolaridad_estado)}
              />
              <Campo
                label="Lee/escribe"
                value={textoCatalogo('si_no', datosFinal.sabe_leer_escribir)}
              />
              <Campo
                label="Indígena"
                value={textoCatalogo('si_no', datosFinal.se_considera_indigena)}
              />
              <Campo
                label="Lengua"
                value={
                  datosFinal.habla_lengua_indigena === 'SI'
                    ? datosFinal.lengua_indigena || 'Sí'
                    : textoCatalogo('si_no', datosFinal.habla_lengua_indigena)
                }
              />

              <Campo
                label="Afromexicano"
                value={textoCatalogo('si_no', datosFinal.se_considera_afromexicano)}
              />
              <Campo
                label="Migrante"
                value={textoCatalogo('si_no', datosFinal.migrante_retornado)}
              />
              <Campo
                label="Mujer edad fértil"
                value={textoCatalogo('mujer_edad_fertil', datosFinal.mujer_edad_fertil)}
              />
              <Campo label="Sem. gestación" value={datosFinal.semanas_gestacion} />

              <Campo
                label="Discapacidad"
                value={textoCatalogo('si_no', datosFinal.dificultad_discapacidad)}
              />
              <Campo
                label="Referido por"
                value={textoCatalogo('referido_por', datosFinal.referido_por)}
              />
              <Campo label="Nombre referencia" value={datosFinal.referido_por_nombre} />
              <Campo label="Domicilio" value={datosFinal.domicilio || expediente?.direccion} />
            </div>
          </section>

          <section className="vl-grid vl-grid-2">
            <GrupoChecks
              titulo="Sitio de ocurrencia"
              seleccionado={datosFinal.sitio_ocurrencia}
              opciones={pares(OPCIONES.sitio_ocurrencia)}
              columnas={2}
            />

            <GrupoChecks
              titulo="Intencionalidad del evento"
              seleccionado={datosFinal.intencionalidad}
              opciones={pares(OPCIONES.intencionalidad)}
              columnas={2}
            />
          </section>

          <section className="vl-box">
            <div className="vl-box-title">Domicilio de ocurrencia</div>

            <div className="vl-data-grid">
              <Campo label="Fecha ocurrencia" value={formatearFecha(datosFinal.fecha_ocurrencia)} />
              <Campo label="Hora ocurrencia" value={formatearHora(datosFinal.hora_ocurrencia)} />
              <Campo label="Otro sitio" value={datosFinal.sitio_ocurrencia_otro} />
              <Campo label="Entidad" value={datosFinal.entidad_ocurrencia} />

              <Campo label="Municipio" value={datosFinal.municipio_ocurrencia} />
              <Campo label="Localidad" value={datosFinal.localidad_ocurrencia} />
              <Campo label="Código postal" value={datosFinal.codigo_postal_ocurrencia} />
              <Campo label="Tipo vialidad" value={datosFinal.tipo_vialidad} />

              <Campo label="Nombre vialidad" value={datosFinal.nombre_vialidad} />
              <Campo label="Núm. ext." value={datosFinal.numero_exterior} />
              <Campo label="Núm. int." value={datosFinal.numero_interior} />
              <Campo label="Tipo asentamiento" value={datosFinal.tipo_asentamiento} />

              <Campo label="Nombre asentamiento" value={datosFinal.nombre_asentamiento} />
              <Campo
                label="Atención prehospitalaria"
                value={textoCatalogo(
                  'recibio_atencion_prehospitalaria',
                  datosFinal.recibio_atencion_prehospitalaria
                )}
              />
              <Campo
                label="Traslado"
                value={`${datosFinal.tiempo_traslado_horas || 0} h ${datosFinal.tiempo_traslado_minutos || 0} min`}
              />
              <Campo
                label="Bajo efectos"
                value={textoCatalogo('sospecha_efectos', datosFinal.sospecha_efectos)}
              />
            </div>
          </section>

          <GrupoChecks
            titulo="Agente de la lesión"
            multiple={agentesSeleccionados}
            opciones={pares(OPCIONES.agente_lesion)}
            columnas={4}
          />

          <section className="vl-box">
            <div className="vl-box-title">Accidente de vehículo de motor</div>

            <div className="vl-data-grid">
              <Campo
                label="Accidente vehículo"
                value={textoCatalogo(
                  'accidente_vehiculo_motor',
                  datosFinal.accidente_vehiculo_motor
                )}
              />
              <Campo
                label="Lesionada(o) es"
                value={textoCatalogo('lesionado_es', datosFinal.lesionado_es)}
              />
              <Campo
                label="Usó equipo"
                value={textoCatalogo('uso_equipo_seguridad', datosFinal.uso_equipo_seguridad)}
              />
              <Campo
                label="Equipo usado"
                value={textoCatalogo(
                  'equipo_seguridad_utilizado',
                  datosFinal.equipo_seguridad_utilizado
                )}
              />
            </div>
          </section>

          <section className="vl-grid vl-grid-2">
            <GrupoChecks
              titulo="Tipo de violencia"
              seleccionado={datosFinal.tipo_violencia}
              opciones={pares(OPCIONES.tipo_violencia)}
              columnas={2}
            />

            <GrupoChecks
              titulo="Sospecha de sustancias en agresor(a)"
              seleccionado={datosFinal.agresor_sospecha_efectos}
              opciones={pares(OPCIONES.agresor_sospecha_efectos)}
              columnas={2}
            />
          </section>

          <section className="vl-box">
            <div className="vl-box-title">Agresor(a)</div>

            <div className="vl-data-grid">
              <Campo
                label="Número agresores"
                value={textoCatalogo('numero_agresores', datosFinal.numero_agresores)}
              />
              <Campo label="Nombre" value={datosFinal.agresor_nombre} />
              <Campo label="Sexo" value={textoCatalogo('sexo', datosFinal.agresor_sexo)} />
              <Campo label="Edad" value={datosFinal.agresor_edad} />
              <Campo label="Parentesco/relación" value={datosFinal.agresor_parentesco} />
              <Campo
                label="Autoinfligido"
                value={textoCatalogo(
                  'evento_autoinfligido_ocurrio',
                  datosFinal.evento_autoinfligido_ocurrio
                )}
              />
            </div>
          </section>

          <section className="vl-grid vl-grid-2">
            <GrupoChecks
              titulo="Área anatómica de mayor gravedad"
              multiple={areasSeleccionadas}
              opciones={pares(OPCIONES.area_anatomica)}
              columnas={3}
            />

            <GrupoChecks
              titulo="Consecuencia resultante de mayor gravedad"
              multiple={consecuenciasSeleccionadas}
              opciones={pares(OPCIONES.consecuencia)}
              columnas={3}
            />
          </section>

          <section className="vl-grid" style={{ gridTemplateColumns: '1fr 160px' }}>
            <BloqueTexto
              titulo="Afección principal"
              contenido={datosFinal.afeccion_principal}
              alto={26}
            />

            <BloqueTexto
              titulo="Código CIE"
              contenido={datosFinal.codigo_cie_afeccion_principal}
              alto={26}
            />
          </section>

          <BloqueTexto
            titulo="Causa externa / acontecimientos, circunstancias y condiciones que causan la lesión"
            contenido={datosFinal.causa_externa}
            alto={36}
          />

          <section className="vl-grid vl-grid-service">
            <GrupoChecks
              titulo="Servicio que otorgó la atención"
              seleccionado={datosFinal.servicio_otorgado}
              opciones={pares(OPCIONES.servicio_otorgado)}
              columnas={2}
            />

            <GrupoChecks
              titulo="Tipo de atención"
              seleccionado={datosFinal.tipo_atencion}
              opciones={pares(OPCIONES.tipo_atencion)}
              columnas={3}
            />
          </section>

          <section className="vl-box">
            <div className="vl-box-title">Cierre / destino después de la atención</div>

            <div className="vl-data-grid">
              <Campo
                label="Aviso Ministerio Público"
                value={textoCatalogo(
                  'aviso_ministerio_publico',
                  datosFinal.aviso_ministerio_publico
                )}
              />
              <Campo
                label="Destino"
                value={textoCatalogo(
                  'destino_despues_atencion',
                  datosFinal.destino_despues_atencion
                )}
              />
              <Campo label="Folio defunción" value={datosFinal.defuncion_folio_certificado} />
              <Campo
                label="Responsable"
                value={textoCatalogo('responsable_atencion', datosFinal.responsable_atencion)}
              />
            </div>
          </section>

          <footer className="vl-footer">
            <div>
              <p className="vl-footer-title">Responsable de la atención</p>
              <p className="vl-footer-name">{nombreResponsable}</p>
              <p>
                <strong>Tipo:</strong>{' '}
                {textoCatalogo('responsable_atencion', datosFinal.responsable_atencion)}
              </p>
              <p>
                <strong>Especialidad:</strong> {especialidadDoctor}
              </p>
              {/* 
             <p>
                <strong>CURP:</strong> {datosFinal.responsable_curp || 'N/A'}
              </p>
              */}
              <p>
                <strong>Cédula profesional:</strong> {cedulaResponsable}
              </p>
              <p>
                <strong>Teléfono:</strong> {telefonoResponsable}
              </p>
            </div>

            <div>
              <div className="vl-footer-line">Firma del responsable</div>
            </div>
          </footer>

          {/* <p className="vl-note">
            Este formato es una herramienta de apoyo para el registro clínico. Ajusta su uso conforme a los protocolos internos y disposiciones aplicables.
          </p>
          */}
        </div>
      </div>
    </>
  );
}
