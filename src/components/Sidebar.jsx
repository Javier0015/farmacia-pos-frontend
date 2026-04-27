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
    Pill,
    Users,
    BadgePercent,
    Store,
    Tags,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { tienePermiso } from '../config/permisos';

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
        to: '/app/ventas',
        label: 'Ventas',
        icon: ReceiptText,
        modulo: 'ventas',
    },
    {
        to: '/app/proveedores',
        label: 'Proveedores',
        icon: Truck,
        modulo: 'proveedores',
    },
    {
        to: '/app/compras',
        label: 'Compras',
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
];

export default function Sidebar({ modoMovil = false, onNavigate }) {
    const { usuario } = useAuth();

    const linksPermitidos = links.filter((link) =>
        tienePermiso(usuario?.rol, link.modulo)
    );

    return (
        <aside
            className={`w-72 bg-slate-950 text-white min-h-screen flex flex-col ${modoMovil ? '' : 'hidden lg:flex'
                }`}
        >
            <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-600 flex items-center justify-center">
                        <Pill size={24} />
                    </div>

                    <div>
                        <h1 className="font-bold text-lg leading-tight">
                            Shaddai POS
                        </h1>
                        <p className="text-xs text-slate-400">
                            Farmacia multi-sucursal
                        </p>
                    </div>
                </div>
            </div>

            <nav className="flex-1 p-4 space-y-1">
                {linksPermitidos.map((item) => {
                    const Icon = item.icon;

                    return (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={onNavigate}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-2xl transition text-sm font-semibold ${isActive
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30'
                                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                                }`
                            }
                        >
                            <Icon size={20} />
                            {item.label}
                        </NavLink>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-white/10">
                <div className="rounded-2xl bg-white/5 p-4">
                    <p className="text-xs text-slate-400">
                        Sesión activa
                    </p>
                    <p className="text-sm font-semibold text-emerald-300">
                        {usuario?.rol || 'Sin rol'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                        {usuario?.nombre || usuario?.usuario}
                    </p>
                </div>
            </div>
        </aside>
    );
}