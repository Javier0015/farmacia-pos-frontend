import { useEffect, useMemo, useState } from 'react';
import {
  X,
  Save,
  Loader2,
  ClipboardPlus,
  Activity,
  UserRound,
  Stethoscope,
  FileText,
  History,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { notasMedicasService } from '../../services/notasMedicasService';

const formInicial = {
  motivo_consulta: '',
  diagnostico: '',
  antecedentes_padecimiento_actual: '',
  exploracion_fisica: '',
  plan: '',
  pronostico: '',
  pasa_a: '',
  observaciones: '',

  peso_kg: '',
  talla_cm: '',
  imc: '',
  presion_arterial: '',
  frecuencia_cardiaca: '',
  temperatura: '',
  saturacion_oxigeno: '',
};

const TIPOS_NOTA = {
  NOTA_INICIAL: {
    value: 'NOTA_INICIAL',
    label: 'Nota médica inicial',
    titulo: 'Nueva valoración clínica',
    descripcion:
      'Úsala para la primera consulta del paciente o cuando inicia un nuevo padecimiento/proceso clínico.',
    icono: FileText,
    badge: 'bg-sky-100 text-sky-700 border-sky-200',
    cardSelected: 'border-sky-400 bg-sky-50 ring-2 ring-sky-100',
  },
  NOTA_EVOLUCION: {
    value: 'NOTA_EVOLUCION',
    label: 'Nota de evolución',
    titulo: 'Seguimiento posterior',
    descripcion:
      'Úsala cuando el paciente regresa por seguimiento, control, evolución o ajuste de tratamiento.',
    icono: History,
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    cardSelected: 'border-emerald-400 bg-emerald-50 ring-2 ring-emerald-100',
  },
};

const normalizarTipoNota = (tipoNota) => {
  const tipo = String(tipoNota || '').trim().toUpperCase();
  return TIPOS_NOTA[tipo] ? tipo : 'NOTA_INICIAL';
};

const calcularIMC = (pesoKg, tallaCm) => {
  const peso = Number(pesoKg);
  const talla = Number(tallaCm);

  if (!peso || !talla) return '';

  const tallaMetros = talla / 100;

  if (tallaMetros <= 0) return '';

  return (peso / (tallaMetros * tallaMetros)).toFixed(2);
};

const obtenerNombreCompleto = (expediente, paciente) => {
  if (paciente?.nombre_paciente) return paciente.nombre_paciente;

  const partes = [
    expediente?.nombre_paciente,
    expediente?.primer_apellido,
    expediente?.segundo_apellido,
  ].filter(Boolean);

  return partes.length ? partes.join(' ') : 'Paciente';
};

export default function ModalNotaMedica({
  abierto,
  onClose,
  expediente,
  paciente,
  idFila,
  idSucursal,
  tipoNota = 'NOTA_INICIAL',
  tipoNotaLabel,
  notasPrevias = [],
  onGuardada,
}) {
  const [form, setForm] = useState(formInicial);
  const [guardando, setGuardando] = useState(false);
  const [tipoNotaSeleccionado, setTipoNotaSeleccionado] = useState(
    normalizarTipoNota(tipoNota)
  );

  const nombrePaciente = useMemo(() => {
    return obtenerNombreCompleto(expediente, paciente);
  }, [expediente, paciente]);

  const tipoSugerido = useMemo(() => {
    return normalizarTipoNota(tipoNota);
  }, [tipoNota]);

  const infoTipoSeleccionado = TIPOS_NOTA[tipoNotaSeleccionado];
  const infoTipoSugerido = TIPOS_NOTA[tipoSugerido];
  const tieneNotasPrevias = Array.isArray(notasPrevias) && notasPrevias.length > 0;

  useEffect(() => {
    if (!abierto) return;

    const tipoInicial = normalizarTipoNota(tipoNota);
    setTipoNotaSeleccionado(tipoInicial);

    setForm({
      ...formInicial,
      motivo_consulta: paciente?.diagnostico || '',
      diagnostico: paciente?.diagnostico || '',
      observaciones:
        paciente?.observaciones || expediente?.observaciones_generales || '',
      peso_kg: expediente?.peso_kg || '',
      talla_cm: expediente?.talla_cm || '',
      imc: expediente?.imc || '',
      presion_arterial: expediente?.presion_arterial || '',
      frecuencia_cardiaca: expediente?.frecuencia_cardiaca || '',
      temperatura: expediente?.temperatura || '',
      saturacion_oxigeno: expediente?.saturacion_oxigeno || '',
    });
  }, [abierto, paciente, expediente, tipoNota]);

  useEffect(() => {
    const imcCalculado = calcularIMC(form.peso_kg, form.talla_cm);

    if (!imcCalculado) return;

    setForm((prev) => {
      if (prev.imc === imcCalculado) return prev;
      return {
        ...prev,
        imc: imcCalculado,
      };
    });
  }, [form.peso_kg, form.talla_cm]);

  if (!abierto) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validar = () => {
    if (!expediente?.id_expediente) {
      Swal.fire({
        icon: 'warning',
        title: 'Expediente requerido',
        text: 'Para crear una nota médica, primero debe existir un expediente vinculado.',
        confirmButtonColor: '#0284c7',
      });
      return false;
    }

    if (!['NOTA_INICIAL', 'NOTA_EVOLUCION'].includes(tipoNotaSeleccionado)) {
      Swal.fire({
        icon: 'warning',
        title: 'Tipo de nota requerido',
        text: 'Selecciona si la nota es inicial o de evolución.',
        confirmButtonColor: '#0284c7',
      });
      return false;
    }

    if (!form.antecedentes_padecimiento_actual.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text:
          tipoNotaSeleccionado === 'NOTA_EVOLUCION'
            ? 'Captura la evolución o padecimiento actual.'
            : 'Captura antecedentes y padecimiento actual.',
        confirmButtonColor: '#0284c7',
      });
      return false;
    }

    if (!form.exploracion_fisica.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Captura la exploración física.',
        confirmButtonColor: '#0284c7',
      });
      return false;
    }

    if (!form.plan.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo requerido',
        text: 'Captura el plan médico.',
        confirmButtonColor: '#0284c7',
      });
      return false;
    }

    return true;
  };

  const guardarNota = async (e) => {
    e.preventDefault();

    if (!validar()) return;

    const confirmar = await Swal.fire({
      icon: 'question',
      title: 'Guardar nota médica',
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.6;">
          <p><strong>Paciente:</strong> ${nombrePaciente}</p>
          <p><strong>Tipo de nota:</strong> ${infoTipoSeleccionado.label}</p>
          <p><strong>Expediente:</strong> #${expediente.id_expediente}</p>
          ${idFila ? `<p><strong>Atención:</strong> #${idFila}</p>` : ''}
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Sí, guardar',
      cancelButtonText: 'Revisar',
      confirmButtonColor: '#0284c7',
    });

    if (!confirmar.isConfirmed) return;

    try {
      setGuardando(true);

      const payload = {
        id_expediente: expediente.id_expediente,
        id_fila: idFila ? Number(idFila) : null,
        id_sucursal: idSucursal ? Number(idSucursal) : null,
        tipo_nota: tipoNotaSeleccionado,

        motivo_consulta: form.motivo_consulta.trim() || null,
        diagnostico: form.diagnostico.trim() || null,

        antecedentes_padecimiento_actual:
          form.antecedentes_padecimiento_actual.trim(),
        exploracion_fisica: form.exploracion_fisica.trim(),
        plan: form.plan.trim(),
        pronostico: form.pronostico.trim() || null,
        pasa_a: form.pasa_a.trim() || null,
        observaciones: form.observaciones.trim() || null,

        peso_kg: form.peso_kg || null,
        talla_cm: form.talla_cm || null,
        imc: form.imc || null,
        presion_arterial: form.presion_arterial.trim() || null,
        frecuencia_cardiaca: form.frecuencia_cardiaca || null,
        temperatura: form.temperatura || null,
        saturacion_oxigeno: form.saturacion_oxigeno || null,
      };

      const data = await notasMedicasService.crearNotaMedica(payload);

      if (!data.ok) {
        throw new Error(data.mensaje || 'No se pudo guardar la nota médica.');
      }

      Swal.fire({
        icon: 'success',
        title: 'Nota médica guardada',
        html: `
          <p>La nota se guardó correctamente.</p>
          <p><strong>Tipo:</strong> ${infoTipoSeleccionado.label}</p>
        `,
        timer: 1800,
        showConfirmButton: false,
      });


      const notaGuardada = {
        ...(data.nota || {}),

        id_nota: data.nota?.id_nota || null,

        id_expediente:
          data.nota?.id_expediente ||
          expediente?.id_expediente ||
          null,

        id_fila:
          data.nota?.id_fila ??
          (idFila ? Number(idFila) : null),

        tipo_nota: tipoNotaSeleccionado,
      };

      onGuardada?.(notaGuardada);

      onClose?.();
    } catch (error) {
      console.error('Error al guardar nota médica:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          error.message ||
          'No se pudo guardar la nota médica.',
        confirmButtonColor: '#0284c7',
      });
    } finally {
      setGuardando(false);
    }
  };

  const tituloPrincipal =
    tipoNotaSeleccionado === 'NOTA_EVOLUCION'
      ? 'Nota de evolución'
      : 'Nota médica inicial';

  const labelPadecimiento =
    tipoNotaSeleccionado === 'NOTA_EVOLUCION'
      ? 'Evolución / padecimiento actual *'
      : 'Antecedentes y padecimiento actual *';

  const placeholderPadecimiento =
    tipoNotaSeleccionado === 'NOTA_EVOLUCION'
      ? 'Describe evolución desde la última consulta, respuesta al tratamiento, cambios, nuevos síntomas o seguimiento...'
      : 'Describe antecedentes relevantes y evolución del padecimiento actual...';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm no-print">
      <div className="max-h-[94vh] w-full max-w-6xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <ClipboardPlus size={24} />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-800">
                {tituloPrincipal}
              </h2>
              <p className="text-sm text-slate-500">
                Consulta médica de {nombrePaciente}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={guardarNota}
          className="max-h-[calc(94vh-80px)] overflow-y-auto p-6"
        >
          <div className="mb-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-3xl border border-sky-100 bg-sky-50 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-sky-600">
                    Paciente
                  </p>
                  <p className="mt-1 font-black text-slate-800">
                    {nombrePaciente}
                  </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-sky-700 shadow-sm">
                  Exp. #{expediente?.id_expediente || 'N/A'}
                </span>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <ResumenDato label="Edad" value={paciente?.edad || expediente?.edad} />
                <ResumenDato label="Sexo" value={paciente?.sexo || expediente?.sexo} />
                <ResumenDato label="Atención" value={idFila ? `#${idFila}` : 'N/A'} />
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-black text-slate-800">
                    Tipo de nota
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    El sistema sugiere, pero el doctor puede cambiarlo según criterio clínico.
                  </p>
                </div>

                <span className={`rounded-full border px-3 py-1 text-xs font-black ${infoTipoSugerido.badge}`}>
                  Sugerida: {tipoNotaLabel || infoTipoSugerido.label}
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {Object.values(TIPOS_NOTA).map((tipo) => {
                  const Icono = tipo.icono;
                  const seleccionado = tipoNotaSeleccionado === tipo.value;

                  return (
                    <button
                      key={tipo.value}
                      type="button"
                      onClick={() => setTipoNotaSeleccionado(tipo.value)}
                      className={`rounded-2xl border p-4 text-left transition ${seleccionado
                          ? tipo.cardSelected
                          : 'border-slate-200 bg-slate-50 hover:border-sky-200 hover:bg-white'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <span
                          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${seleccionado
                              ? 'bg-slate-900 text-white'
                              : 'bg-white text-slate-500'
                            }`}
                        >
                          {seleccionado ? <CheckCircle2 size={17} /> : <Icono size={17} />}
                        </span>

                        <span>
                          <span className="block font-black text-slate-800">
                            {tipo.label}
                          </span>
                          <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                            {tipo.descripcion}
                          </span>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {tieneNotasPrevias && tipoNotaSeleccionado === 'NOTA_INICIAL' && (
                <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                  <p>
                    Este expediente ya tiene {notasPrevias.length} nota(s). Puedes guardar una nota inicial si se trata de un nuevo padecimiento o nuevo proceso clínico.
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-5">
              <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <UserRound className="text-sky-700" size={20} />
                  <h3 className="font-black text-slate-800">
                    Información clínica
                  </h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <CampoTexto
                    label="Motivo de consulta"
                    name="motivo_consulta"
                    value={form.motivo_consulta}
                    onChange={handleChange}
                    placeholder="Ej. Cefalea, dolor abdominal, tos..."
                  />

                  <CampoTexto
                    label="Diagnóstico"
                    name="diagnostico"
                    value={form.diagnostico}
                    onChange={handleChange}
                    placeholder="Ej. Infección respiratoria..."
                  />

                  <CampoArea
                    label={labelPadecimiento}
                    name="antecedentes_padecimiento_actual"
                    value={form.antecedentes_padecimiento_actual}
                    onChange={handleChange}
                    placeholder={placeholderPadecimiento}
                  />

                  <CampoArea
                    label="Exploración física *"
                    name="exploracion_fisica"
                    value={form.exploracion_fisica}
                    onChange={handleChange}
                    placeholder="Hallazgos de exploración física..."
                  />

                  <CampoArea
                    label="Plan *"
                    name="plan"
                    value={form.plan}
                    onChange={handleChange}
                    placeholder="Tratamiento, estudios, indicaciones, medidas generales..."
                  />

                  <CampoArea
                    label="Pronóstico"
                    name="pronostico"
                    value={form.pronostico}
                    onChange={handleChange}
                    placeholder="Ej. Bueno, reservado, sujeto a evolución..."
                  />

                  <CampoArea
                    label="Pasa a / seguimiento"
                    name="pasa_a"
                    value={form.pasa_a}
                    onChange={handleChange}
                    placeholder="Ej. Seguimiento, urgencias si datos de alarma..."
                  />

                  <CampoArea
                    label="Observaciones"
                    name="observaciones"
                    value={form.observaciones}
                    onChange={handleChange}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </section>
            </div>

            <div className="space-y-5">
              <section className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Activity className="text-emerald-700" size={20} />
                  <h3 className="font-black text-slate-800">
                    Signos vitales
                  </h3>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <CampoNumero
                    label="Peso (kg)"
                    name="peso_kg"
                    value={form.peso_kg}
                    onChange={handleChange}
                    placeholder="72.5"
                  />

                  <CampoNumero
                    label="Talla (cm)"
                    name="talla_cm"
                    value={form.talla_cm}
                    onChange={handleChange}
                    placeholder="162"
                  />

                  <CampoNumero
                    label="IMC"
                    name="imc"
                    value={form.imc}
                    onChange={handleChange}
                    placeholder="27.63"
                  />

                  <CampoTexto
                    label="Presión arterial"
                    name="presion_arterial"
                    value={form.presion_arterial}
                    onChange={handleChange}
                    placeholder="120/80"
                  />

                  <CampoNumero
                    label="Frecuencia cardiaca"
                    name="frecuencia_cardiaca"
                    value={form.frecuencia_cardiaca}
                    onChange={handleChange}
                    placeholder="80"
                  />

                  <CampoNumero
                    label="Temperatura"
                    name="temperatura"
                    value={form.temperatura}
                    onChange={handleChange}
                    placeholder="36.5"
                  />

                  <CampoNumero
                    label="Saturación O₂"
                    name="saturacion_oxigeno"
                    value={form.saturacion_oxigeno}
                    onChange={handleChange}
                    placeholder="98"
                  />
                </div>
              </section>

              <section className="rounded-3xl border border-amber-100 bg-amber-50 p-5 text-amber-800">
                <div className="flex items-start gap-3">
                  <Stethoscope size={22} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="font-black">Criterio clínico del doctor</p>
                    <p className="mt-1 text-sm leading-relaxed">
                      La nota inicial puede usarse para una nueva valoración o nuevo padecimiento. La nota de evolución se usa para seguimiento de un proceso ya documentado.
                    </p>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-sky-900/20 transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {guardando ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar {infoTipoSeleccionado.label.toLowerCase()}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResumenDato({ label, value }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-black text-slate-800">
        {value || 'N/A'}
      </p>
    </div>
  );
}

function CampoTexto({ label, name, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        placeholder={placeholder}
      />
    </div>
  );
}

function CampoNumero({ label, name, value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type="number"
        step="any"
        name={name}
        value={value}
        onChange={onChange}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        placeholder={placeholder}
      />
    </div>
  );
}

function CampoArea({ label, name, value, onChange, placeholder }) {
  return (
    <div className="md:col-span-2">
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={4}
        className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
        placeholder={placeholder}
      />
    </div>
  );
}
