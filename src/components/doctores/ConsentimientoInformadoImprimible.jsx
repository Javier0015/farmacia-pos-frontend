import logoFarmacia from '../../assets/logoShaddai.png';

const ZONA_HORARIA_SISTEMA = 'America/Mexico_City';

const obtenerFechaLocalISO = (fecha = new Date()) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');

  return `${anio}-${mes}-${dia}`;
};

const normalizarFechaParaMexico = (fecha) => {
  if (!fecha) return null;

  const texto = String(fecha).trim();
  const coincidenciaFechaSimple = /^(\d{4})-(\d{2})-(\d{2})$/.exec(texto);

  // Las fechas de <input type="date"> no tienen hora. Se usa mediodía UTC
  // para evitar que la conversión a la zona horaria de México reste un día.
  if (coincidenciaFechaSimple) {
    const [, anio, mes, dia] = coincidenciaFechaSimple;

    return new Date(
      Date.UTC(
        Number(anio),
        Number(mes) - 1,
        Number(dia),
        12,
        0,
        0
      )
    );
  }

  const valor = new Date(texto);

  return Number.isNaN(valor.getTime()) ? null : valor;
};

const formatearFechaLarga = (fecha) => {
  const valor = normalizarFechaParaMexico(fecha);

  if (!valor) return 'N/A';

  return new Intl.DateTimeFormat('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
    timeZone: ZONA_HORARIA_SISTEMA,
  }).format(valor);
};

const textoLimpio = (valor) => String(valor ?? '').trim();

const primerTextoDisponible = (...valores) => {
  return valores.map(textoLimpio).find(Boolean) || '';
};

const unirNombreSinDuplicados = (...partes) => {
  const resultado = [];

  partes
    .map(textoLimpio)
    .filter(Boolean)
    .forEach((parte) => {
      const nombreActual = resultado.join(' ').toLocaleLowerCase('es-MX');
      const parteNormalizada = parte.toLocaleLowerCase('es-MX');

      // Evita repetir apellidos cuando el campo "nombre" ya contiene el
      // nombre completo, por ejemplo: "Vanessa Alvarado Moreno".
      if (!nombreActual.includes(parteNormalizada)) {
        resultado.push(parte);
      }
    });

  return resultado.join(' ');
};

const obtenerNombrePaciente = (expediente = {}, datos = {}) => {
  const nombre = primerTextoDisponible(
    datos.nombre_paciente,
    datos.nombre,
    expediente.nombre_paciente,
    expediente.nombre,
    expediente.nombres
  );

  const primerApellido = primerTextoDisponible(
    datos.primer_apellido,
    datos.apellido_paterno,
    datos.ap_paterno,
    datos.paterno,
    expediente.primer_apellido,
    expediente.apellido_paterno,
    expediente.ap_paterno,
    expediente.paterno
  );

  const segundoApellido = primerTextoDisponible(
    datos.segundo_apellido,
    datos.apellido_materno,
    datos.ap_materno,
    datos.materno,
    expediente.segundo_apellido,
    expediente.apellido_materno,
    expediente.ap_materno,
    expediente.materno
  );

  return unirNombreSinDuplicados(nombre, primerApellido, segundoApellido) || 'N/A';
};

const obtenerNombreResponsableCompleto = (
  datos = {},
  expediente = {},
  nombrePaciente = ''
) => {
  const nombre = primerTextoDisponible(
    datos.nombre_responsable,
    datos.nombre_paciente,
    datos.nombre,
    expediente.nombre_responsable,
    expediente.nombre_paciente,
    expediente.nombre,
    expediente.nombres
  );

  const primerApellido = primerTextoDisponible(
    datos.primer_apellido_responsable,
    datos.apellido_paterno_responsable,
    datos.primer_apellido,
    datos.apellido_paterno,
    datos.ap_paterno,
    datos.paterno,
    expediente.primer_apellido_responsable,
    expediente.apellido_paterno_responsable,
    expediente.primer_apellido,
    expediente.apellido_paterno,
    expediente.ap_paterno,
    expediente.paterno
  );

  const segundoApellido = primerTextoDisponible(
    datos.segundo_apellido_responsable,
    datos.apellido_materno_responsable,
    datos.segundo_apellido,
    datos.apellido_materno,
    datos.ap_materno,
    datos.materno,
    expediente.segundo_apellido_responsable,
    expediente.apellido_materno_responsable,
    expediente.segundo_apellido,
    expediente.apellido_materno,
    expediente.ap_materno,
    expediente.materno
  );

  return (
    unirNombreSinDuplicados(nombre, primerApellido, segundoApellido) ||
    nombrePaciente ||
    'N/A'
  );
};

const obtenerNombreDoctor = (perfilDoctor = {}) => {
  return perfilDoctor?.nombre_completo || 'Doctor Shaddai';
};

const obtenerCedulaDoctor = (perfilDoctor = {}) => {
  return perfilDoctor?.cedula_profesional || 'N/A';
};

const obtenerTelefonoDoctor = (perfilDoctor = {}) => {
  return (
    primerTextoDisponible(
      perfilDoctor?.telefono,
      perfilDoctor?.telefono_contacto,
      perfilDoctor?.telefono_consultorio,
      perfilDoctor?.medico_telefono,
      perfilDoctor?.doctor_telefono,
      perfilDoctor?.celular
    ) || 'N/A'
  );
};

export default function ConsentimientoInformadoImprimible({
  expediente = {},
  perfilDoctor = {},
  datos = {},
  farmaciaNombre = 'Farmacia Shaddai',
}) {
  const fecha = datos?.fecha || obtenerFechaLocalISO();

  const nombrePaciente = obtenerNombrePaciente(expediente, datos);
  const nombreResponsableCompleto = obtenerNombreResponsableCompleto(
    datos,
    expediente,
    nombrePaciente
  );
  const nombreDoctor = obtenerNombreDoctor(perfilDoctor);
  const cedulaDoctor = obtenerCedulaDoctor(perfilDoctor);
  const telefonoDoctor = obtenerTelefonoDoctor(perfilDoctor);

  return (
    <>
      <style>
        {`
          #consentimiento-informado-imprimible {
            width: 100%;
            max-width: 216mm;
            margin: 0 auto;
            background: #ffffff;
            color: #111827;
            box-sizing: border-box;
          }

          #consentimiento-informado-imprimible,
          #consentimiento-informado-imprimible * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          #consentimiento-informado-imprimible .hoja-consentimiento {
            width: 100%;
            max-width: 204mm;
            min-height: 270mm;
            margin: 0 auto;
            background: #ffffff;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
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
              padding: 4mm !important;
            }

            body * {
              visibility: hidden !important;
            }

            #consentimiento-informado-imprimible,
            #consentimiento-informado-imprimible * {
              visibility: visible !important;
            }

            #consentimiento-informado-imprimible {
              position: static !important;
              display: block !important;
              width: 100% !important;
              max-width: 208mm !important;
              height: auto !important;
              max-height: none !important;
              margin: 0 auto !important;
              padding: 0 !important;
              background: #ffffff !important;
              color: #111827 !important;
              overflow: hidden !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            #consentimiento-informado-imprimible .hoja-consentimiento {
              width: 100% !important;
              max-width: 208mm !important;
              min-height: 271mm !important;
              margin: 0 auto !important;
              padding: 5mm 6mm !important;
              border: 0 !important;
              border-radius: 0 !important;
              box-shadow: none !important;
              background: #ffffff !important;
              overflow: hidden !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
              break-inside: avoid !important;
              display: flex !important;
              flex-direction: column !important;
            }

            #consentimiento-informado-imprimible p,
            #consentimiento-informado-imprimible div,
            #consentimiento-informado-imprimible span {
              overflow-wrap: anywhere !important;
            }

            #consentimiento-informado-imprimible header {
              margin-bottom: 10px !important;
            }

            .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      <div
        id="consentimiento-informado-imprimible"
        className="mx-auto w-full max-w-5xl bg-white text-slate-900 print:max-w-none"
      >
        <div className="hoja-consentimiento rounded-2xl border border-slate-300 bg-white p-6 shadow-sm print:p-0">
          <header className="mb-4 text-center">
            <div className="mb-2 flex items-center justify-center gap-4">
              <img
                src={logoFarmacia}
                alt="Logo"
                className="h-12 w-12 object-contain print:h-10 print:w-10"
              />

              <div>
                <h1 className="text-base font-black uppercase tracking-wide text-slate-900 print:text-sm">
                  {farmaciaNombre}
                </h1>

                <p className="text-xs font-bold uppercase text-slate-700 print:text-[10px]">
                  Servicios médicos / Atención clínica
                </p>
              </div>
            </div>

            <h2 className="mt-3 text-sm font-black uppercase tracking-wide text-slate-900 print:mt-2 print:text-[12px]">
              Carta de consentimiento bajo información
            </h2>
          </header>

          <div className="flex flex-1 flex-col justify-between gap-4">
            <section className="grid grid-cols-[1fr_220px] gap-3 text-[11px] print:text-[10px]">
              <div className="rounded border border-slate-300 p-2.5">
                <p>
                  <span className="font-black">Paciente / responsable:</span>{' '}
                  <span className="font-bold">{nombreResponsableCompleto}</span>
                </p>

                <p>
                  <span className="font-black">Domicilio:</span>{' '}
                  <span className="font-bold">
                    {datos.domicilio || expediente?.direccion || 'N/A'}
                  </span>
                </p>

                <p>
                  <span className="font-black">Municipio:</span>{' '}
                  <span className="font-bold">{datos.municipio || 'N/A'}</span>
                </p>

                <p>
                  <span className="font-black">Carácter:</span>{' '}
                  <span className="font-bold">
                    {datos.caracter || 'Paciente'}
                  </span>
                </p>
              </div>

              <div className="rounded border border-slate-300 p-2.5">
                <p>
                  <span className="font-black">Fecha: </span>
                  <span className="mt-1 font-bold leading-tight">
                    {formatearFechaLarga(fecha)}
                  </span>
                </p>

                {datos.hora && (
                  <p className="mt-1">
                    <span className="font-black">Hora:</span>{' '}
                    <span className="font-bold">{datos.hora}</span>
                  </p>
                )}
              </div>
            </section>

            <section className="space-y-3 text-[12px] leading-relaxed print:space-y-2 print:text-[10.4px] print:leading-snug">
              <p>
                Manifiesto mi voluntad para autorizar los procedimientos de
                diagnóstico, tratamiento, atención médica y seguimiento que se me
                indiquen, después de recibir información clara, suficiente y
                comprensible sobre la enfermedad, padecimiento o estado actual que
                presenta el paciente.
              </p>

              <div className="rounded border border-slate-300 bg-slate-50 p-2.5 print:p-2">
                <p className="text-center text-[11px] font-black uppercase print:text-[10px]">
                  {datos.padecimiento ||
                    datos.diagnostico ||
                    'Padecimiento no especificado'}
                </p>
              </div>

              <p>
                Asimismo, se me han explicado los beneficios, riesgos, posibles
                complicaciones, alternativas y alcances de la atención médica
                indicada. Me comprometo a proporcionar información verdadera y
                completa, así como a seguir las indicaciones médicas para favorecer
                una atención adecuada.
              </p>

              <p>
                Doy mi autorización al personal de salud para la atención del
                padecimiento y de las urgencias o contingencias que pudieran
                derivarse del procedimiento médico.
              </p>
            </section>

            <section className="grid gap-2.5 text-xs print:text-[10px]">
              <div className="grid grid-cols-[130px_1fr] items-start gap-2 rounded border border-slate-300 p-2.5 print:grid-cols-[110px_1fr]">
                <p className="font-black">Diagnóstico(s)</p>
                <div className="min-h-[28px] border-b border-slate-500 px-2 font-bold print:min-h-[30px]">
                  {datos.diagnostico || ' '}
                </div>
              </div>

              <div className="grid grid-cols-[130px_1fr] items-start gap-2 rounded border border-slate-300 p-2.5 print:grid-cols-[110px_1fr]">
                <p className="font-black">Tratamiento(s)</p>
                <div className="min-h-[34px] border-b border-slate-500 px-2 font-bold print:min-h-[28px]">
                  {datos.tratamiento || ' '}
                </div>
              </div>

              <div className="grid grid-cols-[130px_1fr] items-start gap-2 rounded border border-slate-300 p-2.5 print:grid-cols-[110px_1fr]">
                <p className="font-black">Riesgos frecuentes</p>
                <div className="min-h-[36px] border-b border-slate-500 px-2 font-bold print:min-h-[30px]">
                  {datos.riesgos ||
                    'Alergia, reacción adversa, falta de respuesta al tratamiento, complicaciones propias del padecimiento o procedimiento.'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded border border-slate-300 p-2.5">
                  <p className="font-black">Beneficios esperados</p>
                  <p className="mt-1 min-h-[52px] whitespace-pre-wrap font-bold">
                    {datos.beneficios || 'N/A'}
                  </p>
                </div>

                <div className="rounded border border-slate-300 p-2.5">
                  <p className="font-black">Alternativas / observaciones</p>
                  <p className="mt-1 min-h-[52px] whitespace-pre-wrap font-bold">
                    {datos.alternativas || datos.observaciones || 'N/A'}
                  </p>
                </div>
              </div>
            </section>

            <section className="grid grid-cols-2 border border-slate-500 text-[10px] print:text-[8.9px]">
              <div className="min-h-[96px] border-r border-slate-500 p-2 print:min-h-[78px] print:p-1.5">
                <p className="font-black">
                  Nombre completo y firma del paciente, padre/tutor o
                  responsable.
                </p>

                <div className="mt-16 border-t border-slate-700 pt-1 text-center font-bold print:mt-11">
                  {nombreResponsableCompleto === 'N/A'
                    ? ' '
                    : nombreResponsableCompleto}
                </div>
              </div>

              <div className="min-h-[96px] p-2 print:min-h-[78px] print:p-1.5">
                <p className="font-black">
                  Nombre completo, firma y cédula profesional del médico.
                </p>

                <div className="mt-14 border-t border-slate-700 pt-1 text-center font-bold print:mt-10">
                  {nombreDoctor}
                </div>

                <p className="text-center font-semibold">
                  Cédula profesional: {cedulaDoctor}
                </p>
                <p className="text-center font-semibold">
                  Teléfono: {telefonoDoctor}
                </p>
              </div>

              <div className="col-span-2 min-h-[76px] border-t border-slate-500 p-2 print:min-h-[62px] print:p-1.5">
                <p className="font-black">
                  Nombre completo y firma del testigo.
                </p>

                <div className="mt-12 border-t border-slate-700 pt-1 text-center font-bold print:mt-8">
                  {datos.nombre_testigo || ' '}
                </div>
              </div>
            </section>
          </div>

          <p className="mt-2 text-center text-[9px] text-slate-400 print:text-[8px]">
            &nbsp;
          </p>
        </div>
      </div>
    </>
  );
}
