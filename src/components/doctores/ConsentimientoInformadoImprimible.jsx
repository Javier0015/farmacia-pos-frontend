import logoFarmacia from '../../assets/logoShaddai.png';

const formatearFechaLarga = (fecha) => {
  if (!fecha) return 'N/A';

  const valor = new Date(fecha);

  if (Number.isNaN(valor.getTime())) return 'N/A';

  return valor.toLocaleDateString('es-MX', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: '2-digit',
  });
};

const obtenerNombrePaciente = (expediente = {}, datos = {}) => {
  if (datos.nombre_paciente) return datos.nombre_paciente;

  const partes = [
    expediente.nombre_paciente,
    expediente.primer_apellido,
    expediente.segundo_apellido,
  ].filter(Boolean);

  return partes.length ? partes.join(' ') : '';
};

const obtenerNombreDoctor = (perfilDoctor = {}) => {
  return perfilDoctor?.nombre_completo || 'Doctor Shaddai';
};

const obtenerCedulaDoctor = (perfilDoctor = {}) => {
  return perfilDoctor?.cedula_profesional || 'N/A';
};

export default function ConsentimientoInformadoImprimible({
  expediente = {},
  perfilDoctor = {},
  datos = {},
  farmaciaNombre = 'Farmacia Shaddai',
}) {
  const fecha = datos?.fecha || new Date().toISOString();

  const nombrePaciente = obtenerNombrePaciente(expediente, datos);
  const nombreDoctor = obtenerNombreDoctor(perfilDoctor);
  const cedulaDoctor = obtenerCedulaDoctor(perfilDoctor);

  return (
    <>
      <style>
        {`
          #consentimiento-informado-imprimible {
            width: 100%;
            max-width: 204mm;
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
            min-height: auto;
            margin: 0 auto;
            background: #ffffff;
            box-sizing: border-box;
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
              height: auto !important;
              max-height: 271mm !important;
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

          <section className="mb-3 grid grid-cols-[1fr_210px] gap-3 text-[11px] print:text-[9.5px]">
            <div className="rounded border border-slate-300 p-2">
              <p>
                <span className="font-black">Paciente / responsable:</span>{' '}
                <span className="font-bold">
                  {datos.nombre_responsable || nombrePaciente || 'N/A'}
                </span>
              </p>

              <p>
                <span className="font-black">Domicilio:</span>{' '}
                <span className="font-bold">
                  {datos.domicilio || expediente?.direccion || 'N/A'}
                </span>
              </p>

              <p>
                <span className="font-black">Municipio:</span>{' '}
                <span className="font-bold">
                  {datos.municipio || 'N/A'}
                </span>
              </p>

              <p>
                <span className="font-black">Carácter:</span>{' '}
                <span className="font-bold">
                  {datos.caracter || 'Paciente'}
                </span>
              </p>
            </div>

            <div className="rounded border border-slate-300 p-2">
              <p>
                <span className="font-black">Fecha:</span>
              </p>

              <p className="mt-1 font-bold leading-tight">
                {formatearFechaLarga(fecha)}
              </p>

              {datos.hora && (
                <p className="mt-1">
                  <span className="font-black">Hora:</span>{' '}
                  <span className="font-bold">{datos.hora}</span>
                </p>
              )}
            </div>
          </section>

          <section className="space-y-2 text-xs leading-relaxed print:space-y-1.5 print:text-[10.2px] print:leading-snug">
            <p>
              Manifiesto mi voluntad para autorizar los procedimientos de
              diagnóstico, tratamiento, atención médica y seguimiento que se me
              indiquen, después de recibir información clara, suficiente y
              comprensible sobre la enfermedad, padecimiento o estado actual que
              presenta el paciente.
            </p>

            <div className="rounded border border-slate-300 bg-slate-50 p-2 print:p-1.5">
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

          <section className="mt-4 grid gap-2 text-xs print:mt-3 print:text-[10px]">
            <div className="grid grid-cols-[125px_1fr] items-start gap-2 rounded border border-slate-300 p-2 print:grid-cols-[105px_1fr]">
              <p className="font-black">Diagnóstico(s)</p>
              <div className="min-h-[26px] border-b border-slate-500 px-2 font-bold print:min-h-[20px]">
                {datos.diagnostico || ' '}
              </div>
            </div>

            <div className="grid grid-cols-[125px_1fr] items-start gap-2 rounded border border-slate-300 p-2 print:grid-cols-[105px_1fr]">
              <p className="font-black">Tratamiento(s)</p>
              <div className="min-h-[30px] border-b border-slate-500 px-2 font-bold print:min-h-[22px]">
                {datos.tratamiento || ' '}
              </div>
            </div>

            <div className="grid grid-cols-[125px_1fr] items-start gap-2 rounded border border-slate-300 p-2 print:grid-cols-[105px_1fr]">
              <p className="font-black">Riesgos frecuentes</p>
              <div className="min-h-[32px] border-b border-slate-500 px-2 font-bold print:min-h-[24px]">
                {datos.riesgos ||
                  'Alergia, reacción adversa, falta de respuesta al tratamiento, complicaciones propias del padecimiento o procedimiento.'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded border border-slate-300 p-2">
                <p className="font-black">Beneficios esperados</p>
                <p className="mt-1 min-h-[30px] whitespace-pre-wrap font-bold">
                  {datos.beneficios || 'N/A'}
                </p>
              </div>

              <div className="rounded border border-slate-300 p-2">
                <p className="font-black">Alternativas / observaciones</p>
                <p className="mt-1 min-h-[30px] whitespace-pre-wrap font-bold">
                  {datos.alternativas || datos.observaciones || 'N/A'}
                </p>
              </div>
            </div>
          </section>

          <section className="mt-5 grid grid-cols-2 border border-slate-500 text-[10px] print:mt-4 print:text-[8.8px]">
            <div className="min-h-[86px] border-r border-slate-500 p-2 print:min-h-[72px] print:p-1.5">
              <p className="font-black">
                Nombre completo y firma del paciente, padre/tutor o
                responsable.
              </p>

              <div className="mt-9 border-t border-slate-700 pt-1 text-center font-bold print:mt-7">
                {datos.nombre_responsable || nombrePaciente || ' '}
              </div>
            </div>

            <div className="min-h-[86px] p-2 print:min-h-[72px] print:p-1.5">
              <p className="font-black">
                Nombre completo, firma y cédula profesional del médico.
              </p>

              <div className="mt-8 border-t border-slate-700 pt-1 text-center font-bold print:mt-6">
                {nombreDoctor}
              </div>

              <p className="text-center font-semibold">
                Cédula profesional: {cedulaDoctor}
              </p>
            </div>

            <div className="col-span-2 min-h-[72px] border-t border-slate-500 p-2 print:min-h-[58px] print:p-1.5">
              <p className="font-black">
                Nombre completo y firma del testigo.
              </p>

              <div className="mt-7 border-t border-slate-700 pt-1 text-center font-bold print:mt-5">
                {datos.nombre_testigo || ' '}
              </div>
            </div>
          </section>

          <p className="mt-3 text-center text-[9px] text-slate-400 print:text-[8px]">
            Documento generado electrónicamente para control interno de la
            atención médica.
          </p>
        </div>
      </div>
    </>
  );
}