import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
    X,
    Save,
    Printer,
    Loader2,
    BadgeCheck,
    UserRound,

} from 'lucide-react';

import api from '../../api/axios';
import CertificadoMedicoImprimible from './CertificadoMedicoImprimible';

const TIPOS_CERTIFICADO = {
    LABORAL: {
        label: 'Laboral',
        badge: 'CERTIFICADO LABORAL',
        destino: 'Laboral',
        conclusion:
            'Por lo anterior, se concluye que el paciente se encuentra apto para realizar sus actividades laborales.',
    },
    ESCOLAR: {
        label: 'Escolar',
        badge: 'CERTIFICADO ESCOLAR',
        destino: 'Escolar',
        conclusion:
            'Por lo anterior, se concluye que el paciente se encuentra apto para realizar sus actividades escolares.',
    },
    PRENUPCIAL: {
        label: 'Prenupcial',
        badge: 'CERTIFICADO PRENUPCIAL',
        destino: 'Prenupcial',
        conclusion:
            'Por lo anterior, se expide el presente certificado médico para los fines prenupciales correspondientes.',
    },
    PERSONALIZADO: {
        label: 'Personalizado',
        badge: 'CERTIFICADO MÉDICO',
        destino: '',
        conclusion:
            'Por lo anterior, se expide el presente certificado médico a solicitud del interesado para los fines que estime convenientes.',
    },
};

const formatearFechaInput = () => {
    const hoy = new Date();
    return hoy.toISOString().slice(0, 10);
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

const obtenerNombrePaciente = (expediente = {}, paciente = {}) => {
    return (
        [
            expediente?.nombre_paciente || paciente?.nombre_paciente,
            expediente?.primer_apellido,
            expediente?.segundo_apellido,
        ]
            .filter(Boolean)
            .join(' ') ||
        paciente?.nombre_paciente ||
        'Paciente'
    );
};

const primerValor = (...valores) => {
    const encontrado = valores.find((valor) => {
        if (valor === undefined || valor === null) return false;
        return String(valor).trim() !== '';
    });

    return encontrado !== undefined && encontrado !== null
        ? String(encontrado).trim()
        : '';
};

const normalizarNumero = (valor) => {
    if (valor === undefined || valor === null || valor === '') return null;

    const texto = String(valor)
        .replace(',', '.')
        .replace(/[^\d.]/g, '');

    const numero = Number(texto);

    return Number.isFinite(numero) ? numero : null;
};

const formatearDecimal = (valor, decimales = 1) => {
    const numero = normalizarNumero(valor);

    if (numero === null) return '';

    return numero.toLocaleString('es-MX', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimales,
    });
};

const formatearTalla = (valor) => {
    const numero = normalizarNumero(valor);

    if (numero === null) return '';

    const tallaMetros = numero > 3 ? numero / 100 : numero;

    return tallaMetros.toLocaleString('es-MX', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const formatearPorcentaje = (valor) => {
    const texto = primerValor(valor);

    if (!texto) return '';

    if (texto.includes('%')) return texto;

    return `${texto}%`;
};

const formatearTemperatura = (valor) => {
    const texto = primerValor(valor);

    if (!texto) return '';

    if (texto.toLowerCase().includes('°c') || texto.toLowerCase().endsWith('c')) {
        return texto;
    }

    return `${texto} °C`;
};

const formatearPresionArterial = (valor) => {
    const texto = primerValor(valor);

    if (!texto) return '';

    if (texto.toLowerCase().includes('mmhg')) return texto;

    return `${texto} mmHg`;
};

const calcularIMC = (peso, talla) => {
    const pesoNum = normalizarNumero(peso);
    const tallaNum = normalizarNumero(talla);

    if (!pesoNum || !tallaNum) return '';

    const tallaMetros = tallaNum > 3 ? tallaNum / 100 : tallaNum;
    const imc = pesoNum / (tallaMetros * tallaMetros);

    if (!Number.isFinite(imc)) return '';

    return imc.toFixed(1);
};

const obtenerSignosVitales = (expediente = {}) => {
    return (
        expediente.signos_vitales ||
        expediente.signosVitales ||
        expediente.vitales ||
        expediente.ultima_toma_signos ||
        expediente.ultimo_signos_vitales ||
        {}
    );
};

const obtenerExploracionFisicaDesdeExpediente = (expediente = {}) => {
    const signos = obtenerSignosVitales(expediente);

    const peso = primerValor(
        expediente.peso,
        expediente.peso_kg,
        expediente.peso_actual,
        expediente.ultimo_peso,
        signos.peso,
        signos.peso_kg
    );

    const talla = primerValor(
        expediente.talla,
        expediente.talla_m,
        expediente.estatura,
        expediente.altura,
        expediente.altura_m,
        expediente.ultima_talla,
        signos.talla,
        signos.talla_m,
        signos.estatura,
        signos.altura
    );

    const imc =
        primerValor(
            expediente.imc,
            expediente.indice_masa_corporal,
            expediente.masa_corporal,
            signos.imc,
            signos.indice_masa_corporal,
            signos.masa_corporal
        ) || calcularIMC(peso, talla);

    const frecuenciaCardiaca = primerValor(
        expediente.frecuencia_cardiaca,
        expediente.fc,
        expediente.f_c,
        expediente.pulso,
        signos.frecuencia_cardiaca,
        signos.fc,
        signos.f_c,
        signos.pulso
    );

    const saturacionOxigeno = primerValor(
        expediente.saturacion_oxigeno,
        expediente.saturacion,
        expediente.spo2,
        expediente.spo_2,
        expediente.oxigenacion,
        signos.saturacion_oxigeno,
        signos.saturacion,
        signos.spo2,
        signos.spo_2,
        signos.oxigenacion
    );

    const frecuenciaRespiratoria = primerValor(
        expediente.frecuencia_respiratoria,
        expediente.fr,
        expediente.f_r,
        signos.frecuencia_respiratoria,
        signos.fr,
        signos.f_r
    );

    const presionArterial = primerValor(
        expediente.presion_arterial,
        expediente.ta,
        expediente.t_a,
        expediente.tension_arterial,
        signos.presion_arterial,
        signos.ta,
        signos.t_a,
        signos.tension_arterial
    );

    const temperatura = primerValor(
        expediente.temperatura,
        expediente.temp,
        signos.temperatura,
        signos.temp
    );

    const datos = [];

    if (peso) datos.push(`peso de ${formatearDecimal(peso, 2)} kg`);
    if (talla) datos.push(`talla de ${formatearTalla(talla)} m`);
    if (imc) datos.push(`índice de masa corporal de ${formatearDecimal(imc, 1)} kg/m²`);
    if (frecuenciaCardiaca) datos.push(`frecuencia cardiaca de ${formatearDecimal(frecuenciaCardiaca, 0)} latidos por minuto`);
    if (saturacionOxigeno) datos.push(`saturación de oxígeno ${formatearPorcentaje(saturacionOxigeno)}`);
    if (frecuenciaRespiratoria) datos.push(`frecuencia respiratoria de ${formatearDecimal(frecuenciaRespiratoria, 0)} respiraciones por minuto`);
    if (presionArterial) datos.push(`presión arterial de ${formatearPresionArterial(presionArterial)}`);
    if (temperatura) datos.push(`temperatura corporal de ${formatearTemperatura(temperatura)}`);

    const signosVitales = datos.length > 0 ? datos.join(', ') : '';

    if (signosVitales) {
        return `A la exploración física, ${signosVitales}. Paciente consciente, orientado, con adecuada coloración de tegumentos, sin datos clínicos de dificultad respiratoria al momento de la valoración, sin compromiso cardiopulmonar evidente y con extremidades íntegras.`;
    }

    return 'A la exploración física se encuentra paciente consciente, orientado, con adecuada coloración de tegumentos, sin datos clínicos de dificultad respiratoria al momento de la valoración, sin compromiso cardiopulmonar evidente y con extremidades íntegras.';
};

const obtenerAntecedentesDesdeExpediente = (expediente = {}) => {
    const antecedentes = [];

    const tipoSangre = primerValor(
        expediente.tipo_sangre,
        expediente.grupo_sanguineo,
        expediente.grupo_sanguineo_rh,
        expediente.sangre,
        expediente.rh
    );

    if (tipoSangre) {
        antecedentes.push(`Tipo de sangre / grupo sanguíneo: ${tipoSangre}.`);
    }

    if (expediente.enfermedades_condiciones) {
        antecedentes.push(`Condiciones/enfermedades: ${expediente.enfermedades_condiciones}.`);
    }

    if (expediente.alergias) {
        antecedentes.push(`Alergias: ${expediente.alergias}.`);
    }

    if (expediente.medicamentos_actuales) {
        antecedentes.push(`Medicamentos actuales: ${expediente.medicamentos_actuales}.`);
    }

    if (expediente.esquema_vacunacion) {
        antecedentes.push(`Esquema de vacunación: ${expediente.esquema_vacunacion}.`);
    }

    if (expediente.observaciones_generales) {
        antecedentes.push(`Observaciones generales: ${expediente.observaciones_generales}.`);
    }

    return antecedentes.length
        ? antecedentes.join('\n')
        : 'Antecedentes personales patológicos interrogados y negados, alergias interrogadas y negadas.';
};

export default function ModalCertificadoMedico({
    abierto,
    onClose,
    expediente,
    paciente,
    perfilDoctor,
    idFila = null,
    tipoAtencion = null,
    onGuardado,
}) {
    const [guardando, setGuardando] = useState(false);
    const [form, setForm] = useState({
        tipo_certificado: 'LABORAL',
        folio_certificado: '',
        lugar_expedicion: 'Pachuca Hidalgo',
        fecha_expedicion: formatearFechaInput(),
        destinatario: 'A quien corresponda',
        finalidad: 'Laboral',
        estado_salud: 'BUEN ESTADO DE SALUD ACTUAL',
        antecedentes: '',
        exploracion_fisica: '',
        conclusion: TIPOS_CERTIFICADO.LABORAL.conclusion,
        observaciones: '',
        texto_libre: '',
    });

    const nombrePaciente = useMemo(() => {
        return obtenerNombrePaciente(expediente, paciente);
    }, [expediente, paciente]);

    const logoUniversidadUrl = obtenerUrlArchivo(perfilDoctor?.logo_universidad_url || '');

    const sexoPaciente =
        expediente?.sexo ||
        paciente?.sexo ||
        'No especificado';

    const edadPaciente =
        expediente?.edad ||
        paciente?.edad ||
        'N/A';

    const fechaNacimiento =
        expediente?.fecha_nacimiento ||
        expediente?.fecha_nac ||
        expediente?.fechaNacimiento ||
        paciente?.fecha_nacimiento ||
        paciente?.fecha_nac ||
        paciente?.fechaNacimiento ||
        '';

    useEffect(() => {
        if (!abierto) return;

        setForm((prev) => ({
            ...prev,
            antecedentes: obtenerAntecedentesDesdeExpediente(expediente),
            exploracion_fisica: obtenerExploracionFisicaDesdeExpediente(expediente),
        }));
    }, [abierto, expediente]);

    if (!abierto) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => {
            const cambios = {
                ...prev,
                [name]: value,
            };

            if (name === 'tipo_certificado') {
                const info = TIPOS_CERTIFICADO[value] || TIPOS_CERTIFICADO.PERSONALIZADO;

                cambios.finalidad = info.destino;
                cambios.conclusion = info.conclusion;
            }

            return cambios;
        });
    };

    const validar = () => {
        if (!expediente?.id_expediente) {
            Swal.fire({
                icon: 'warning',
                title: 'Expediente requerido',
                text: 'Selecciona un expediente clínico antes de generar el certificado.',
            });

            return false;
        }

        if (!perfilDoctor?.nombre_completo || !perfilDoctor?.cedula_profesional) {
            Swal.fire({
                icon: 'warning',
                title: 'Perfil médico incompleto',
                text: 'El perfil del doctor debe tener nombre y cédula profesional.',
            });

            return false;
        }

        if (!form.estado_salud.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Estado de salud requerido',
                text: 'Ingresa el estado de salud del paciente.',
            });

            return false;
        }

        if (!form.conclusion.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'Conclusión requerida',
                text: 'Ingresa la conclusión del certificado.',
            });

            return false;
        }

        return true;
    };

    const guardarCertificado = async ({ imprimirDespues = false } = {}) => {
        if (!validar()) return;

        // Si ya tiene folio, significa que ya fue guardado.
        // En ese caso no intentamos guardar otra vez; solo imprimimos.
        if (form.folio_certificado && imprimirDespues) {
            setTimeout(() => {
                window.print();
            }, 250);

            return {
                ok: true,
                certificado: {
                    folio_certificado: form.folio_certificado,
                },
                yaGuardado: true,
            };
        }

        try {
            setGuardando(true);

            const payload = {
                id_expediente: Number(expediente.id_expediente),
                id_fila: idFila ? Number(idFila) : null,
                tipo_atencion: tipoAtencion || null,

                tipo_certificado: form.tipo_certificado,

                // IMPORTANTE:
                // Si es nuevo, mandamos null para que backend genere folio.
                // No conviene reenviar un folio ya existente.
                folio_certificado: form.folio_certificado || null,

                lugar_expedicion: form.lugar_expedicion || null,
                fecha_expedicion: form.fecha_expedicion || null,
                destinatario: form.destinatario || null,
                finalidad: form.finalidad || null,
                estado_salud: form.estado_salud || null,
                antecedentes: form.antecedentes || null,
                exploracion_fisica: form.exploracion_fisica || null,
                conclusion: form.conclusion || null,
                observaciones: form.observaciones || null,
                texto_libre: form.texto_libre || null,

                datos_paciente: {
                    nombre_paciente: nombrePaciente,
                    edad: edadPaciente,
                    sexo: sexoPaciente,
                    fecha_nacimiento: fechaNacimiento,
                    telefono: expediente?.telefono || paciente?.telefono || null,
                    id_expediente: expediente?.id_expediente || null,
                },

                datos_doctor: {
                    nombre_completo: perfilDoctor?.nombre_completo || null,
                    cedula_profesional: perfilDoctor?.cedula_profesional || null,
                    especialidad: perfilDoctor?.especialidad || null,
                    telefono: perfilDoctor?.telefono || null,
                    correo: perfilDoctor?.correo || null,
                    direccion_consultorio: perfilDoctor?.direccion_consultorio || null,
                    logo_universidad_url: perfilDoctor?.logo_universidad_url || null,
                },
            };

            const { data } = await api.post('/doctor-shaddai/certificados', payload);

            if (!data.ok) {
                throw new Error(data.mensaje || 'No se pudo guardar el certificado.');
            }

            const folioGuardado = data.certificado?.folio_certificado || '';

            if (folioGuardado) {
                setForm((prev) => ({
                    ...prev,
                    folio_certificado: folioGuardado,
                }));
            }

            if (onGuardado) {
                onGuardado(data);
            }

            if (imprimirDespues) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Certificado guardado',
                    text: 'Preparando impresión...',
                    timer: 900,
                    showConfirmButton: false,
                });

                setTimeout(() => {
                    window.print();
                }, 250);
            } else {
                Swal.fire({
                    icon: 'success',
                    title: 'Certificado guardado',
                    text: 'El certificado médico se guardó correctamente.',
                    timer: 1600,
                    showConfirmButton: false,
                });
            }

            return data;
        } catch (error) {
            console.error('Error al guardar certificado médico:', error);

            const esFolioDuplicado =
                error.response?.status === 409 ||
                String(error.response?.data?.mensaje || '').toLowerCase().includes('folio') ||
                String(error.message || '').toLowerCase().includes('folio');

            // Si intentó guardar e imprimir, pero el certificado ya existía,
            // no bloqueamos al usuario: imprimimos el documento actual.
            if (imprimirDespues && esFolioDuplicado) {
                await Swal.fire({
                    icon: 'info',
                    title: 'Certificado ya guardado',
                    text: 'Ya existe un certificado con ese folio. Se imprimirá el documento actual.',
                    timer: 1200,
                    showConfirmButton: false,
                });

                setTimeout(() => {
                    window.print();
                }, 250);

                return {
                    ok: true,
                    yaExistia: true,
                };
            }

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text:
                    error.response?.data?.mensaje ||
                    error.message ||
                    'No se pudo guardar el certificado médico.',
            });

            return null;
        } finally {
            setGuardando(false);
        }
    };

    const imprimirCertificado = () => {
        if (!validar()) return;

        setTimeout(() => {
            window.print();
        }, 250);
    };

    const tipoInfo =
        TIPOS_CERTIFICADO[form.tipo_certificado] ||
        TIPOS_CERTIFICADO.PERSONALIZADO;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-3 py-4 sm:px-4 sm:py-8">


            <style>
                {`
    .certificado-print-root {
      display: none;
    }

    @media print {
      html,
      body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
      }

      body * {
        visibility: hidden !important;
      }

      .no-print {
        display: none !important;
      }

      .certificado-print-root {
        display: block !important;
        visibility: visible !important;
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        min-height: 100vh !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        z-index: 999999 !important;
      }

      .certificado-print-root,
      .certificado-print-root * {
        visibility: visible !important;
      }

      #certificado-medico-imprimible {
        display: block !important;
        width: 100% !important;
        min-height: auto !important;
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
        overflow: visible !important;
      }

      @page {
        size: letter portrait;
        margin: 8mm;
      }
    }
  `}
            </style>

            <div
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm no-print"
                onClick={onClose}
            />

            <div className="relative w-full max-w-7xl overflow-hidden rounded-3xl bg-white shadow-2xl no-print">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                    <div>
                        <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700">
                            <BadgeCheck size={14} />
                            Certificado médico
                        </div>

                        <h2 className="text-xl font-black text-slate-800">
                            Generar certificado
                        </h2>

                        <p className="text-sm text-slate-500">
                            Escolar, laboral, prenupcial o personalizado.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="grid max-h-[78vh] grid-cols-1 overflow-y-auto lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="border-r border-slate-100 p-5 sm:p-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Tipo de certificado *
                                </label>

                                <select
                                    name="tipo_certificado"
                                    value={form.tipo_certificado}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-sky-500"
                                >
                                    {Object.entries(TIPOS_CERTIFICADO).map(([value, info]) => (
                                        <option key={value} value={value}>
                                            {info.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Lugar de expedición
                                </label>

                                <input
                                    name="lugar_expedicion"
                                    value={form.lugar_expedicion}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                                    placeholder="Ej. Pachuca Hidalgo"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Fecha
                                </label>

                                <input
                                    type="date"
                                    name="fecha_expedicion"
                                    value={form.fecha_expedicion}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Destinatario
                                </label>

                                <input
                                    name="destinatario"
                                    value={form.destinatario}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                                    placeholder="A quien corresponda"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Finalidad
                                </label>

                                <input
                                    name="finalidad"
                                    value={form.finalidad}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                                    placeholder="Laboral, escolar, prenupcial..."
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Estado de salud *
                                </label>

                                <input
                                    name="estado_salud"
                                    value={form.estado_salud}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                                    placeholder="BUEN ESTADO DE SALUD ACTUAL"
                                />
                            </div>

                            <div className="md:col-span-2 rounded-3xl border border-sky-100 bg-sky-50 p-4">
                                <div className="mb-2 flex items-center gap-2 text-sm font-black text-sky-800">
                                    <UserRound size={18} />
                                    Datos cargados del expediente
                                </div>

                                <div className="grid gap-2 text-sm text-slate-700 md:grid-cols-2">
                                    <p>
                                        <b>Paciente:</b> {nombrePaciente}
                                    </p>
                                    <p>
                                        <b>Expediente:</b> #{expediente?.id_expediente || 'N/A'}
                                    </p>
                                    <p>
                                        <b>Edad:</b> {edadPaciente}
                                    </p>
                                    <p>
                                        <b>Sexo:</b> {sexoPaciente}
                                    </p>
                                    <p className="md:col-span-2">
                                        <b>Fecha nacimiento:</b>{' '}
                                        {fechaNacimiento ? formatearFechaCorta(fechaNacimiento) : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Antecedentes relevantes
                                </label>

                                <textarea
                                    name="antecedentes"
                                    value={form.antecedentes}
                                    onChange={handleChange}
                                    rows="4"
                                    className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                                    placeholder="Antecedentes relevantes del paciente..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Exploración física
                                </label>

                                <textarea
                                    name="exploracion_fisica"
                                    value={form.exploracion_fisica}
                                    onChange={handleChange}
                                    rows="5"
                                    className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                                    placeholder="Hallazgos de la exploración física..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Conclusión *
                                </label>

                                <textarea
                                    name="conclusion"
                                    value={form.conclusion}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                                    placeholder="Conclusión del certificado..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Texto libre adicional
                                </label>

                                <textarea
                                    name="texto_libre"
                                    value={form.texto_libre}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                                    placeholder="Información adicional que el médico desee agregar..."
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-2 block text-sm font-bold text-slate-700">
                                    Observaciones internas
                                </label>

                                <input
                                    name="observaciones"
                                    value={form.observaciones}
                                    onChange={handleChange}
                                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-sky-500"
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-100 p-5 sm:p-6">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h3 className="font-black text-slate-800">Vista previa</h3>
                                <p className="text-sm text-slate-500">
                                    Así se imprimirá el certificado.
                                </p>
                            </div>


                        </div>

                        <CertificadoMedicoImprimible
                            form={form}
                            tipoInfo={tipoInfo}
                            expediente={expediente}
                            paciente={paciente}
                            perfilDoctor={perfilDoctor}
                            nombrePaciente={nombrePaciente}
                            edadPaciente={edadPaciente}
                            sexoPaciente={sexoPaciente}
                            fechaNacimiento={fechaNacimiento}
                            logoUniversidadUrl={logoUniversidadUrl}
                        />
                    </div>
                </div>

                <div className="flex flex-col justify-end gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:px-6">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-200"
                    >
                        Cancelar
                    </button>

                    <button
                        type="button"
                        onClick={() => guardarCertificado({ imprimirDespues: true })}
                        disabled={guardando}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {guardando ? (
                            <Loader2 size={18} className="animate-spin" />
                        ) : (
                            <Printer size={18} />
                        )}

                        {guardando
                            ? 'Guardando...'
                            : form.folio_certificado
                                ? 'Imprimir certificado'
                                : 'Guardar e imprimir'}
                    </button>
                </div>
            </div>


            <div className="certificado-print-root">
                <CertificadoMedicoImprimible
                    form={form}
                    tipoInfo={tipoInfo}
                    expediente={expediente}
                    paciente={paciente}
                    perfilDoctor={perfilDoctor}
                    nombrePaciente={nombrePaciente}
                    edadPaciente={edadPaciente}
                    sexoPaciente={sexoPaciente}
                    fechaNacimiento={fechaNacimiento}
                    logoUniversidadUrl={logoUniversidadUrl}
                />
            </div>
        </div>
    );
}
