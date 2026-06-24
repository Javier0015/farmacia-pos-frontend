import { NavLink } from 'react-router-dom';

import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Boxes,
  Wallet,
  ReceiptText,
  Truck,
  ClipboardList,
  Users,
  BadgePercent,
  Store,
  Tags,
  Search,
  Bell,
  Award,
  UserRound,
  FileText,
  ClipboardCheck,
  HeartPulse,
  FlaskConical,
  Files,

  Stethoscope,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { tienePermiso } from '../config/permisos';

import logoFarmacia from '../assets/logoShaddai.png';

const links = [
  {
    to: '/app/dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    modulo: 'dashboard',
  },
  {
    to: '/app/pos',
    label: 'Punto de venta',
    icon: ShoppingCart,
    modulo: 'pos',
  },
  {
    to: '/app/recetas-admin',
    label: 'Recetas externas',
    icon: ClipboardCheck,
    modulo: 'recetas-admin',
  },

  {
    to: '/app/fila-espera',
    label: 'Fila de espera',
    icon: HeartPulse,
    modulo: 'fila-espera',
  },

  {
    to: '/app/doctor-shaddai/fila-espera',
    label: 'Fila de espera',
    icon: HeartPulse,
    modulo: 'doctor-shaddai-fila-espera',
  },

  {
    to: '/app/recetas',
    label: 'Recetas',
    icon: FileText,
    modulo: 'recetas',
  },

  {
    to: '/app/ofertas',
    label: 'Ofertas',
    icon: BadgePercent,
    modulo: 'ofertas',
  },
  {
    to: '/app/productos',
    label: 'Productos',
    icon: Package,
    modulo: 'productos',
  },
  {
    to: '/app/inventario',
    label: 'Inventario',
    icon: Boxes,
    modulo: 'inventario',
  },
  {
    to: '/app/catalogo-servicios-clinicos',
    label: 'Catálogo servicios clínicos',
    icon: Stethoscope,
    modulo: 'catalogo-servicios-clinicos',
  },
  {
    to: '/app/stock-sucursales',
    label: 'Consultar stock',
    icon: Search,
    modulo: 'stock-sucursales',
  },
  {
    to: '/app/doctor-perfil',
    label: 'Mi perfil médico',
    icon: UserRound,
    modulo: 'doctor-perfil',
  },

  {
    to: '/app/tarjetas-puntos',
    label: 'Tarjetas puntos',
    icon: BadgePercent,
    modulo: 'tarjetas-puntos',
  },
  {
    to: '/app/caja',
    label: 'Caja',
    icon: Wallet,
    modulo: 'caja',
  },
  {
    to: '/app/cajas',
    label: 'Administrar cajas',
    icon: Wallet,
    modulo: 'cajas',
  },
  {
    to: '/app/reportes-cierre-caja',
    label: 'Reportes de cierre',
    icon: Files,
    modulo: 'reportes-cierre-caja',
  },
  {
    to: '/app/ventas',
    label: 'Ventas',
    icon: ReceiptText,
    modulo: 'ventas',
  },
  {
    to: '/app/ventas-servicios-clinicos',
    label: 'Ventas servicios clínicos',
    icon: Stethoscope,
    modulo: 'ventas-servicios-clinicos',
  },

  {
    to: '/app/control-sanitario',
    label: 'Control sanitario',
    icon: ClipboardList,
    modulo: 'control-sanitario',
  },
  {
    to: '/app/proveedores',
    label: 'Proveedores',
    icon: Truck,
    modulo: 'proveedores',
  },
  {
    to: '/app/compras',
    label: 'Compras de proveedores',
    icon: ClipboardList,
    modulo: 'compras',
  },
  {
    to: '/app/usuarios',
    label: 'Usuarios',
    icon: Users,
    modulo: 'usuarios',
  },
  {
    to: '/app/sucursales',
    label: 'Sucursales',
    icon: Store,
    modulo: 'sucursales',
  },
  {
    to: '/app/categorias',
    label: 'Categorías',
    icon: Tags,
    modulo: 'categorias',
  },
  {
    to: '/app/alertas',
    label: 'Alertas',
    icon: Bell,
    modulo: 'alertas',
  },
  {
    to: '/app/configuracion-puntos',
    label: 'Config. puntos',
    icon: BadgePercent,
    modulo: 'configuracion-puntos',
  },
  {
    to: '/app/configuracion-ticket',
    label: 'Config. ticket',
    icon: ReceiptText,
    modulo: 'configuracion-ticket',
  },
  {
    to: '/app/puntos',
    label: 'Puntos',
    icon: Award,
    modulo: 'puntos',
  },
  {
    to: '/app/catalogo-admin',
    label: 'Catálogo digital',
    icon: Package,
    modulo: 'catalogo-admin',
  },

  {
    to: '/app/doctor-shaddai/perfil',
    label: 'Perfil Doctor',
    icon: UserRound,
    modulo: 'doctor-shaddai-perfil',
  },

  {
    to: '/app/doctor-shaddai/expedientes',
    label: 'Expedientes clínicos',
    icon: HeartPulse,
    modulo: 'expedientes-clinicos',
  },

  /*{
    to: '/app/doctor-shaddai/recetas',
    label: 'Recetas ',
    icon: FileText,
    modulo: 'doctor-shaddai-recetas',
  },*/

  /* {
     to: '/app/doctor-shaddai/historial-recetas',
     label: 'Historial recetas',
     icon: ClipboardList,
     modulo: 'doctor-shaddai-recetas',
   },*/


  {
    to: '/app/doctor-shaddai/historial-laboratorio',
    label: 'Solicitudes laboratorio',
    icon: FlaskConical,
    modulo: 'doctor-shaddai-laboratorio',
  },
];

export default function Sidebar({ modoMovil = false, onNavigate }) {
  const { usuario } = useAuth();

  const linksPermitidos = links.filter((link) =>
    tienePermiso(usuario?.rol, link.modulo)
  );

  return (
    <aside
      className={`w-72 bg-slate-950 text-white h-screen max-h-screen overflow-hidden flex-col ${modoMovil ? 'flex' : 'hidden lg:flex'
        }`}
    >
      <div className="shrink-0 p-5 sm:p-6 border-b border-white/10">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/25 to-cyan-400/20 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-lg shadow-sky-950/30">
            <div className="absolute inset-0 bg-white/5" />

            <img
              src={logoFarmacia}
              alt="Logo Farmacias Shaddai"
              className="relative w-9 h-9 object-contain drop-shadow"
            />
          </div>

          <div className="min-w-0">
            <h1 className="font-black text-lg leading-tight truncate">
              Shaddai
            </h1>
            <p className="text-xs text-slate-400 truncate">
              Bienestar al alcance de todos
            </p>
          </div>
        </div>
      </div>

      <nav className="sidebar-scroll flex-1 min-h-0 p-3 sm:p-4 space-y-1 overflow-y-auto overscroll-contain">
        {linksPermitidos.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl transition text-sm font-semibold min-w-0 ${isActive
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/30'
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={20} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>


    </aside>
  );
}