import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function NoAutorizado() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8 max-w-lg text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
          <ShieldAlert size={34} />
        </div>

        <h1 className="text-2xl font-bold text-slate-800 mt-5">
          Acceso no autorizado
        </h1>

        <p className="text-slate-500 mt-3">
          Tu rol no tiene permisos para entrar a este módulo.
        </p>

        <button
          onClick={() => navigate('/app/dashboard')}
          className="mt-6 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition"
        >
          <ArrowLeft size={19} />
          Volver al dashboard
        </button>
      </div>
    </div>
  );
}