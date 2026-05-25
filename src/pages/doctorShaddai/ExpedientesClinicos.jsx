import { useEffect, useMemo, useState } from 'react';
import Swal from 'sweetalert2';
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Eye,
  UserRound,
  Phone,
  Mail,
  VenusAndMars,
  CalendarDays,
  ClipboardPlus,
  HeartPulse,
  Pill,
  AlertTriangle,
  X,
  Save,
  Loader2,
  ShieldCheck,
  Droplets,
  Weight,
  Ruler,
  Activity,
  Thermometer,
  Wind,
  Users,
  MapPin,
  FileText,
} from 'lucide-react';

import {
  listarExpedientesClinicos,
  crearExpedienteClinico,
  actualizarExpedienteClinico,
  eliminarExpedienteClinico,
} from '../../services/doctorShaddaiService';

const formularioInicial = {
  nombre_paciente: '',
  primer_apellido: '',
  segundo_apellido: '',
  curp: '',
  telefono: '',
  sexo: '',
  fecha_nacimiento: '',
  edad: '',
  direccion: '',
  correo: '',
  nacionalidad: '',
  entidad_nacimiento: '',

  contacto_emergencia_nombre: '',
  contacto_emergencia_telefono: '',
  contacto_emergencia_parentesco: '',

  enfermedades_condiciones: '',
  alergias: '',
  medicamentos_actuales: '',
  observaciones_generales: '',

  tipo_sangre: '',
  peso_kg: '',
  talla_cm: '',
  imc: '',
  presion_arterial: '',
  frecuencia_cardiaca: '',
  temperatura: '',
  saturacion_oxigeno: '',

  antecedentes_heredofamiliares: '',
  antecedentes_personales_patologicos: '',
  antecedentes_personales_no_patologicos: '',
  antecedentes_quirurgicos: '',
  antecedentes_traumaticos: '',
  antecedentes_gineco_obstetricos: '',

  acepta_tratamiento_datos: false,
  fecha_consentimiento: '',
};

const ENTIDADES_CURP = {
  AS: 'Aguascalientes',
  BC: 'Baja California',
  BS: 'Baja California Sur',
  CC: 'Campeche',
  CL: 'Coahuila',
  CM: 'Colima',
  CS: 'Chiapas',
  CH: 'Chihuahua',
  DF: 'Ciudad de México',
  DG: 'Durango',
  GT: 'Guanajuato',
  GR: 'Guerrero',
  HG: 'Hidalgo',
  JC: 'Jalisco',
  MC: 'México',
  MN: 'Michoacán',
  MS: 'Morelos',
  NT: 'Nayarit',
  NL: 'Nuevo León',
  OC: 'Oaxaca',
  PL: 'Puebla',
  QT: 'Querétaro',
  QR: 'Quintana Roo',
  SP: 'San Luis Potosí',
  SL: 'Sinaloa',
  SR: 'Sonora',
  TC: 'Tabasco',
  TS: 'Tamaulipas',
  TL: 'Tlaxcala',
  VZ: 'Veracruz',
  YN: 'Yucatán',
  ZS: 'Zacatecas',
  NE: 'Nacido en el extranjero',
};

const obtenerDatosDesdeCurp = (curp) => {
  const curpLimpia = String(curp || '').trim().toUpperCase();

  if (curpLimpia.length !== 18) {
    return null;
  }

  const fecha = curpLimpia.substring(4, 10);
  const sexoClave = curpLimpia.substring(10, 11);
  const entidadClave = curpLimpia.substring(11, 13);

  const anio = Number(fecha.substring(0, 2));
  const mes = fecha.substring(2, 4);
  const dia = fecha.substring(4, 6);

  const anioActualDosDigitos = Number(String(new Date().getFullYear()).slice(-2));
  const siglo = anio <= anioActualDosDigitos ? 2000 : 1900;
  const anioCompleto = siglo + anio;

  const fechaNacimiento = `${anioCompleto}-${mes}-${dia}`;

  const fechaValida = new Date(fechaNacimiento);

  if (Number.isNaN(fechaValida.getTime())) {
    return null;
  }

  return {
    fecha_nacimiento: fechaNacimiento,
    edad: calcularEdad(fechaNacimiento),
    sexo:
      sexoClave === 'H'
        ? 'Masculino'
        : sexoClave === 'M'
          ? 'Femenino'
          : 'No especificado',
    entidad_nacimiento: ENTIDADES_CURP[entidadClave] || '',
    nacionalidad:
      entidadClave === 'NE' ? 'Nacido en el extranjero' : 'Mexicana',
  };
};

const calcularEdad = (fechaNacimiento) => {
  if (!fechaNacimiento) return '';

  const hoy = new Date();
  const nacimiento = new Date(fechaNacimiento);

  if (Number.isNaN(nacimiento.getTime())) return '';

  let edad = hoy.getFullYear() - nacimiento.getFullYear();
  const mes = hoy.getMonth() - nacimiento.getMonth();

  if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
    edad--;
  }

  return edad >= 0 ? edad : '';
};

const calcularIMC = (pesoKg, tallaCm) => {
  const peso = Number(pesoKg);
  const talla = Number(tallaCm) / 100;

  if (!peso || !talla) return '';

  return Number((peso / (talla * talla)).toFixed(2));
};

const formatearFecha = (fecha) => {
  if (!fecha) return 'Sin fecha';

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) return 'Sin fecha';

  return valor.toLocaleDateString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const normalizarFechaInput = (fecha) => {
  if (!fecha) return '';

  return String(fecha).split('T')[0];
};

const texto = (valor) => {
  if (valor === null || valor === undefined) return '';
  return String(valor);
};

const limpiarTexto = (valor) => {
  const limpio = texto(valor).trim();
  return limpio || null;
};

const limpiarNumero = (valor) => {
  if (valor === '' || valor === null || valor === undefined) return null;

  const numero = Number(valor);

  if (Number.isNaN(numero)) return null;

  return numero;
};

const nombreCompleto = (expediente) => {
  const nombre = expediente.nombre_paciente || '';
  const primerApellido = expediente.primer_apellido || '';
  const segundoApellido = expediente.segundo_apellido || '';

  const partes = [nombre, primerApellido, segundoApellido].filter(Boolean);

  return partes.length > 0 ? partes.join(' ') : 'Paciente sin nombre';
};

const expedienteIncompleto = (expediente) => {
  return (
    !expediente.nombre_paciente ||
    !expediente.primer_apellido ||
    !expediente.fecha_nacimiento ||
    !expediente.sexo ||
    !expediente.acepta_tratamiento_datos
  );
};

export default function ExpedientesClinicos() {
  const [expedientes, setExpedientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoModal, setModoModal] = useState('crear');
  const [expedienteSeleccionado, setExpedienteSeleccionado] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);

  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);

  const totalExpedientes = expedientes.length;

  const pacientesConCondicion = useMemo(() => {
    return expedientes.filter(
      (item) =>
        item.enfermedades_condiciones ||
        item.alergias ||
        item.medicamentos_actuales
    ).length;
  }, [expedientes]);

  const expedientesCompletos = useMemo(() => {
    return expedientes.filter((item) => !expedienteIncompleto(item)).length;
  }, [expedientes]);

  const cargarExpedientes = async (textoBusqueda = '') => {
    try {
      setCargando(true);

      const data = await listarExpedientesClinicos(textoBusqueda);

      setExpedientes(data.expedientes || []);
    } catch (error) {
      console.error('Error al cargar expedientes clínicos:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudieron cargar los expedientes clínicos.',
      });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarExpedientes();
  }, []);

  useEffect(() => {
    const temporizador = setTimeout(() => {
      cargarExpedientes(busqueda.trim());
    }, 400);

    return () => clearTimeout(temporizador);
  }, [busqueda]);

  const abrirModalCrear = () => {
    setModoModal('crear');
    setExpedienteSeleccionado(null);
    setFormulario(formularioInicial);
    setModalAbierto(true);
  };

  const abrirModalEditar = (expediente) => {
    setModoModal('editar');
    setExpedienteSeleccionado(expediente);

    setFormulario({
      nombre_paciente: expediente.nombre_paciente || '',
      primer_apellido: expediente.primer_apellido || '',
      segundo_apellido: expediente.segundo_apellido || '',
      curp: expediente.curp || '',
      telefono: expediente.telefono || '',
      sexo: expediente.sexo || '',
      fecha_nacimiento: normalizarFechaInput(expediente.fecha_nacimiento),
      edad: expediente.edad || '',
      direccion: expediente.direccion || '',
      correo: expediente.correo || '',
      nacionalidad: expediente.nacionalidad || '',
      entidad_nacimiento: expediente.entidad_nacimiento || '',

      contacto_emergencia_nombre:
        expediente.contacto_emergencia_nombre || '',
      contacto_emergencia_telefono:
        expediente.contacto_emergencia_telefono || '',
      contacto_emergencia_parentesco:
        expediente.contacto_emergencia_parentesco || '',

      enfermedades_condiciones: expediente.enfermedades_condiciones || '',
      alergias: expediente.alergias || '',
      medicamentos_actuales: expediente.medicamentos_actuales || '',
      observaciones_generales: expediente.observaciones_generales || '',

      tipo_sangre: expediente.tipo_sangre || '',
      peso_kg: expediente.peso_kg || '',
      talla_cm: expediente.talla_cm || '',
      imc: expediente.imc || '',
      presion_arterial: expediente.presion_arterial || '',
      frecuencia_cardiaca: expediente.frecuencia_cardiaca || '',
      temperatura: expediente.temperatura || '',
      saturacion_oxigeno: expediente.saturacion_oxigeno || '',

      antecedentes_heredofamiliares:
        expediente.antecedentes_heredofamiliares || '',
      antecedentes_personales_patologicos:
        expediente.antecedentes_personales_patologicos || '',
      antecedentes_personales_no_patologicos:
        expediente.antecedentes_personales_no_patologicos || '',
      antecedentes_quirurgicos: expediente.antecedentes_quirurgicos || '',
      antecedentes_traumaticos: expediente.antecedentes_traumaticos || '',
      antecedentes_gineco_obstetricos:
        expediente.antecedentes_gineco_obstetricos || '',

      acepta_tratamiento_datos: Boolean(expediente.acepta_tratamiento_datos),
      fecha_consentimiento: expediente.fecha_consentimiento || '',
    });

    setModalAbierto(true);
  };

  const abrirDetalle = (expediente) => {
    setExpedienteSeleccionado(expediente);
    setModalDetalleAbierto(true);
  };

  const cerrarModal = () => {
    if (guardando) return;

    setModalAbierto(false);
    setFormulario(formularioInicial);
    setExpedienteSeleccionado(null);
  };

  const cerrarDetalle = () => {
    setModalDetalleAbierto(false);
    setExpedienteSeleccionado(null);
  };

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormulario((prev) => ({
        ...prev,
        [name]: checked,
        fecha_consentimiento: checked
          ? prev.fecha_consentimiento || new Date().toISOString()
          : '',
      }));

      return;
    }

    if (name === 'fecha_nacimiento') {
      const edadCalculada = calcularEdad(value);

      setFormulario((prev) => ({
        ...prev,
        fecha_nacimiento: value,
        edad: edadCalculada,
      }));

      return;
    }

    if (name === 'peso_kg' || name === 'talla_cm') {
      setFormulario((prev) => {
        const nuevoFormulario = {
          ...prev,
          [name]: value,
        };

        const imcCalculado = calcularIMC(
          nuevoFormulario.peso_kg,
          nuevoFormulario.talla_cm
        );

        return {
          ...nuevoFormulario,
          imc: imcCalculado,
        };
      });

      return;
    }

    if (name === 'curp') {
      const curpMayuscula = value.toUpperCase();
      const datosCurp = obtenerDatosDesdeCurp(curpMayuscula);

      setFormulario((prev) => ({
        ...prev,
        curp: curpMayuscula,
        ...(datosCurp || {}),
      }));

      return;
    }

    setFormulario((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validarFormulario = () => {
    if (!formulario.nombre_paciente.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo obligatorio',
        text: 'El nombre del paciente es obligatorio.',
      });

      return false;
    }

    if (!formulario.primer_apellido.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Campo obligatorio',
        text: 'El primer apellido del paciente es obligatorio.',
      });

      return false;
    }

    if (formulario.curp && formulario.curp.trim().length !== 18) {
      Swal.fire({
        icon: 'warning',
        title: 'CURP inválida',
        text: 'La CURP debe tener 18 caracteres.',
      });

      return false;
    }

    if (formulario.correo && !/\S+@\S+\.\S+/.test(formulario.correo)) {
      Swal.fire({
        icon: 'warning',
        title: 'Correo inválido',
        text: 'Ingresa un correo electrónico válido.',
      });

      return false;
    }

    if (!formulario.acepta_tratamiento_datos) {
      Swal.fire({
        icon: 'warning',
        title: 'Consentimiento requerido',
        text: 'Para crear o actualizar el expediente, confirma el consentimiento para tratamiento de datos personales.',
      });

      return false;
    }

    return true;
  };

  const prepararPayload = () => {
    return {
      nombre_paciente: limpiarTexto(formulario.nombre_paciente),
      primer_apellido: limpiarTexto(formulario.primer_apellido),
      segundo_apellido: limpiarTexto(formulario.segundo_apellido),
      curp: limpiarTexto(formulario.curp),
      telefono: limpiarTexto(formulario.telefono),
      sexo: limpiarTexto(formulario.sexo),
      fecha_nacimiento: formulario.fecha_nacimiento || null,
      edad: limpiarNumero(formulario.edad),
      direccion: limpiarTexto(formulario.direccion),
      correo: limpiarTexto(formulario.correo),
      nacionalidad: limpiarTexto(formulario.nacionalidad),
      entidad_nacimiento: limpiarTexto(formulario.entidad_nacimiento),

      contacto_emergencia_nombre: limpiarTexto(
        formulario.contacto_emergencia_nombre
      ),
      contacto_emergencia_telefono: limpiarTexto(
        formulario.contacto_emergencia_telefono
      ),
      contacto_emergencia_parentesco: limpiarTexto(
        formulario.contacto_emergencia_parentesco
      ),

      enfermedades_condiciones: limpiarTexto(
        formulario.enfermedades_condiciones
      ),
      alergias: limpiarTexto(formulario.alergias),
      medicamentos_actuales: limpiarTexto(formulario.medicamentos_actuales),
      observaciones_generales: limpiarTexto(
        formulario.observaciones_generales
      ),

      tipo_sangre: limpiarTexto(formulario.tipo_sangre),
      peso_kg: limpiarNumero(formulario.peso_kg),
      talla_cm: limpiarNumero(formulario.talla_cm),
      imc: limpiarNumero(formulario.imc),
      presion_arterial: limpiarTexto(formulario.presion_arterial),
      frecuencia_cardiaca: limpiarNumero(formulario.frecuencia_cardiaca),
      temperatura: limpiarNumero(formulario.temperatura),
      saturacion_oxigeno: limpiarNumero(formulario.saturacion_oxigeno),

      antecedentes_heredofamiliares: limpiarTexto(
        formulario.antecedentes_heredofamiliares
      ),
      antecedentes_personales_patologicos: limpiarTexto(
        formulario.antecedentes_personales_patologicos
      ),
      antecedentes_personales_no_patologicos: limpiarTexto(
        formulario.antecedentes_personales_no_patologicos
      ),
      antecedentes_quirurgicos: limpiarTexto(
        formulario.antecedentes_quirurgicos
      ),
      antecedentes_traumaticos: limpiarTexto(
        formulario.antecedentes_traumaticos
      ),
      antecedentes_gineco_obstetricos: limpiarTexto(
        formulario.antecedentes_gineco_obstetricos
      ),

      acepta_tratamiento_datos: Boolean(formulario.acepta_tratamiento_datos),
      fecha_consentimiento: formulario.acepta_tratamiento_datos
        ? formulario.fecha_consentimiento || new Date().toISOString()
        : null,
    };
  };

  const guardarExpediente = async (e) => {
    e.preventDefault();

    if (!validarFormulario()) return;

    try {
      setGuardando(true);

      const payload = prepararPayload();

      if (modoModal === 'crear') {
        await crearExpedienteClinico(payload);

        Swal.fire({
          icon: 'success',
          title: 'Expediente creado',
          text: 'El expediente clínico se registró correctamente.',
          timer: 1600,
          showConfirmButton: false,
        });
      } else {
        await actualizarExpedienteClinico(
          expedienteSeleccionado.id_expediente,
          payload
        );

        Swal.fire({
          icon: 'success',
          title: 'Expediente actualizado',
          text: 'Los datos del expediente fueron actualizados correctamente.',
          timer: 1600,
          showConfirmButton: false,
        });
      }

      cerrarModal();
      await cargarExpedientes(busqueda.trim());
    } catch (error) {
      console.error('Error al guardar expediente clínico:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo guardar el expediente clínico.',
      });
    } finally {
      setGuardando(false);
    }
  };

  const confirmarEliminar = async (expediente) => {
    const resultado = await Swal.fire({
      icon: 'warning',
      title: '¿Desactivar expediente?',
      text: `Se desactivará el expediente de ${nombreCompleto(expediente)}.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, desactivar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!resultado.isConfirmed) return;

    try {
      await eliminarExpedienteClinico(expediente.id_expediente);

      Swal.fire({
        icon: 'success',
        title: 'Expediente desactivado',
        text: 'El expediente fue desactivado correctamente.',
        timer: 1500,
        showConfirmButton: false,
      });

      await cargarExpedientes(busqueda.trim());
    } catch (error) {
      console.error('Error al eliminar expediente clínico:', error);

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text:
          error.response?.data?.mensaje ||
          'No se pudo desactivar el expediente clínico.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-sky-700 via-cyan-700 to-teal-600 p-6 text-white shadow-xl">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-20 left-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm font-medium backdrop-blur">
                <HeartPulse size={18} />
                Doctor Shaddai
              </div>

              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                Expedientes clínicos
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-sky-50 md:text-base">
                Administra identificación, contacto, antecedentes,
                datos médicos generales y consentimiento del paciente.
              </p>
            </div>

            <button
              type="button"
              onClick={abrirModalCrear}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-sky-700 shadow-lg transition hover:-translate-y-0.5 hover:bg-sky-50"
            >
              <Plus size={18} />
              Nuevo expediente
            </button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Expedientes activos
                </p>
                <h2 className="mt-1 text-3xl font-bold text-slate-900">
                  {totalExpedientes}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                <ClipboardPlus size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Con antecedentes médicos
                </p>
                <h2 className="mt-1 text-3xl font-bold text-slate-900">
                  {pacientesConCondicion}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <HeartPulse size={24} />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Expedientes completos
                </p>
                <h2 className="mt-1 text-3xl font-bold text-slate-900">
                  {expedientesCompletos}
                </h2>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-700">
                <ShieldCheck size={24} />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Lista de expedientes
              </h2>
              <p className="text-sm text-slate-500">
                Consulta, edita o desactiva expedientes clínicos.
              </p>
            </div>

            <div className="relative w-full md:max-w-sm">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar paciente, teléfono, correo o CURP..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Paciente
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Contacto
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Sexo / Edad
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Estado
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Registro
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Acciones
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {cargando ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                        <Loader2 className="animate-spin" size={28} />
                        <span className="text-sm">
                          Cargando expedientes clínicos...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : expedientes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-5 py-12 text-center">
                      <div className="mx-auto max-w-sm">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                          <ClipboardPlus size={28} />
                        </div>
                        <h3 className="text-base font-bold text-slate-800">
                          No hay expedientes registrados
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Crea el primer expediente clínico para comenzar.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  expedientes.map((expediente) => {
                    const incompleto = expedienteIncompleto(expediente);

                    return (
                      <tr
                        key={expediente.id_expediente}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
                              <UserRound size={22} />
                            </div>

                            <div>
                              <p className="font-semibold text-slate-900">
                                {nombreCompleto(expediente)}
                              </p>
                              <p className="text-xs text-slate-500">
                                ID expediente: {expediente.id_expediente}
                              </p>
                              <p className="text-xs text-slate-500">
                                CURP: {expediente.curp || 'Sin CURP'}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1 text-sm text-slate-600">
                            <p className="flex items-center gap-2">
                              <Phone size={14} />
                              {expediente.telefono || 'Sin teléfono'}
                            </p>
                            <p className="flex items-center gap-2">
                              <Mail size={14} />
                              {expediente.correo || 'Sin correo'}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="space-y-1 text-sm text-slate-600">
                            <p className="flex items-center gap-2">
                              <VenusAndMars size={14} />
                              {expediente.sexo || 'No especificado'}
                            </p>
                            <p className="flex items-center gap-2">
                              <CalendarDays size={14} />
                              {expediente.edad
                                ? `${expediente.edad} años`
                                : 'Edad no registrada'}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex flex-col gap-2">
                            {incompleto ? (
                              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                                <AlertTriangle size={14} />
                                Incompleto
                              </span>
                            ) : (
                              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <ShieldCheck size={14} />
                                Completo
                              </span>
                            )}

                            {expediente.enfermedades_condiciones && (
                              <span className="inline-flex max-w-xs items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-700">
                                <HeartPulse size={14} />
                                Con condición médica
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600">
                          {formatearFecha(expediente.fecha_creacion)}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => abrirDetalle(expediente)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition hover:bg-slate-200"
                              title="Ver detalle"
                            >
                              <Eye size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => abrirModalEditar(expediente)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 transition hover:bg-sky-200"
                              title="Editar"
                            >
                              <Pencil size={17} />
                            </button>

                            <button
                              type="button"
                              onClick={() => confirmarEliminar(expediente)}
                              className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700 transition hover:bg-red-200"
                              title="Desactivar"
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {modoModal === 'crear'
                    ? 'Nuevo expediente clínico'
                    : 'Editar expediente clínico'}
                </h2>
                <p className="text-sm text-slate-500">
                  Captura los datos principales del paciente. La valoración
                  médica se registra durante la consulta mediante notas médicas.
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarModal}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-600 transition hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={guardarExpediente}
              className="max-h-[calc(92vh-88px)] overflow-y-auto p-6"
            >
              <SeccionFormulario
                icono={<UserRound size={19} />}
                titulo="Identificación del paciente"
              />

              <div className="grid gap-5 md:grid-cols-3">
                <InputTexto
                  label="Nombre(s) *"
                  name="nombre_paciente"
                  value={formulario.nombre_paciente}
                  onChange={manejarCambio}
                  placeholder="Escribe el nombre o nombres"
                />

                <InputTexto
                  label="Primer apellido *"
                  name="primer_apellido"
                  value={formulario.primer_apellido}
                  onChange={manejarCambio}
                  placeholder="Escribe el primer apellido"
                />

                <InputTexto
                  label="Segundo apellido"
                  name="segundo_apellido"
                  value={formulario.segundo_apellido}
                  onChange={manejarCambio}
                  placeholder="Escribe el segundo apellido"
                />

                <InputTexto
                  label="CURP"
                  name="curp"
                  value={formulario.curp}
                  onChange={manejarCambio}
                  placeholder="Escribe la CURP a 18 caracteres"
                  maxLength={18}
                />

                <InputTexto
                  label="Nacionalidad"
                  name="nacionalidad"
                  value={formulario.nacionalidad}
                  onChange={manejarCambio}
                  placeholder="Escribe la nacionalidad"
                />

                <InputTexto
                  label="Entidad de nacimiento"
                  name="entidad_nacimiento"
                  value={formulario.entidad_nacimiento}
                  onChange={manejarCambio}
                  placeholder="Escribe la entidad de nacimiento"
                />

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Sexo
                  </label>
                  <select
                    name="sexo"
                    value={formulario.sexo}
                    onChange={manejarCambio}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="">Seleccionar</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Otro">Otro</option>
                    <option value="No especificado">Prefiere no decirlo</option>
                  </select>
                </div>

                <InputTexto
                  label="Fecha de nacimiento"
                  type="date"
                  name="fecha_nacimiento"
                  value={formulario.fecha_nacimiento}
                  onChange={manejarCambio}
                />

                <InputTexto
                  label="Edad"
                  type="number"
                  name="edad"
                  value={formulario.edad}
                  onChange={manejarCambio}
                  min="0"
                  placeholder="Escribe la edad"
                />
              </div>

              <SeccionFormulario
                icono={<Phone size={19} />}
                titulo="Contacto"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <InputTexto
                  label="Teléfono"
                  name="telefono"
                  value={formulario.telefono}
                  onChange={manejarCambio}
                  placeholder="Escribe el teléfono"
                />

                <InputTexto
                  label="Correo"
                  type="email"
                  name="correo"
                  value={formulario.correo}
                  onChange={manejarCambio}
                  placeholder="Escribe el correo electrónico"
                />

                <div className="md:col-span-2">
                  <TextArea
                    label="Dirección"
                    name="direccion"
                    value={formulario.direccion}
                    onChange={manejarCambio}
                    rows="2"
                    placeholder="Escribe la dirección del paciente"
                  />
                </div>
              </div>

              <SeccionFormulario
                icono={<Users size={19} />}
                titulo="Contacto de emergencia"
              />

              <div className="grid gap-5 md:grid-cols-3">
                <InputTexto
                  label="Nombre del contacto"
                  name="contacto_emergencia_nombre"
                  value={formulario.contacto_emergencia_nombre}
                  onChange={manejarCambio}
                  placeholder="Escribe el nombre completo"
                />

                <InputTexto
                  label="Teléfono del contacto"
                  name="contacto_emergencia_telefono"
                  value={formulario.contacto_emergencia_telefono}
                  onChange={manejarCambio}
                  placeholder="Escribe el teléfono"
                />

                <InputTexto
                  label="Parentesco"
                  name="contacto_emergencia_parentesco"
                  value={formulario.contacto_emergencia_parentesco}
                  onChange={manejarCambio}
                  placeholder="Escribe el parentesco"
                />
              </div>

              <SeccionFormulario
                icono={<HeartPulse size={19} />}
                titulo="Información médica inicial"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <TextArea
                  label="Enfermedades o condiciones"
                  name="enfermedades_condiciones"
                  value={formulario.enfermedades_condiciones}
                  onChange={manejarCambio}
                  rows="4"
                  placeholder="Escribe enfermedades o condiciones relevantes"
                />

                <TextArea
                  label="Alergias"
                  name="alergias"
                  value={formulario.alergias}
                  onChange={manejarCambio}
                  rows="4"
                  placeholder="Escribe alergias conocidas"
                />

                <TextArea
                  label="Medicamentos actuales"
                  name="medicamentos_actuales"
                  value={formulario.medicamentos_actuales}
                  onChange={manejarCambio}
                  rows="4"
                  placeholder="Escribe medicamentos actuales"
                />

                <TextArea
                  label="Observaciones generales"
                  name="observaciones_generales"
                  value={formulario.observaciones_generales}
                  onChange={manejarCambio}
                  rows="4"
                  placeholder="Escribe observaciones generales"
                />
              </div>

              <SeccionFormulario
                icono={<Activity size={19} />}
                titulo="Signos vitales y somatometría"
              />

              <div className="grid gap-5 md:grid-cols-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Tipo de sangre
                  </label>
                  <select
                    name="tipo_sangre"
                    value={formulario.tipo_sangre}
                    onChange={manejarCambio}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  >
                    <option value="">Seleccionar</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="Desconocido">Desconocido</option>
                  </select>
                </div>

                <InputTexto
                  label="Peso kg"
                  type="number"
                  name="peso_kg"
                  value={formulario.peso_kg}
                  onChange={manejarCambio}
                  min="0"
                  step="0.01"
                  placeholder="Escribe el peso en kg"
                />

                <InputTexto
                  label="Talla cm"
                  type="number"
                  name="talla_cm"
                  value={formulario.talla_cm}
                  onChange={manejarCambio}
                  min="0"
                  step="0.01"
                  placeholder="Escribe la talla en cm"
                />

                <InputTexto
                  label="IMC"
                  type="number"
                  name="imc"
                  value={formulario.imc}
                  onChange={manejarCambio}
                  min="0"
                  step="0.01"
                  placeholder="Se calcula automáticamente"
                />

                <InputTexto
                  label="Presión arterial"
                  name="presion_arterial"
                  value={formulario.presion_arterial}
                  onChange={manejarCambio}
                  placeholder="Escribe la presión arterial"
                />

                <InputTexto
                  label="Frecuencia cardiaca"
                  type="number"
                  name="frecuencia_cardiaca"
                  value={formulario.frecuencia_cardiaca}
                  onChange={manejarCambio}
                  min="0"
                  placeholder="Escribe la frecuencia cardiaca"
                />

                <InputTexto
                  label="Temperatura"
                  type="number"
                  name="temperatura"
                  value={formulario.temperatura}
                  onChange={manejarCambio}
                  min="0"
                  step="0.1"
                  placeholder="Escribe la temperatura"
                />

                <InputTexto
                  label="Saturación oxígeno"
                  type="number"
                  name="saturacion_oxigeno"
                  value={formulario.saturacion_oxigeno}
                  onChange={manejarCambio}
                  min="0"
                  max="100"
                  placeholder="Escribe la saturación de oxígeno"
                />
              </div>

              <SeccionFormulario
                icono={<FileText size={19} />}
                titulo="Antecedentes"
              />

              <div className="grid gap-5 md:grid-cols-2">
                <TextArea
                  label="Antecedentes heredofamiliares"
                  name="antecedentes_heredofamiliares"
                  value={formulario.antecedentes_heredofamiliares}
                  onChange={manejarCambio}
                  rows="3"
                  placeholder="Escribe antecedentes heredofamiliares"
                />

                <TextArea
                  label="Antecedentes personales patológicos"
                  name="antecedentes_personales_patologicos"
                  value={formulario.antecedentes_personales_patologicos}
                  onChange={manejarCambio}
                  rows="3"
                  placeholder="Escribe antecedentes personales patológicos"
                />

                <TextArea
                  label="Antecedentes personales no patológicos"
                  name="antecedentes_personales_no_patologicos"
                  value={formulario.antecedentes_personales_no_patologicos}
                  onChange={manejarCambio}
                  rows="3"
                  placeholder="Escribe antecedentes personales no patológicos"
                />

                <TextArea
                  label="Antecedentes quirúrgicos"
                  name="antecedentes_quirurgicos"
                  value={formulario.antecedentes_quirurgicos}
                  onChange={manejarCambio}
                  rows="3"
                  placeholder="Escribe antecedentes quirúrgicos"
                />

                <TextArea
                  label="Antecedentes traumáticos"
                  name="antecedentes_traumaticos"
                  value={formulario.antecedentes_traumaticos}
                  onChange={manejarCambio}
                  rows="3"
                  placeholder="Escribe antecedentes traumáticos"
                />

                <TextArea
                  label="Antecedentes gineco-obstétricos"
                  name="antecedentes_gineco_obstetricos"
                  value={formulario.antecedentes_gineco_obstetricos}
                  onChange={manejarCambio}
                  rows="3"
                  placeholder="Escribe antecedentes gineco-obstétricos si aplica"
                />
              </div>

              <SeccionFormulario
                icono={<ShieldCheck size={19} />}
                titulo="Consentimiento y protección de datos"
              />

              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    name="acepta_tratamiento_datos"
                    checked={formulario.acepta_tratamiento_datos}
                    onChange={manejarCambio}
                    className="mt-1 h-5 w-5 rounded border-slate-300 text-sky-700 focus:ring-sky-500"
                  />

                  <span>
                    <span className="block text-sm font-bold text-slate-800">
                      El paciente acepta el tratamiento de sus datos personales
                      y datos de salud.
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-slate-500">
                      Este consentimiento se registrará con fecha y hora al
                      guardar el expediente.
                    </span>
                  </span>
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={cerrarModal}
                  disabled={guardando}
                  className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={guardando}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-sky-800 disabled:opacity-60"
                >
                  {guardando ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      {modoModal === 'crear'
                        ? 'Guardar expediente'
                        : 'Actualizar expediente'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalDetalleAbierto && expedienteSeleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 bg-gradient-to-r from-sky-700 to-teal-600 px-6 py-5 text-white">
              <div>
                <h2 className="text-xl font-bold">
                  {nombreCompleto(expedienteSeleccionado)}
                </h2>
                <p className="text-sm text-sky-50">
                  Expediente clínico #{expedienteSeleccionado.id_expediente}
                </p>
              </div>

              <button
                type="button"
                onClick={cerrarDetalle}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white transition hover:bg-white/25"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[calc(92vh-88px)] overflow-y-auto p-6">
              <div className="grid gap-4 md:grid-cols-2">
                <DetalleItem
                  icono={<ShieldCheck size={18} />}
                  titulo="Estado del expediente"
                  valor={
                    expedienteIncompleto(expedienteSeleccionado)
                      ? 'Incompleto: faltan datos mínimos o consentimiento.'
                      : 'Completo'
                  }
                />

                <DetalleItem
                  icono={<UserRound size={18} />}
                  titulo="CURP"
                  valor={expedienteSeleccionado.curp || 'Sin CURP'}
                />

                <DetalleItem
                  icono={<VenusAndMars size={18} />}
                  titulo="Sexo"
                  valor={expedienteSeleccionado.sexo || 'No especificado'}
                />

                <DetalleItem
                  icono={<CalendarDays size={18} />}
                  titulo="Edad / Fecha de nacimiento"
                  valor={`${expedienteSeleccionado.edad
                      ? `${expedienteSeleccionado.edad} años`
                      : 'Edad no registrada'
                    } - ${formatearFecha(
                      expedienteSeleccionado.fecha_nacimiento
                    )}`}
                />

                <DetalleItem
                  icono={<MapPin size={18} />}
                  titulo="Nacionalidad / Entidad de nacimiento"
                  valor={`${expedienteSeleccionado.nacionalidad || 'Sin nacionalidad'} - ${expedienteSeleccionado.entidad_nacimiento ||
                    'Sin entidad de nacimiento'
                    }`}
                />

                <DetalleItem
                  icono={<Phone size={18} />}
                  titulo="Teléfono"
                  valor={expedienteSeleccionado.telefono || 'Sin teléfono'}
                />

                <DetalleItem
                  icono={<Mail size={18} />}
                  titulo="Correo"
                  valor={expedienteSeleccionado.correo || 'Sin correo'}
                />

                <DetalleItem
                  icono={<MapPin size={18} />}
                  titulo="Dirección"
                  valor={expedienteSeleccionado.direccion || 'Sin dirección'}
                  grande
                />

                <DetalleItem
                  icono={<Users size={18} />}
                  titulo="Contacto de emergencia"
                  valor={`Nombre: ${expedienteSeleccionado.contacto_emergencia_nombre ||
                    'Sin nombre'
                    }\nTeléfono: ${expedienteSeleccionado.contacto_emergencia_telefono ||
                    'Sin teléfono'
                    }\nParentesco: ${expedienteSeleccionado.contacto_emergencia_parentesco ||
                    'Sin parentesco'
                    }`}
                  grande
                />

                <DetalleItem
                  icono={<HeartPulse size={18} />}
                  titulo="Enfermedades o condiciones"
                  valor={
                    expedienteSeleccionado.enfermedades_condiciones ||
                    'Sin enfermedades o condiciones registradas'
                  }
                  grande
                />

                <DetalleItem
                  icono={<AlertTriangle size={18} />}
                  titulo="Alergias"
                  valor={
                    expedienteSeleccionado.alergias ||
                    'Sin alergias registradas'
                  }
                  grande
                />

                <DetalleItem
                  icono={<Pill size={18} />}
                  titulo="Medicamentos actuales"
                  valor={
                    expedienteSeleccionado.medicamentos_actuales ||
                    'Sin medicamentos registrados'
                  }
                  grande
                />

                <DetalleItem
                  icono={<Droplets size={18} />}
                  titulo="Tipo de sangre"
                  valor={expedienteSeleccionado.tipo_sangre || 'No registrado'}
                />

                <DetalleItem
                  icono={<Weight size={18} />}
                  titulo="Peso"
                  valor={
                    expedienteSeleccionado.peso_kg
                      ? `${expedienteSeleccionado.peso_kg} kg`
                      : 'No registrado'
                  }
                />

                <DetalleItem
                  icono={<Ruler size={18} />}
                  titulo="Talla"
                  valor={
                    expedienteSeleccionado.talla_cm
                      ? `${expedienteSeleccionado.talla_cm} cm`
                      : 'No registrada'
                  }
                />

                <DetalleItem
                  icono={<Activity size={18} />}
                  titulo="IMC"
                  valor={expedienteSeleccionado.imc || 'No registrado'}
                />

                <DetalleItem
                  icono={<Activity size={18} />}
                  titulo="Presión arterial"
                  valor={
                    expedienteSeleccionado.presion_arterial || 'No registrada'
                  }
                />

                <DetalleItem
                  icono={<HeartPulse size={18} />}
                  titulo="Frecuencia cardiaca"
                  valor={
                    expedienteSeleccionado.frecuencia_cardiaca
                      ? `${expedienteSeleccionado.frecuencia_cardiaca} lpm`
                      : 'No registrada'
                  }
                />

                <DetalleItem
                  icono={<Thermometer size={18} />}
                  titulo="Temperatura"
                  valor={
                    expedienteSeleccionado.temperatura
                      ? `${expedienteSeleccionado.temperatura} °C`
                      : 'No registrada'
                  }
                />

                <DetalleItem
                  icono={<Wind size={18} />}
                  titulo="Saturación de oxígeno"
                  valor={
                    expedienteSeleccionado.saturacion_oxigeno
                      ? `${expedienteSeleccionado.saturacion_oxigeno}%`
                      : 'No registrada'
                  }
                />

                <DetalleItem
                  icono={<FileText size={18} />}
                  titulo="Antecedentes heredofamiliares"
                  valor={
                    expedienteSeleccionado.antecedentes_heredofamiliares ||
                    'Sin antecedentes registrados'
                  }
                  grande
                />

                <DetalleItem
                  icono={<FileText size={18} />}
                  titulo="Antecedentes personales patológicos"
                  valor={
                    expedienteSeleccionado
                      .antecedentes_personales_patologicos ||
                    'Sin antecedentes registrados'
                  }
                  grande
                />

                <DetalleItem
                  icono={<FileText size={18} />}
                  titulo="Antecedentes personales no patológicos"
                  valor={
                    expedienteSeleccionado
                      .antecedentes_personales_no_patologicos ||
                    'Sin antecedentes registrados'
                  }
                  grande
                />

                <DetalleItem
                  icono={<FileText size={18} />}
                  titulo="Antecedentes quirúrgicos"
                  valor={
                    expedienteSeleccionado.antecedentes_quirurgicos ||
                    'Sin antecedentes registrados'
                  }
                  grande
                />

                <DetalleItem
                  icono={<FileText size={18} />}
                  titulo="Antecedentes traumáticos"
                  valor={
                    expedienteSeleccionado.antecedentes_traumaticos ||
                    'Sin antecedentes registrados'
                  }
                  grande
                />

                <DetalleItem
                  icono={<FileText size={18} />}
                  titulo="Antecedentes gineco-obstétricos"
                  valor={
                    expedienteSeleccionado.antecedentes_gineco_obstetricos ||
                    'Sin antecedentes registrados'
                  }
                  grande
                />

                <DetalleItem
                  icono={<ClipboardPlus size={18} />}
                  titulo="Observaciones generales"
                  valor={
                    expedienteSeleccionado.observaciones_generales ||
                    'Sin observaciones registradas'
                  }
                  grande
                />

                <DetalleItem
                  icono={<ShieldCheck size={18} />}
                  titulo="Consentimiento"
                  valor={
                    expedienteSeleccionado.acepta_tratamiento_datos
                      ? `Aceptado. Fecha: ${formatearFecha(
                        expedienteSeleccionado.fecha_consentimiento
                      )}`
                      : 'No aceptado'
                  }
                  grande
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setModalDetalleAbierto(false);
                    abrirModalEditar(expedienteSeleccionado);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-sky-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-800"
                >
                  <Pencil size={18} />
                  Editar expediente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SeccionFormulario({ icono, titulo }) {
  return (
    <div className="mb-4 mt-8 flex items-center gap-2 border-b border-slate-200 pb-3 first:mt-0">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
        {icono}
      </div>
      <h3 className="font-bold text-slate-900">{titulo}</h3>
    </div>
  );
}

function InputTexto({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  min,
  max,
  step,
  maxLength,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        maxLength={maxLength}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
      />
    </div>
  );
}

function TextArea({
  label,
  name,
  value,
  onChange,
  rows = '3',
  placeholder = '',
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <textarea
        name={name}
        value={value}
        onChange={onChange}
        rows={rows}
        placeholder={placeholder}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
      />
    </div>
  );
}

function DetalleItem({ icono, titulo, valor, grande = false }) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-slate-50 p-4 ${grande ? 'md:col-span-2' : ''
        }`}
    >
      <div className="mb-2 flex items-center gap-2 text-sky-700">
        {icono}
        <h3 className="text-sm font-bold text-slate-800">{titulo}</h3>
      </div>

      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
        {valor}
      </p>
    </div>
  );
}