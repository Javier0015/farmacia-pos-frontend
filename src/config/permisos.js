export const permisosPorRol = {
  SUPER_ADMIN: [
    'dashboard',
    'productos',
    'inventario',
    'pos',
    'caja',
    'cajas',
    'ventas',
    'proveedores',
    'compras',
    'usuarios',
    'tarjetas-puntos',
    'sucursales',
    'categorias',
  ],

  ADMIN_SUCURSAL: [
    'dashboard',
    'productos',
    'inventario',
    'pos',
    'caja',
    'ventas',
    'proveedores',
    'compras',
    'tarjetas-puntos',
  ],

  CAJERO: [
    'dashboard',
    'pos',
    'caja',
    'ventas',
    'tarjetas-puntos',
  ],

  ALMACEN: [
    'dashboard',
    'productos',
    'inventario',
  ],

  COMPRAS: [
    'dashboard',
    'proveedores',
    'compras',
    'inventario',
  ],

  LECTURA: [
    'dashboard',
    'ventas',
    'inventario',
  ],
};

export const tienePermiso = (rol, modulo) => {
  if (!rol || !modulo) return false;

  const permisos = permisosPorRol[rol] || [];

  return permisos.includes(modulo);
};