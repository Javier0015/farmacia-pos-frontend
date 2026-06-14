export const permisosPorRol = {
  SUPER_ADMIN: [
    'dashboard',
    'productos',
    'inventario',
    'stock-sucursales',
    'pos',
    'caja',
    'cajas',
    'ventas',
    'ventas-servicios-clinicos',
    'proveedores',
    'compras',
    'usuarios',
    'tarjetas-puntos',
    'sucursales',
    'categorias',
    'alertas',
    'puntos',
    'recetas-admin',
    'ofertas',
    'catalogo-admin',
    'fila-espera',
    'reportes-cierre-caja',
    'control-sanitario',
    'catalogo-servicios-clinicos',
  ],

  ADMIN_SUCURSAL: [
    'dashboard',
    'productos',
    'inventario',
    'stock-sucursales',
    'pos',
    'caja',
    'ventas',
    'proveedores',
    'compras',
    'tarjetas-puntos',
    'alertas',
    'configuracion-puntos',
    'recetas-admin',
    'reportes-cierre-caja',
  ],

  CAJERO: [
    'dashboard',
    'pos',
    'stock-sucursales',
    'caja',
    'ventas',
    'ventas-servicios-clinicos',
    'tarjetas-puntos',
    'recetas-admin',
    'fila-espera',
    'productos',
    'inventario',
    'categorias',
    'proveedores',
    'compras',
    'control-sanitario',
    'catalogo-servicios-clinicos',
  ],

  ALMACEN: [
    'dashboard',
    'productos',
    'inventario',
    'stock-sucursales',
  ],

  COMPRAS: [
    'dashboard',
    'proveedores',
    'compras',
    'inventario',
    'stock-sucursales',
  ],

  LECTURA: [
    'dashboard',
    'ventas',
    'inventario',
    'stock-sucursales',
  ],

  DOCTOR: [
    'doctor-perfil',
    'stock-sucursales',
    'recetas',
  ],

  DOCTOR_SHADDAI: [
    'doctor-shaddai-perfil',
    'expedientes-clinicos',
    'doctor-shaddai-recetas',
    'doctor-shaddai-fila-espera',
    'doctor-shaddai-laboratorio',
  ],
};

export const tienePermiso = (rol, modulo) => {
  if (!rol || !modulo) return false;

  const permisos = permisosPorRol[rol] || [];

  return permisos.includes(modulo);
};