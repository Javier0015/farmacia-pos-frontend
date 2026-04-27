export const esSuperAdmin = (usuario) => {
  return usuario?.rol === 'SUPER_ADMIN';
};

export const obtenerSucursalInicial = (usuario, sucursales = []) => {
  if (esSuperAdmin(usuario)) {
    return sucursales[0]?.id_sucursal || '';
  }

  return usuario?.sucursales?.[0]?.id_sucursal || '';
};

export const filtrarSucursalesPorRol = (usuario, sucursales = []) => {
  if (esSuperAdmin(usuario)) {
    return sucursales;
  }

  const idsPermitidos = (usuario?.sucursales || []).map((sucursal) =>
    Number(sucursal.id_sucursal)
  );

  return sucursales.filter((sucursal) =>
    idsPermitidos.includes(Number(sucursal.id_sucursal))
  );
};