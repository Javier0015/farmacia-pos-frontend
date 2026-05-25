import { useEffect, useMemo, useState } from 'react';
import {
    CheckCircle2,
    FileWarning,
    Loader2,
    Printer,
    RefreshCw,
    Save,
    X,
} from 'lucide-react';
import Swal from 'sweetalert2';
import HojaViolenciaLesionImprimible from './HojaViolenciaLesionImprimible';
import { violenciaLesionService } from '../../services/violenciaLesionService';

const formInicial = {
    folio: '',
    fecha_atencion: '',
    hora_atencion: '',

    // =====================
    // PACIENTE / IDENTIFICACIÓN
    // =====================

    nombre_paciente: '',
    primer_apellido: '',
    segundo_apellido: '',
    curp: '',
    fecha_nacimiento: '',
    entidad_pais_nacimiento: '',

    edad_anios: '',
    edad_meses: '',
    edad_dias: '',

    sexo: '',

    telefono: '',
    domicilio: '',
    entidad: '',
    municipio: '',
    localidad: '',
    ocupacion: '',

    afiliacion_salud: '',
    numero_afiliacion: '',
    gratuidad: '',

    escolaridad: '',
    escolaridad_estado: '',

    sabe_leer_escribir: '',
    se_considera_indigena: '',
    habla_lengua_indigena: '',
    lengua_indigena: '',
    se_considera_afromexicano: '',
    migrante_retornado: '',

    mujer_edad_fertil: '',
    semanas_gestacion: '',
    dificultad_discapacidad: '',

    referido_por: '',
    referido_por_nombre: '',

    // =====================
    // EVENTO / OCURRENCIA
    // =====================
    fecha_ocurrencia: '',
    hora_ocurrencia: '',

    sitio_ocurrencia: '',
    sitio_ocurrencia_otro: '',

    entidad_ocurrencia: '',
    municipio_ocurrencia: '',
    localidad_ocurrencia: '',
    codigo_postal_ocurrencia: '',
    tipo_vialidad: '',
    nombre_vialidad: '',
    numero_exterior: '',
    numero_interior: '',
    tipo_asentamiento: '',
    nombre_asentamiento: '',

    intencionalidad: '',

    recibio_atencion_prehospitalaria: '',
    tiempo_traslado_horas: '',
    tiempo_traslado_minutos: '',

    sospecha_efectos: '',

    accidente_vehiculo_motor: '',
    lesionado_es: '',
    uso_equipo_seguridad: '',
    equipo_seguridad_utilizado: '',




    // =====================
    // LESIÓN / VIOLENCIA
    // =====================
    tipo_violencia: '',

    numero_agresores: '',
    agresor_nombre: '',
    agresor_sexo: '',
    agresor_edad: '',
    agresor_parentesco: '',
    agresor_sospecha_efectos: '',
    evento_autoinfligido_ocurrio: '',

    areas_anatomicas: [],
    areas_anatomicas_otro: '',
    consecuencias: [],
    consecuencias_otro: '',

    afeccion_principal: '',
    codigo_cie_afeccion_principal: '',
    causa_externa: '',

    agentes_lesion: [],
    gravedad: '',
    servicio_otorgado: '',

    descripcion_hechos: '',
    hallazgos_clinicos: '',
    diagnostico: '',
    tratamiento: '',

    // =====================
    // CIERRE / ATENCIÓN
    // =====================
    tipo_atencion: '',

    aviso_ministerio_publico: '',
    destino_despues_atencion: '',
    defuncion_folio_certificado: '',

    responsable_atencion: '',
    responsable_nombre: '',
    responsable_primer_apellido: '',
    responsable_segundo_apellido: '',
    responsable_curp: '',
    responsable_cedula: '',
};

const OPCIONES = {
    sexo: [
        ['HOMBRE', 'Hombre'],
        ['MUJER', 'Mujer'],
        ['INTERSEXUAL', 'Intersexual'],
        ['NO_ESPECIFICADO', 'No especificado'],
    ],

    afiliacion_salud: [
        ['NO_ESPECIFICADA', 'No especificada'],
        ['NINGUNA', 'Ninguna'],
        ['IMSS', 'IMSS'],
        ['ISSSTE', 'ISSSTE'],
        ['PEMEX', 'PEMEX'],
        ['SEDENA', 'SEDENA'],
        ['SEMAR', 'SEMAR'],
        ['OTRA', 'Otra'],
        ['IMSS_BIENESTAR', 'IMSS Bienestar'],
        ['ISSFAM', 'ISSFAM'],
        ['OPD_IMSS_BIENESTAR', 'OPD IMSS Bienestar'],
    ],

    escolaridad: [
        ['NINGUNA', 'Ninguna'],
        ['PRIMARIA', 'Primaria'],
        ['SECUNDARIA', 'Secundaria'],
        ['BACHILLERATO', 'Bachillerato / preparatoria'],
        ['PROFESIONAL', 'Profesional'],
        ['POSGRADO', 'Posgrado'],
        ['NO_ESPECIFICADO', 'No especificado'],
    ],

    escolaridad_estado: [
        ['COMPLETA', 'Completa'],
        ['INCOMPLETA', 'Incompleta'],
    ],

    si_no: [
        ['SI', 'Sí'],
        ['NO', 'No'],
    ],

    mujer_edad_fertil: [
        ['EMBARAZO', 'Embarazo'],
        ['PUERPERIO', 'Puerperio'],
        ['NO_EMBARAZADA_NO_PUERPERIO', 'No embarazada / no puerperio'],
        ['NO_APLICA', 'No aplica'],
    ],

    referido_por: [
        ['UNIDAD_MEDICA', 'Unidad médica'],
        ['SECRETARIA_EDUCACION_PUBLICA', 'Secretaría de Educación Pública'],
        ['DESARROLLO_SOCIAL', 'Desarrollo Social'],
        ['DIF', 'DIF'],
        ['OTRAS_INSTITUCIONES_GUBERNAMENTALES', 'Otras instituciones gubernamentales'],
        ['INSTITUCIONES_NO_GUBERNAMENTALES', 'Instituciones no gubernamentales'],
        ['PROCURACION_JUSTICIA', 'Procuración de Justicia'],
        ['SIN_REFERENCIA', 'Sin referencia / iniciativa propia'],
    ],

    sitio_ocurrencia: [
        ['VIVIENDA', 'Vivienda'],
        ['INSTITUCION_RESIDENCIAL', 'Institución residencial'],
        ['ESCUELA', 'Escuela'],
        ['AREA_DEPORTE_ATLETISMO', 'Área de deporte / atletismo'],
        ['VIA_PUBLICA', 'Vía pública / peatonal'],
        ['COMERCIO_SERVICIO', 'Comercio y área de servicio'],
        ['TRABAJO', 'Trabajo'],
        ['GRANJA', 'Granja'],
        ['CLUB_CANTINA_BAR', 'Club, cantina, bar'],
        ['VEHICULO_PUBLICO', 'Vehículo automotor público'],
        ['VEHICULO_PRIVADO', 'Vehículo automotor privado'],
        ['OTRO', 'Otro lugar'],
        ['NO_ESPECIFICADO', 'Lugar no especificado'],
    ],

    intencionalidad: [
        ['ACCIDENTAL', 'Accidental'],
        ['VIOLENCIA_FAMILIAR', 'Violencia familiar'],
        ['VIOLENCIA_NO_FAMILIAR', 'Violencia no familiar'],
        ['AUTOINFLIGIDO', 'Autoinfligido'],
        ['TRATA_PERSONAS', 'Trata de personas'],
    ],

    recibio_atencion_prehospitalaria: [
        ['SI', 'Sí'],
        ['NO', 'No'],
    ],

    sospecha_efectos: [
        ['ALCOHOL', 'Alcohol'],
        ['DROGA_INDICACION_MEDICA', 'Droga por indicación médica'],
        ['DROGAS_ILEGALES', 'Drogas ilegales'],
        ['SE_IGNORA', 'Se ignora'],
        ['NINGUNA', 'Ninguna'],
    ],

    accidente_vehiculo_motor: [
        ['SI', 'Sí'],
        ['NO', 'No'],
    ],

    lesionado_es: [
        ['CONDUCTOR', 'Conductor'],
        ['OCUPANTE', 'Ocupante'],
        ['PEATON', 'Peatón'],
    ],

    uso_equipo_seguridad: [
        ['SI', 'Sí'],
        ['NO', 'No'],
        ['SE_IGNORA', 'Se ignora'],
    ],

    equipo_seguridad_utilizado: [
        ['CINTURON_SEGURIDAD', 'Cinturón de seguridad'],
        ['CASCO', 'Casco'],
        ['SILLA_PORTA_INFANTE', 'Silla porta infante'],
        ['OTRO', 'Otro'],
    ],

    tipo_violencia: [
        ['FISICA', 'Violencia física'],
        ['SEXUAL', 'Violencia sexual'],
        ['PSICOLOGICA', 'Violencia psicológica'],
        ['ECONOMICA_PATRIMONIAL', 'Violencia económica / patrimonial'],
        ['ABANDONO_NEGLIGENCIA', 'Abandono y/o negligencia'],
    ],

    numero_agresores: [
        ['UNO', 'Único(a)'],
        ['MAS_DE_UNO', 'Más de uno(a)'],
    ],

    agresor_sospecha_efectos: [
        ['ALCOHOL', 'Alcohol'],
        ['DROGA_INDICACION_MEDICA', 'Droga por indicación médica'],
        ['DROGAS_ILEGALES', 'Drogas ilegales'],
        ['SE_IGNORA', 'Se ignora'],
        ['NINGUNA', 'Ninguna'],
    ],

    evento_autoinfligido_ocurrio: [
        ['UNICA_VEZ', 'Única vez'],
        ['REPETIDO', 'Repetido'],
    ],

    agente_lesion: [
        ['FUEGO_FLAMA_SUSTANCIA_CALIENTE_VAPOR', 'Fuego, flama, sustancia caliente/vapor'],
        ['INTOXICACION_DROGAS_MEDICAMENTOS', 'Intoxicación por drogas o medicamentos'],
        ['PIE_MANO', 'Pie o mano'],
        ['CAIDA', 'Caída'],

        ['OBJETO_CONTUNDENTE', 'Objeto contundente'],
        ['OBJETO_PUNZOCORTANTE', 'Objeto punzocortante'],
        ['GOLPE_CONTRA_PISO_PARED', 'Golpe contra piso o pared'],
        ['CUERPO_EXTRAÑO', 'Cuerpo extraño'],

        ['EXPLOSION', 'Explosión'],
        ['ASFIXIA_SOFOCACION', 'Asfixia o sofocación'],
        ['MULTIPLES_AGENTES', 'Múltiples agentes'],
        ['PROYECTIL_ARMA_FUEGO', 'Proyectil de arma de fuego'],
        ['AHORCAMIENTO', 'Ahorcamiento'],

        ['RADIACION', 'Radiación'],
        ['SUSTANCIAS_QUIMICAS', 'Sustancias químicas'],
        ['CORRIENTE_ELECTRICA', 'Corriente eléctrica'],
        ['HERRAMIENTA_MAQUINARIA', 'Herramienta o maquinaria'],
        ['SACUDIDAS', 'Sacudidas'],

        ['DESASTRE_NATURAL', 'Desastre natural'],
        ['VEHICULO_MOTOR', 'Vehículo de motor'],
        ['AHOGAMIENTO_SUMERSION', 'Ahogamiento por sumersión'],
        ['PIQUETE_MORDEDURA_ANIMAL', 'Piquete / mordedura de animal'],
        ['FUERZAS_NATURALEZA', 'Fuerzas de la naturaleza'],

        ['INTOXICACION_PLANTAS_HONGOS', 'Intoxicación por plantas u hongos'],
        ['OTRA', 'Otra'],
        ['SE_IGNORA', 'Se ignora'],
        ['NO_APLICA', 'No aplica'],
    ],
    area_anatomica: [
        ['CABEZA', 'Cabeza'],
        ['CARA', 'Cara'],
        ['REGION_OCULAR', 'Región ocular'],
        ['CUELLO', 'Cuello'],
        ['COLUMNA_VERTEBRAL', 'Columna vertebral'],
        ['EXT_SUPERIORES', 'Extremidades superiores'],
        ['MANO', 'Mano'],
        ['TORAX', 'Tórax'],
        ['ESPALDA_GLUTEOS', 'Espalda y glúteos'],
        ['ABDOMEN', 'Abdomen'],
        ['PELVIS', 'Pelvis'],
        ['REGION_GENITAL', 'Región genital'],
        ['EXT_INFERIORES', 'Extremidades inferiores'],
        ['PIES', 'Pies'],
        ['MULTIPLES', 'Múltiples'],
        ['OTROS', 'Otros'],
        ['NO_HUBO_LESION', 'No hubo lesión'],
    ],

    consecuencia: [
        ['LACERACION_ABRASION', 'Laceración / abrasión'],
        ['APLASTAMIENTO', 'Aplastamiento'],
        ['CICATRICES', 'Cicatrices'],
        ['DEPRESION', 'Depresión'],
        ['CONTRACTURA_MAGULLAMIENTO', 'Contractura / magullamiento'],
        ['CONGELAMIENTO', 'Congelamiento'],
        ['ABORTO', 'Aborto'],
        ['TRASTORNOS_ANSIEDAD_ESTRES_POSTRAUMATICO', 'Trastornos de ansiedad / estrés postraumático'],
        ['QUEMADURA_CORROSION', 'Quemadura / corrosión'],
        ['ASFIXIA', 'Asfixia'],
        ['EMBARAZO', 'Embarazo'],
        ['TRASTORNOS_PSIQUIATRICOS', 'Trastornos psiquiátricos'],
        ['LUXACION_ESGUINCE', 'Luxación / esguince'],
        ['HERIDA', 'Herida'],
        ['INFECCION_TRANSMISION_SEXUAL', 'Infección de transmisión sexual'],
        ['MULTIPLE', 'Múltiple'],
        ['AMPUTACION_AVULSION', 'Amputación / avulsión'],
        ['FRACTURA', 'Fractura'],
        ['DEFUNCION', 'Defunción'],
        ['MALESTAR_EMOCIONAL', 'Malestar emocional'],
        ['TRASTORNO_ESTADO_ANIMO', 'Trastorno del estado de ánimo'],
        ['OTRA', 'Otra'],
    ],
    gravedad: [
        ['LEVE', 'Leve'],
        ['MODERADA', 'Moderada'],
        ['GRAVE', 'Grave'],
        ['FATAL', 'Fatal'],
        ['NO_ESPECIFICADO', 'No especificado'],
    ],
    servicio_otorgado: [
        ['CONSULTA_EXTERNA', 'Consulta externa'],
        ['URGENCIAS', 'Urgencias'],
        ['HOSPITALIZACION', 'Hospitalización'],
        ['REFERENCIA', 'Referencia'],
        ['OTRO', 'Otro'],
    ],

    tipo_atencion: [
        ['MEDICA', 'Médica'],
        ['PSICOLOGICA', 'Psicológica'],
        ['QUIRURGICA', 'Quirúrgica'],
        ['PSIQUIATRICA', 'Psiquiátrica'],
        ['CONSEJERIA', 'Consejería'],
        ['OTRA', 'Otra'],
        ['PAE', 'Píldora anticonceptiva de emergencia'],
        ['PROFILAXIS_VIH', 'Profilaxis VIH'],
        ['PROFILAXIS_ITS', 'Profilaxis otras ITS'],
        ['IVE', 'IVE / Interrupción voluntaria del embarazo'],
        ['VACUNA_VPH', 'Vacuna VPH'],
    ],

    aviso_ministerio_publico: [
        ['SI', 'Sí'],
        ['NO', 'No'],
    ],

    destino_despues_atencion: [
        ['DOMICILIO', 'Domicilio'],
        ['TRASLADO_UNIDAD_MEDICA', 'Traslado a otra unidad médica'],
        ['SERVICIO_ESPECIALIZADO_VIOLENCIA', 'Servicio especializado de atención a violencia'],
        ['CONSULTA_EXTERNA', 'Consulta externa'],
        ['DEFUNCION', 'Defunción'],
        ['REFUGIO_ALBERGUE', 'Refugio o albergue'],
        ['DIF', 'DIF'],
        ['HOSPITALIZACION', 'Hospitalización'],
        ['MINISTERIO_PUBLICO', 'Ministerio público'],
        ['GRUPO_AYUDA_MUTUA', 'Grupo de ayuda mutua'],
    ],

    responsable_atencion: [
        ['MEDICO_TRATANTE', 'Médica(o) tratante'],
        ['PSICOLOGO_TRATANTE', 'Psicóloga(o) tratante'],
        ['TRABAJADOR_SOCIAL', 'Trabajadora o trabajador social'],
        ['OTRA', 'Otra'],
    ],
};

const obtenerFechaHoy = () => new Date().toISOString().slice(0, 10);

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

const normalizarSexoFormulario = (valor) => {
    const texto = String(valor || '').trim().toUpperCase();

    if (texto === 'FEMENINO' || texto === 'MUJER') return 'MUJER';
    if (texto === 'MASCULINO' || texto === 'HOMBRE') return 'HOMBRE';
    if (texto === 'INTERSEXUAL') return 'INTERSEXUAL';

    return texto || '';
};

export default function ModalHojaViolenciaLesion({
    abierto,
    onClose,
    expediente,
    paciente,
    perfilDoctor,
}) {
    const [form, setForm] = useState(formInicial);
    const [guardando, setGuardando] = useState(false);
    const [hojaGuardada, setHojaGuardada] = useState(null);
    const [seccionActiva, setSeccionActiva] = useState('paciente');

    const nombrePaciente = useMemo(() => {
        return obtenerNombrePaciente(expediente, paciente);
    }, [expediente, paciente]);

    useEffect(() => {
        if (!abierto) return;

        setForm({
            ...formInicial,

            fecha_atencion: obtenerFechaHoy(),
            hora_atencion: obtenerHoraActual(),

            nombre_paciente:
                expediente?.nombre_paciente ||
                paciente?.nombre_paciente ||
                nombrePaciente ||
                '',
            primer_apellido: expediente?.primer_apellido || '',
            segundo_apellido: expediente?.segundo_apellido || '',

            curp: expediente?.curp || '',
            fecha_nacimiento: expediente?.fecha_nacimiento
                ? String(expediente.fecha_nacimiento).slice(0, 10)
                : '',

            entidad_pais_nacimiento:
                expediente?.entidad_nacimiento ||
                expediente?.nacionalidad ||
                '',

            edad_anios: paciente?.edad || expediente?.edad || '',
            edad_meses: '',
            edad_dias: '',

            sexo: normalizarSexoFormulario(paciente?.sexo || expediente?.sexo || ''),

            telefono: paciente?.telefono || expediente?.telefono || '',
            domicilio:
                expediente?.direccion ||
                expediente?.domicilio ||
                paciente?.domicilio ||
                '',
            entidad:
                expediente?.entidad ||
                expediente?.entidad_federativa ||
                expediente?.entidad_nacimiento ||
                paciente?.entidad ||
                '',
            municipio:
                expediente?.municipio ||
                expediente?.municipio_nombre ||
                expediente?.nombre_municipio ||
                paciente?.municipio ||
                '',
            localidad:
                expediente?.localidad ||
                expediente?.localidad_nombre ||
                expediente?.nombre_localidad ||
                paciente?.localidad ||
                '',
            ocupacion:
                expediente?.ocupacion ||
                paciente?.ocupacion ||
                '',

            diagnostico: paciente?.diagnostico || '',
            tratamiento: paciente?.observaciones || '',

            responsable_nombre: perfilDoctor?.nombre_completo || '',
            responsable_cedula: perfilDoctor?.cedula_profesional || '',
            responsable_atencion: 'MEDICO_TRATANTE',
        });

        setHojaGuardada(null);
        setSeccionActiva('paciente');
    }, [abierto, expediente, paciente, nombrePaciente, perfilDoctor]);

    if (!abierto) return null;

    const mostrarAlerta = (config) => {
        return Swal.fire({
            ...config,
            customClass: {
                container: 'swal-violencia-lesion-container',
                popup: 'swal-violencia-lesion-popup',
                ...(config.customClass || {}),
            },
        });
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const toggleMultiple = (name, value) => {
        setForm((prev) => {
            const actual = Array.isArray(prev[name]) ? prev[name] : [];

            if (actual.includes(value)) {
                return {
                    ...prev,
                    [name]: actual.filter((item) => item !== value),
                };
            }

            return {
                ...prev,
                [name]: [...actual, value],
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
            setSeccionActiva('paciente');
            return false;
        }

        if (!form.fecha_atencion) {
            mostrarAlerta({
                icon: 'warning',
                title: 'Fecha requerida',
                text: 'Captura la fecha de atención.',
            });
            setSeccionActiva('paciente');
            return false;
        }

        if (!form.intencionalidad) {
            mostrarAlerta({
                icon: 'warning',
                title: 'Intencionalidad requerida',
                text: 'Selecciona la intencionalidad del evento.',
            });
            setSeccionActiva('evento');
            return false;
        }

        if (!form.afeccion_principal?.trim()) {
            mostrarAlerta({
                icon: 'warning',
                title: 'Afección principal requerida',
                text: 'Captura la afección principal o lesión de mayor relevancia.',
            });
            setSeccionActiva('lesion');
            return false;
        }

        if (!form.causa_externa?.trim()) {
            mostrarAlerta({
                icon: 'warning',
                title: 'Causa externa requerida',
                text: 'Describe los acontecimientos, circunstancias y condiciones que causaron la lesión.',
            });
            setSeccionActiva('lesion');
            return false;
        }

        return true;
    };

    const preparar = async () => {
        if (hojaGuardada?.id_violencia_lesion) {
            mostrarAlerta({
                icon: 'info',
                title: 'Documento ya guardado',
                text: 'Esta hoja ya fue guardada. Puedes imprimirla o cerrar el modal.',
            });

            return;
        }

        if (!validar()) return;

        try {
            setGuardando(true);

            const payload = {
                ...form,
                id_expediente: expediente?.id_expediente || null,
                id_fila: paciente?.id_fila || null,
            };
            const data = await violenciaLesionService.crearHoja(payload);

            if (!data.ok) {
                throw new Error(data.mensaje || 'No se pudo guardar la hoja de violencia y/o lesión.');
            }

            setHojaGuardada(data.hoja);

            mostrarAlerta({
                icon: 'success',
                title: 'Hoja guardada',
                text: 'La hoja de violencia y/o lesión quedó guardada correctamente.',
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (error) {
            console.error('Error al guardar hoja de violencia/lesión:', error);

            mostrarAlerta({
                icon: 'error',
                title: 'Error',
                text:
                    error.response?.data?.mensaje ||
                    error.message ||
                    'No se pudo guardar la hoja de violencia y/o lesión.',
            });
        } finally {
            setGuardando(false);
        }
    };

    const imprimir = async () => {
        if (!validar()) return;

        let hojaFinal = hojaGuardada;

        if (!hojaFinal?.id_violencia_lesion) {
            const result = await mostrarAlerta({
                icon: 'question',
                title: 'Guardar antes de imprimir',
                text: 'Para imprimir esta hoja primero debe guardarse en el expediente del paciente.',
                showCancelButton: true,
                confirmButtonText: 'Guardar e imprimir',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#b91c1c',
                cancelButtonColor: '#64748b',
            });

            if (!result.isConfirmed) return;

            try {
                setGuardando(true);

                const payload = {
                    ...form,
                    id_expediente: expediente?.id_expediente || null,
                    id_fila: paciente?.id_fila || null,
                };

                const data = await violenciaLesionService.crearHoja(payload);

                if (!data.ok) {
                    throw new Error(
                        data.mensaje ||
                        'No se pudo guardar la hoja de violencia y/o lesión.'
                    );
                }

                hojaFinal = data.hoja;
                setHojaGuardada(data.hoja);

                await mostrarAlerta({
                    icon: 'success',
                    title: 'Hoja guardada',
                    text: 'Ahora se abrirá la ventana de impresión.',
                    timer: 1200,
                    showConfirmButton: false,
                });
            } catch (error) {
                console.error('Error al guardar hoja de violencia/lesión:', error);

                mostrarAlerta({
                    icon: 'error',
                    title: 'Error',
                    text:
                        error.response?.data?.mensaje ||
                        error.message ||
                        'No se pudo guardar la hoja de violencia y/o lesión.',
                });

                return;
            } finally {
                setGuardando(false);
            }
        }

        await new Promise((resolve) => {
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(resolve, 350);
                });
            });
        });

        const imprimible = document.getElementById('hoja-violencia-lesion-imprimible');

        if (!imprimible) {
            mostrarAlerta({
                icon: 'error',
                title: 'No se encontró el documento',
                text: 'No se pudo preparar la hoja para impresión.',
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

        const iframeDoc = iframe.contentWindow.document;

        /*
          Copiamos los estilos reales de la aplicación al iframe.
          Esto evita que el componente pierda formato al imprimir.
        */
        const estilosActuales = Array.from(
            document.querySelectorAll('style, link[rel="stylesheet"]')
        )
            .map((node) => node.outerHTML)
            .join('\n');

        iframeDoc.open();

        iframeDoc.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Hoja de violencia y lesión</title>

                ${estilosActuales}

                <style>
                    @page {
                        size: letter portrait;
                        margin: 5mm;
                    }

                    html,
                    body {
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        background: #ffffff !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    body {
                        display: flex !important;
                        justify-content: center !important;
                        align-items: flex-start !important;
                        overflow: visible !important;
                    }

                    body * {
                        visibility: visible !important;
                    }

                    #hoja-violencia-lesion-imprimible {
                        width: 100% !important;
                        max-width: 206mm !important;
                        margin: 0 auto !important;
                        padding: 0 !important;
                        background: #ffffff !important;
                        color: #0f172a !important;
                        box-sizing: border-box !important;
                        overflow: visible !important;
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }

                    #hoja-violencia-lesion-imprimible,
                    #hoja-violencia-lesion-imprimible * {
                        box-sizing: border-box !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }

                    #hoja-violencia-lesion-imprimible .vl-sheet {
                        width: 100% !important;
                        max-width: 206mm !important;
                        margin: 0 auto !important;
                        padding: 3mm 4mm !important;
                        border: 0 !important;
                        border-radius: 0 !important;
                        box-shadow: none !important;
                        background: #ffffff !important;
                        overflow: visible !important;
                        page-break-after: avoid !important;
                        break-after: avoid !important;
                    }

                    #hoja-violencia-lesion-imprimible .vl-header,
                    #hoja-violencia-lesion-imprimible .vl-box,
                    #hoja-violencia-lesion-imprimible .vl-footer {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }

                    #hoja-violencia-lesion-imprimible p,
                    #hoja-violencia-lesion-imprimible div,
                    #hoja-violencia-lesion-imprimible span {
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

        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();

            setTimeout(() => {
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            }, 700);
        }, 700);
    };

    const secciones = [
        ['paciente', 'Paciente'],
        ['evento', 'Evento'],
        ['lesion', 'Lesión / violencia'],
        ['cierre', 'Cierre'],
    ];

    return (
        <>
            <style>
                {`
                    .swal-violencia-lesion-container {
                        z-index: 20000 !important;
                    }

                    .swal-violencia-lesion-popup {
                        z-index: 20001 !important;
                    }
                `}
            </style>

            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm">
                <div className="relative z-[10000] flex max-h-[94vh] w-[96vw] max-w-[1580px] flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 no-print">
                        <div className="flex min-w-0 items-center gap-3">
                            <div className="shrink-0 rounded-2xl bg-red-100 p-3 text-red-700">
                                <FileWarning size={24} />
                            </div>

                            <div className="min-w-0">
                                <h2 className="truncate text-xl font-black text-slate-800">
                                    Hoja de violencia y/o lesión
                                </h2>
                                <p className="truncate text-sm text-slate-500">
                                    Registro clínico de apoyo cuando se sospechan lesiones por violencia o evento traumático.
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
                                <p className="mb-3 text-sm font-black text-slate-700">
                                    Parámetros del documento
                                </p>

                                <div className="flex flex-wrap gap-2 pb-1">
                                    {secciones.map(([key, label]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setSeccionActiva(key)}
                                            className={`rounded-2xl px-3 py-2 text-xs font-black transition ${seccionActiva === key
                                                ? 'bg-red-600 text-white shadow-sm'
                                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5">
                                {seccionActiva === 'paciente' && (
                                    <SeccionPaciente form={form} handleChange={handleChange} />
                                )}

                                {seccionActiva === 'evento' && (
                                    <SeccionEvento
                                        form={form}
                                        handleChange={handleChange}
                                        toggleMultiple={toggleMultiple}
                                    />
                                )}

                                {seccionActiva === 'lesion' && (
                                    <SeccionLesion
                                        form={form}
                                        handleChange={handleChange}
                                        toggleMultiple={toggleMultiple}
                                    />
                                )}

                                {seccionActiva === 'cierre' && (
                                    <SeccionCierre form={form} handleChange={handleChange} />
                                )}
                            </div>

                            <div className="border-t border-slate-100 bg-white px-5 py-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={preparar}
                                        disabled={guardando}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-60"
                                    >
                                        {guardando ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                        {hojaGuardada?.id_violencia_lesion
                                            ? `Guardada #${hojaGuardada.id_violencia_lesion}`
                                            : 'Guardar hoja'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={imprimir}
                                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800"
                                    >
                                        <Printer size={18} />
                                        Imprimir
                                    </button>
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
                                        Esta es la hoja que se enviará a impresión.
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
                                    <HojaViolenciaLesionImprimible
                                        expediente={expediente}
                                        paciente={paciente}
                                        perfilDoctor={perfilDoctor}
                                        datos={{
                                            ...form,
                                            ...(hojaGuardada || {}),
                                            id_violencia_lesion:
                                                hojaGuardada?.id_violencia_lesion || null,
                                            folio:
                                                hojaGuardada?.folio ||
                                                (hojaGuardada?.id_violencia_lesion
                                                    ? `VL-${hojaGuardada.id_violencia_lesion}`
                                                    : form.folio || ''),
                                            id_expediente:
                                                hojaGuardada?.id_expediente ||
                                                expediente?.id_expediente ||
                                                null,
                                        }}
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

function SeccionPaciente({ form, handleChange }) {
    return (
        <div className="space-y-5">
            <TituloSeccion
                titulo="Datos del paciente"
                descripcion="Información general de identificación, afiliación y datos sociodemográficos."
            />

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Identificación
                </h4>

                <div className="grid gap-4 md:grid-cols-2">

                    <CampoTexto
                        label="CURP"
                        name="curp"
                        value={form.curp}
                        onChange={handleChange}
                        placeholder="CURP"
                    />

                    <CampoTexto
                        label="Nombre(s) *"
                        name="nombre_paciente"
                        value={form.nombre_paciente}
                        onChange={handleChange}
                        placeholder="Nombre(s)"
                    />

                    <CampoTexto
                        label="Primer apellido"
                        name="primer_apellido"
                        value={form.primer_apellido}
                        onChange={handleChange}
                        placeholder="Primer apellido"
                    />

                    <CampoTexto
                        label="Segundo apellido"
                        name="segundo_apellido"
                        value={form.segundo_apellido}
                        onChange={handleChange}
                        placeholder="Segundo apellido"
                    />

                    <CampoTexto
                        label="Fecha de nacimiento"
                        type="date"
                        name="fecha_nacimiento"
                        value={form.fecha_nacimiento}
                        onChange={handleChange}
                    />

                    <CampoTexto
                        label="Entidad o país de nacimiento"
                        name="entidad_pais_nacimiento"
                        value={form.entidad_pais_nacimiento}
                        onChange={handleChange}
                        placeholder="Ej. Hidalgo / México"
                    />

                    <CampoSelect
                        label="Sexo"
                        name="sexo"
                        value={form.sexo}
                        onChange={handleChange}
                        opciones={OPCIONES.sexo}
                    />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Edad cumplida
                </h4>

                <div className="grid gap-4 md:grid-cols-3">
                    <CampoTexto
                        label="Años"
                        type="number"
                        name="edad_anios"
                        value={form.edad_anios}
                        onChange={handleChange}
                        placeholder="Años"
                    />

                    <CampoTexto
                        label="Meses"
                        type="number"
                        name="edad_meses"
                        value={form.edad_meses}
                        onChange={handleChange}
                        placeholder="Meses"
                    />

                    <CampoTexto
                        label="Días"
                        type="number"
                        name="edad_dias"
                        value={form.edad_dias}
                        onChange={handleChange}
                        placeholder="Días"
                    />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Domicilio y contacto
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                    <CampoTexto
                        label="Teléfono"
                        name="telefono"
                        value={form.telefono}
                        onChange={handleChange}
                        placeholder="Teléfono"
                    />

                    <CampoTexto
                        label="Domicilio"
                        name="domicilio"
                        value={form.domicilio}
                        onChange={handleChange}
                        placeholder="Calle, número, colonia..."
                    />

                    <CampoTexto
                        label="Entidad federativa"
                        name="entidad"
                        value={form.entidad}
                        onChange={handleChange}
                        placeholder="Ej. Hidalgo"
                    />

                    <CampoTexto
                        label="Municipio o alcaldía"
                        name="municipio"
                        value={form.municipio}
                        onChange={handleChange}
                        placeholder="Ej. Pachuca"
                    />

                    <CampoTexto
                        label="Localidad"
                        name="localidad"
                        value={form.localidad}
                        onChange={handleChange}
                        placeholder="Localidad"
                    />

                    <CampoTexto
                        label="Ocupación"
                        name="ocupacion"
                        value={form.ocupacion}
                        onChange={handleChange}
                        placeholder="Ocupación"
                    />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Afiliación a servicios de salud
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                    <CampoSelect
                        label="Afiliación"
                        name="afiliacion_salud"
                        value={form.afiliacion_salud}
                        onChange={handleChange}
                        opciones={OPCIONES.afiliacion_salud}
                    />

                    <CampoTexto
                        label="Número de afiliación"
                        name="numero_afiliacion"
                        value={form.numero_afiliacion}
                        onChange={handleChange}
                        placeholder="Número de afiliación"
                    />

                    <CampoSelect
                        label="Gratuidad"
                        name="gratuidad"
                        value={form.gratuidad}
                        onChange={handleChange}
                        opciones={OPCIONES.si_no}
                    />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Escolaridad y datos sociales
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                    <CampoSelect
                        label="Escolaridad"
                        name="escolaridad"
                        value={form.escolaridad}
                        onChange={handleChange}
                        opciones={OPCIONES.escolaridad}
                    />

                    <CampoSelect
                        label="Escolaridad completa/incompleta"
                        name="escolaridad_estado"
                        value={form.escolaridad_estado}
                        onChange={handleChange}
                        opciones={OPCIONES.escolaridad_estado}
                    />

                    <CampoSelect
                        label="¿Sabe leer y escribir?"
                        name="sabe_leer_escribir"
                        value={form.sabe_leer_escribir}
                        onChange={handleChange}
                        opciones={OPCIONES.si_no}
                    />

                    <CampoSelect
                        label="¿Se considera indígena?"
                        name="se_considera_indigena"
                        value={form.se_considera_indigena}
                        onChange={handleChange}
                        opciones={OPCIONES.si_no}
                    />

                    <CampoSelect
                        label="¿Habla alguna lengua indígena?"
                        name="habla_lengua_indigena"
                        value={form.habla_lengua_indigena}
                        onChange={handleChange}
                        opciones={OPCIONES.si_no}
                    />

                    <CampoTexto
                        label="¿Cuál lengua indígena?"
                        name="lengua_indigena"
                        value={form.lengua_indigena}
                        onChange={handleChange}
                        placeholder="Especifique"
                    />

                    <CampoSelect
                        label="¿Se considera afromexicano?"
                        name="se_considera_afromexicano"
                        value={form.se_considera_afromexicano}
                        onChange={handleChange}
                        opciones={OPCIONES.si_no}
                    />

                    <CampoSelect
                        label="¿Es migrante retornado?"
                        name="migrante_retornado"
                        value={form.migrante_retornado}
                        onChange={handleChange}
                        opciones={OPCIONES.si_no}
                    />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Mujer en edad fértil / discapacidad
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                    <CampoSelect
                        label="Mujer en edad fértil"
                        name="mujer_edad_fertil"
                        value={form.mujer_edad_fertil}
                        onChange={handleChange}
                        opciones={OPCIONES.mujer_edad_fertil}
                    />

                    <CampoTexto
                        label="Semanas de gestación"
                        type="number"
                        name="semanas_gestacion"
                        value={form.semanas_gestacion}
                        onChange={handleChange}
                        placeholder="Semanas"
                    />

                    <CampoSelect
                        label="Dificultad / discapacidad"
                        name="dificultad_discapacidad"
                        value={form.dificultad_discapacidad}
                        onChange={handleChange}
                        opciones={OPCIONES.si_no}
                    />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Referido por
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                    <CampoSelect
                        label="Referido por"
                        name="referido_por"
                        value={form.referido_por}
                        onChange={handleChange}
                        opciones={OPCIONES.referido_por}
                    />

                    <CampoTexto
                        label="Nombre / institución que refiere"
                        name="referido_por_nombre"
                        value={form.referido_por_nombre}
                        onChange={handleChange}
                        placeholder="Nombre o institución"
                    />
                </div>
            </section>
        </div>
    );
}

function SeccionEvento({ form, handleChange, toggleMultiple }) {
    return (
        <div className="space-y-5">
            <TituloSeccion
                titulo="Datos del evento"
                descripcion="Registra el sitio, domicilio de ocurrencia, intencionalidad y contexto del evento."
            />

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Sitio de ocurrencia
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                    <CampoTexto
                        label="Fecha de ocurrencia"
                        type="date"
                        name="fecha_ocurrencia"
                        value={form.fecha_ocurrencia}
                        onChange={handleChange}
                    />

                    <CampoTexto
                        label="Hora de ocurrencia"
                        type="time"
                        name="hora_ocurrencia"
                        value={form.hora_ocurrencia}
                        onChange={handleChange}
                    />

                    <CampoSelect
                        label="Sitio de ocurrencia"
                        name="sitio_ocurrencia"
                        value={form.sitio_ocurrencia}
                        onChange={handleChange}
                        opciones={OPCIONES.sitio_ocurrencia}
                    />

                    {form.sitio_ocurrencia === 'OTRO' && (
                        <CampoTexto
                            label="Especifique otro sitio"
                            name="sitio_ocurrencia_otro"
                            value={form.sitio_ocurrencia_otro}
                            onChange={handleChange}
                            placeholder="Especifique"
                        />
                    )}
                </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Domicilio donde ocurrió
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                    <CampoTexto
                        label="Entidad federativa"
                        name="entidad_ocurrencia"
                        value={form.entidad_ocurrencia}
                        onChange={handleChange}
                        placeholder="Ej. Hidalgo"
                    />

                    <CampoTexto
                        label="Municipio o alcaldía"
                        name="municipio_ocurrencia"
                        value={form.municipio_ocurrencia}
                        onChange={handleChange}
                        placeholder="Ej. Pachuca"
                    />

                    <CampoTexto
                        label="Localidad"
                        name="localidad_ocurrencia"
                        value={form.localidad_ocurrencia}
                        onChange={handleChange}
                        placeholder="Localidad"
                    />

                    <CampoTexto
                        label="Código postal"
                        name="codigo_postal_ocurrencia"
                        value={form.codigo_postal_ocurrencia}
                        onChange={handleChange}
                        placeholder="Código postal"
                    />

                    <CampoTexto
                        label="Tipo de vialidad"
                        name="tipo_vialidad"
                        value={form.tipo_vialidad}
                        onChange={handleChange}
                        placeholder="Calle, avenida, carretera..."
                    />

                    <CampoTexto
                        label="Nombre de la vialidad"
                        name="nombre_vialidad"
                        value={form.nombre_vialidad}
                        onChange={handleChange}
                        placeholder="Nombre de calle o vialidad"
                    />

                    <CampoTexto
                        label="Número exterior"
                        name="numero_exterior"
                        value={form.numero_exterior}
                        onChange={handleChange}
                        placeholder="Núm. ext."
                    />

                    <CampoTexto
                        label="Número interior"
                        name="numero_interior"
                        value={form.numero_interior}
                        onChange={handleChange}
                        placeholder="Núm. int."
                    />

                    <CampoTexto
                        label="Tipo de asentamiento humano"
                        name="tipo_asentamiento"
                        value={form.tipo_asentamiento}
                        onChange={handleChange}
                        placeholder="Colonia, fraccionamiento, barrio..."
                    />

                    <CampoTexto
                        label="Nombre del asentamiento humano"
                        name="nombre_asentamiento"
                        value={form.nombre_asentamiento}
                        onChange={handleChange}
                        placeholder="Nombre del asentamiento"
                    />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Agente de la lesión
                </h4>

                <GrupoMultiple
                    titulo="Seleccione uno o varios agentes"
                    name="agentes_lesion"
                    valores={form.agentes_lesion}
                    opciones={OPCIONES.agente_lesion}
                    onToggle={toggleMultiple}
                />
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Intencionalidad y atención prehospitalaria
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                    <CampoSelect
                        label="Intencionalidad del evento *"
                        name="intencionalidad"
                        value={form.intencionalidad}
                        onChange={handleChange}
                        opciones={OPCIONES.intencionalidad}
                    />

                    <CampoSelect
                        label="¿Recibió atención prehospitalaria?"
                        name="recibio_atencion_prehospitalaria"
                        value={form.recibio_atencion_prehospitalaria}
                        onChange={handleChange}
                        opciones={OPCIONES.recibio_atencion_prehospitalaria}
                    />

                    <CampoTexto
                        label="Tiempo de traslado - horas"
                        type="number"
                        name="tiempo_traslado_horas"
                        value={form.tiempo_traslado_horas}
                        onChange={handleChange}
                        placeholder="HH"
                    />

                    <CampoTexto
                        label="Tiempo de traslado - minutos"
                        type="number"
                        name="tiempo_traslado_minutos"
                        value={form.tiempo_traslado_minutos}
                        onChange={handleChange}
                        placeholder="MM"
                    />

                    <CampoSelect
                        label="Se sospecha que estaba bajo efectos de"
                        name="sospecha_efectos"
                        value={form.sospecha_efectos}
                        onChange={handleChange}
                        opciones={OPCIONES.sospecha_efectos}
                    />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Accidente de vehículo de motor
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                    <CampoSelect
                        label="¿La causa fue accidente de vehículo de motor?"
                        name="accidente_vehiculo_motor"
                        value={form.accidente_vehiculo_motor}
                        onChange={handleChange}
                        opciones={OPCIONES.accidente_vehiculo_motor}
                    />

                    <CampoSelect
                        label="La/el lesionada(o) es"
                        name="lesionado_es"
                        value={form.lesionado_es}
                        onChange={handleChange}
                        opciones={OPCIONES.lesionado_es}
                    />

                    <CampoSelect
                        label="¿Usó equipo de seguridad?"
                        name="uso_equipo_seguridad"
                        value={form.uso_equipo_seguridad}
                        onChange={handleChange}
                        opciones={OPCIONES.uso_equipo_seguridad}
                    />

                    <CampoSelect
                        label="Equipo de seguridad utilizado"
                        name="equipo_seguridad_utilizado"
                        value={form.equipo_seguridad_utilizado}
                        onChange={handleChange}
                        opciones={OPCIONES.equipo_seguridad_utilizado}
                    />
                </div>
            </section>
        </div>
    );
}


function SeccionLesion({ form, handleChange, toggleMultiple }) {
    return (
        <div className="space-y-5">
            <TituloSeccion
                titulo="Lesión / violencia"
                descripcion="Clasificación de violencia, datos del agresor, lesiones resultantes y causa externa."
            />

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Tipo de violencia
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                    <CampoSelect
                        label="Tipo de violencia"
                        name="tipo_violencia"
                        value={form.tipo_violencia}
                        onChange={handleChange}
                        opciones={OPCIONES.tipo_violencia}
                    />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Agresor(a)
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                    <CampoSelect
                        label="Número de agresores"
                        name="numero_agresores"
                        value={form.numero_agresores}
                        onChange={handleChange}
                        opciones={OPCIONES.numero_agresores}
                    />

                    <CampoTexto
                        label="Nombre probable agresor(a)"
                        name="agresor_nombre"
                        value={form.agresor_nombre}
                        onChange={handleChange}
                        placeholder="Nombre, si se conoce"
                    />

                    <CampoTexto
                        label="Parentesco con la/el afectada(o)"
                        name="agresor_parentesco"
                        value={form.agresor_parentesco}
                        onChange={handleChange}
                        placeholder="Ej. pareja, familiar, conocido..."
                    />

                    <CampoSelect
                        label="Sexo de la/el agresor(a)"
                        name="agresor_sexo"
                        value={form.agresor_sexo}
                        onChange={handleChange}
                        opciones={OPCIONES.sexo}
                    />

                    <CampoTexto
                        label="Edad de la/el agresor(a)"
                        type="number"
                        name="agresor_edad"
                        value={form.agresor_edad}
                        onChange={handleChange}
                        placeholder="Años"
                    />

                    <CampoSelect
                        label="Se sospecha que actuó bajo efectos de"
                        name="agresor_sospecha_efectos"
                        value={form.agresor_sospecha_efectos}
                        onChange={handleChange}
                        opciones={OPCIONES.agresor_sospecha_efectos}
                    />

                    <CampoSelect
                        label="En caso de evento autoinfligido, ocurrió"
                        name="evento_autoinfligido_ocurrio"
                        value={form.evento_autoinfligido_ocurrio}
                        onChange={handleChange}
                        opciones={OPCIONES.evento_autoinfligido_ocurrio}
                    />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Área anatómica de mayor gravedad
                </h4>

                <GrupoMultiple
                    titulo="Seleccione una o varias áreas"
                    name="areas_anatomicas"
                    valores={form.areas_anatomicas}
                    opciones={OPCIONES.area_anatomica}
                    onToggle={toggleMultiple}
                />

                {form.areas_anatomicas?.includes('OTROS') && (
                    <div className="mt-4">
                        <CampoTexto
                            label="Especifique otra área anatómica"
                            name="areas_anatomicas_otro"
                            value={form.areas_anatomicas_otro}
                            onChange={handleChange}
                            placeholder="Especifique"
                        />
                    </div>
                )}
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Consecuencia resultante de mayor gravedad
                </h4>

                <GrupoMultiple
                    titulo="Seleccione una o varias consecuencias"
                    name="consecuencias"
                    valores={form.consecuencias}
                    opciones={OPCIONES.consecuencia}
                    onToggle={toggleMultiple}
                />

                {form.consecuencias?.includes('OTRA') && (
                    <div className="mt-4">
                        <CampoTexto
                            label="Especifique otra consecuencia"
                            name="consecuencias_otro"
                            value={form.consecuencias_otro}
                            onChange={handleChange}
                            placeholder="Especifique"
                        />
                    </div>
                )}
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Afección principal y causa externa
                </h4>

                <div className="grid gap-4 md:grid-cols-[1fr_180px]">
                    <CampoTexto
                        label="Afección principal"
                        name="afeccion_principal"
                        value={form.afeccion_principal}
                        onChange={handleChange}
                        placeholder="Descripción de la afección principal"
                    />

                    <CampoTexto
                        label="Código CIE"
                        name="codigo_cie_afeccion_principal"
                        value={form.codigo_cie_afeccion_principal}
                        onChange={handleChange}
                        placeholder="Opcional"
                    />
                </div>

                <div className="mt-4">
                    <CampoArea
                        label="Causa externa / acontecimientos, circunstancias y condiciones que causan la lesión"
                        name="causa_externa"
                        value={form.causa_externa}
                        onChange={handleChange}
                        rows={4}
                    />
                </div>
            </section>
        </div>
    );
}

function SeccionCierre({ form, handleChange }) {
    return (
        <div className="space-y-5">
            <TituloSeccion
                titulo="Cierre y seguimiento"
                descripcion="Registra servicio otorgado, tipo de atención, aviso al Ministerio Público, destino posterior y responsable de atención."
            />

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Servicio y tipo de atención
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                    <CampoSelect
                        label="Servicio que otorgó la atención"
                        name="servicio_otorgado"
                        value={form.servicio_otorgado}
                        onChange={handleChange}
                        opciones={OPCIONES.servicio_otorgado}
                    />

                    <CampoSelect
                        label="Tipo de atención"
                        name="tipo_atencion"
                        value={form.tipo_atencion}
                        onChange={handleChange}
                        opciones={OPCIONES.tipo_atencion}
                    />
                </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Aviso y destino después de la atención
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                    <CampoSelect
                        label="¿Se dio aviso al Ministerio Público?"
                        name="aviso_ministerio_publico"
                        value={form.aviso_ministerio_publico}
                        onChange={handleChange}
                        opciones={OPCIONES.aviso_ministerio_publico}
                    />

                    <CampoSelect
                        label="Destino después de la atención"
                        name="destino_despues_atencion"
                        value={form.destino_despues_atencion}
                        onChange={handleChange}
                        opciones={OPCIONES.destino_despues_atencion}
                    />

                    {form.destino_despues_atencion === 'DEFUNCION' && (
                        <CampoTexto
                            label="Folio del certificado de defunción"
                            name="defuncion_folio_certificado"
                            value={form.defuncion_folio_certificado}
                            onChange={handleChange}
                            placeholder="Folio del certificado"
                        />
                    )}
                </div>
            </section>

            <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <h4 className="mb-4 text-sm font-black uppercase tracking-wide text-slate-500">
                    Responsable de la atención
                </h4>

                <div className="grid gap-4 md:grid-cols-2">
                    <CampoSelect
                        label="Responsable de la atención"
                        name="responsable_atencion"
                        value={form.responsable_atencion}
                        onChange={handleChange}
                        opciones={OPCIONES.responsable_atencion}
                    />

                    <CampoTexto
                        label="Nombre(s)"
                        name="responsable_nombre"
                        value={form.responsable_nombre}
                        onChange={handleChange}
                        placeholder="Nombre(s)"
                    />

                    <CampoTexto
                        label="Primer apellido"
                        name="responsable_primer_apellido"
                        value={form.responsable_primer_apellido}
                        onChange={handleChange}
                        placeholder="Primer apellido"
                    />

                    <CampoTexto
                        label="Segundo apellido"
                        name="responsable_segundo_apellido"
                        value={form.responsable_segundo_apellido}
                        onChange={handleChange}
                        placeholder="Segundo apellido"
                    />

                    <CampoTexto
                        label="CURP"
                        name="responsable_curp"
                        value={form.responsable_curp}
                        onChange={handleChange}
                        placeholder="CURP"
                    />

                    <CampoTexto
                        label="Cédula profesional"
                        name="responsable_cedula"
                        value={form.responsable_cedula}
                        onChange={handleChange}
                        placeholder="Cédula profesional"
                    />
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
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
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
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
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
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
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
                                ? 'border-red-300 bg-red-50 text-red-700'
                                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            <span
                                className={`flex h-5 w-5 items-center justify-center rounded-md border ${activo
                                    ? 'border-red-600 bg-red-600 text-white'
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
