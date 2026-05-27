import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    LockKeyhole,
    ShieldCheck,
    Sparkles,
    UserRoundCheck,
} from 'lucide-react';

export default function SesionExpirada() {
    const navigate = useNavigate();

    const volverLogin = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');

        navigate('/', { replace: true });
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-slate-950 flex items-center justify-center px-4 py-10">
            {/* Fondo animado */}
            <div className="absolute inset-0">
                <div className="absolute top-[-120px] left-[-120px] w-96 h-96 bg-sky-500/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-120px] right-[-120px] w-96 h-96 bg-cyan-400/30 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl animate-bounce" />
            </div>

            {/* Patrón decorativo */}
            <div className="absolute inset-0 opacity-[0.08] bg-[radial-gradient(circle_at_1px_1px,#ffffff_1px,transparent_0)] [background-size:28px_28px]" />

            <div className="relative w-full max-w-5xl grid lg:grid-cols-[0.9fr_1.1fr] gap-6 items-center">
                {/* Panel izquierdo */}
                <section className="hidden lg:flex flex-col justify-between min-h-[560px] rounded-[2.5rem] bg-white/10 border border-white/10 backdrop-blur-xl p-9 text-white shadow-2xl">
                    <div>
                        <div className="w-16 h-16 rounded-3xl bg-white/15 border border-white/10 flex items-center justify-center animate-pulse">
                            <Sparkles size={34} />
                        </div>

                        <h1 className="text-5xl font-black mt-8 leading-tight">
                            Hagamos una pausa segura
                        </h1>

                        <p className="text-sky-100 mt-5 leading-relaxed text-lg">
                            Para cuidar la información del sistema, cerramos tu sesión.
                            Solo necesitas entrar nuevamente para continuar.
                        </p>
                    </div>
<br /> <br />
                    <div className="space-y-4">
                        <div className="rounded-3xl bg-white/10 border border-white/10 p-5">
                            <p className="text-sm text-sky-100">
                                Información protegida
                            </p>

                            <p className="text-2xl font-black mt-1">
                                Ventas · Caja · Inventario
                            </p>
                        </div>
                                                   
                            <br />

                        <div className="rounded-3xl bg-white/10 border border-white/10 p-5">
                            <p className="text-sm text-sky-100">
                                Siguiente paso
                            </p>
                            <p className="text-2xl font-black mt-1">
                                Iniciar sesión
                            </p>
                        </div>
                    </div>
                </section>

                {/* Tarjeta derecha */}
                <section className="relative">
                    <div className="absolute inset-0 bg-sky-400/30 rounded-[2.5rem] blur-2xl" />

                    <div className="relative bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 p-8 sm:p-10">            <div className="flex justify-center">
                        <div className="relative">
                            <div className="absolute inset-0 rounded-full bg-sky-400/30 animate-ping" />
                            <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-sky-50 to-cyan-50 text-sky-700 flex items-center justify-center border border-sky-100 shadow-sm">
                                <LockKeyhole size={48} />
                            </div>
                        </div>
                    </div>

                        <div className="text-center mt-8">
                            <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 text-sky-700 px-4 py-2 text-sm font-black">
                                <ShieldCheck size={17} />
                                Todo está bien
                            </span>

                            <h2 className="text-4xl sm:text-5xl font-black text-slate-900 mt-5 leading-tight">
                                Tu sesión terminó
                            </h2>

                            <p className="text-slate-500 mt-5 leading-relaxed text-lg">
                                Pasó un tiempo desde tu último acceso. Para seguir usando el
                                sistema, inicia sesión nuevamente.
                            </p>
                        </div>

                        {/* Barra animada */}
                        <div className="mt-8 rounded-3xl bg-slate-50 border border-slate-100 p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white text-emerald-700 flex items-center justify-center shadow-sm">
                                    <UserRoundCheck size={25} />
                                </div>

                                <div className="flex-1">
                                    <p className="font-black text-slate-800">
                                        No se perdió tu información
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Solo vuelve a entrar para continuar trabajando.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full w-2/3 bg-gradient-to-r from-sky-600 to-cyan-500 rounded-full animate-pulse" />
                            </div>
                        </div>

                        <button
                            onClick={volverLogin}
                            className="group mt-8 w-full inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl bg-slate-900 hover:bg-sky-700 text-white font-black transition shadow-lg shadow-slate-900/20 active:scale-[0.98]"
                        >
                            Iniciar sesión nuevamente
                            <ArrowRight
                                size={21}
                                className="transition group-hover:translate-x-1"
                            />
                        </button>

                        <p className="text-center text-sm text-slate-400 mt-5">
                            Gracias por mantener segura la información del sistema.
                        </p>
                    </div>
                </section>
            </div>

            <style>
                {`
          @keyframes float {
            0%, 100% {
              transform: translateY(0px);
            }
            50% {
              transform: translateY(-10px);
            }
          }
        `}
            </style>
        </div>
    );
}