import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from '../pages/auth/Login';
import Dashboard from '../pages/dashboard/Dashboard';
import Productos from '../pages/productos/Productos';
import Inventario from '../pages/inventario/Inventario';
import POS from '../pages/pos/POS';
import Caja from '../pages/caja/Caja';
import Ventas from '../pages/ventas/Ventas';
import Proveedores from '../pages/proveedores/Proveedores';
import Compras from '../pages/compras/Compras';
import Usuarios from '../pages/usuarios/Usuarios';
import NoAutorizado from '../pages/NoAutorizado';
import TarjetasPuntos from '../pages/tarjetasPuntos/TarjetasPuntos';
import MainLayout from '../layouts/MainLayout';
import PrivateRoute from './PrivateRoute';
import RoleRoute from './RoleRoute';
import Cajas from '../pages/cajas/Cajas';
import Sucursales from '../pages/sucursales/Sucursales';
import Categorias from '../pages/categorias/Categorias';
import StockSucursales from '../pages/StockSucursales/StockSucursales';
import Alertas from '../pages/Alertas/Alertas';
import Puntos from '../pages/puntos/Puntos';
import DoctorPerfil from '../pages/doctores/DoctorPerfil';
import RecetasDoctor from '../pages/doctores/RecetasDoctor';
import RecetasAdmin from '../pages/doctores/RecetasAdmin';
import OfertasCategorias from '../pages/ofertas/OfertasCategorias';
import SesionExpirada from '../pages/SesionExpirada';
import CatalogoPublico from '../pages/publico/CatalogoPublico';
import CatalogoAdmin from '../pages/catalogo/CatalogoAdmin';

import DoctorShaddaiPerfil from '../pages/doctorShaddai/DoctorShaddaiPerfil';
import ExpedientesClinicos from '../pages/doctorShaddai/ExpedientesClinicos';
import DoctorShaddaiRecetas from '../pages/doctorShaddai/DoctorShaddaiRecetas';
import HistorialRecetas from '../pages/doctorShaddai/HistorialRecetas';
import DoctorFilaEspera from '../pages/doctorShaddai/DoctorFilaEspera';
import HistorialSolicitudesLaboratorio from '../pages/doctorShaddai/HistorialSolicitudesLaboratorio';

import FilaEsperaPOS from '../pages/filaEspera/FilaEsperaPOS';

import ReportesCierreCaja from '../pages/caja/ReportesCierreCaja';

import ControlSanitario from '../pages/control-sanitario/ControlSanitario';

import VentasServiciosClinicos from '../pages/ventas/VentasServiciosClinicos';

import CatalogoServiciosClinicos from '../pages/doctorShaddai/CatalogoServiciosClinicos';

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/sesion-expirada" element={<SesionExpirada />} />
        <Route path="/catalogo" element={<CatalogoPublico />} />

        {/* Rutas privadas */}
        <Route
          path="/app"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/app/stock-sucursales" replace />} />

          <Route
            path="dashboard"
            element={
              <RoleRoute modulo="dashboard">
                <Dashboard />
              </RoleRoute>
            }
          />

          <Route
            path="productos"
            element={
              <RoleRoute modulo="productos">
                <Productos />
              </RoleRoute>
            }
          />

          <Route
            path="inventario"
            element={
              <RoleRoute modulo="inventario">
                <Inventario />
              </RoleRoute>
            }
          />

          <Route
            path="stock-sucursales"
            element={
              <RoleRoute modulo="stock-sucursales">
                <StockSucursales />
              </RoleRoute>
            }
          />

          <Route
            path="doctor-perfil"
            element={
              <RoleRoute modulo="doctor-perfil">
                <DoctorPerfil />
              </RoleRoute>
            }
          />

          <Route
            path="pos"
            element={
              <RoleRoute modulo="pos">
                <POS />
              </RoleRoute>
            }
          />

          <Route
            path="fila-espera"
            element={
              <RoleRoute modulo="fila-espera">
                <FilaEsperaPOS />
              </RoleRoute>
            }
          />

          <Route
            path="tarjetas-puntos"
            element={
              <RoleRoute modulo="tarjetas-puntos">
                <TarjetasPuntos />
              </RoleRoute>
            }
          />

          <Route
            path="puntos"
            element={
              <RoleRoute modulo="puntos">
                <Puntos />
              </RoleRoute>
            }
          />

          <Route
            path="caja"
            element={
              <RoleRoute modulo="caja">
                <Caja />
              </RoleRoute>
            }
          />

          <Route
            path="cajas"
            element={
              <RoleRoute modulo="cajas">
                <Cajas />
              </RoleRoute>
            }
          />

          <Route
            path="ventas"
            element={
              <RoleRoute modulo="ventas">
                <Ventas />
              </RoleRoute>
            }
          />

          <Route
            path="control-sanitario"
            element={
              <RoleRoute modulo="control-sanitario">
                <ControlSanitario />
              </RoleRoute>
            }
          />

          <Route
            path="/app/ventas-servicios-clinicos"
            element={<VentasServiciosClinicos />}
          />

          <Route
            path="/app/catalogo-servicios-clinicos"
            element={<CatalogoServiciosClinicos />}
          />

          <Route
            path="proveedores"
            element={
              <RoleRoute modulo="proveedores">
                <Proveedores />
              </RoleRoute>
            }
          />

          <Route
            path="compras"
            element={
              <RoleRoute modulo="compras">
                <Compras />
              </RoleRoute>
            }
          />

          <Route
            path="usuarios"
            element={
              <RoleRoute modulo="usuarios">
                <Usuarios />
              </RoleRoute>
            }
          />

          <Route
            path="sucursales"
            element={
              <RoleRoute modulo="sucursales">
                <Sucursales />
              </RoleRoute>
            }
          />

          <Route
            path="categorias"
            element={
              <RoleRoute modulo="categorias">
                <Categorias />
              </RoleRoute>
            }
          />

          <Route
            path="alertas"
            element={
              <RoleRoute modulo="alertas">
                <Alertas />
              </RoleRoute>
            }
          />

          <Route
            path="recetas"
            element={
              <RoleRoute modulo="recetas">
                <RecetasDoctor />
              </RoleRoute>
            }
          />

          <Route
            path="recetas-admin"
            element={
              <RoleRoute modulo="recetas-admin">
                <RecetasAdmin />
              </RoleRoute>
            }
          />

          <Route
            path="ofertas"
            element={
              <RoleRoute modulo="ofertas">
                <OfertasCategorias />
              </RoleRoute>
            }
          />

          <Route
            path="catalogo-admin"
            element={
              <RoleRoute modulo="catalogo-admin">
                <CatalogoAdmin />
              </RoleRoute>
            }
          />

          <Route
            path="doctor-shaddai/perfil"
            element={
              <RoleRoute modulo="doctor-shaddai-perfil">
                <DoctorShaddaiPerfil />
              </RoleRoute>
            }
          />

          <Route
            path="doctor-shaddai/fila-espera"
            element={
              <RoleRoute modulo="doctor-shaddai-fila-espera">
                <DoctorFilaEspera />
              </RoleRoute>
            }
          />

          <Route
            path="doctor-shaddai/expedientes"
            element={
              <RoleRoute modulo="expedientes-clinicos">
                <ExpedientesClinicos />
              </RoleRoute>
            }
          />

          <Route
            path="doctor-shaddai/recetas"
            element={
              <RoleRoute modulo="doctor-shaddai-recetas">
                <DoctorShaddaiRecetas />
              </RoleRoute>
            }
          />

          <Route
            path="doctor-shaddai/historial-recetas"
            element={
              <RoleRoute modulo="doctor-shaddai-recetas">
                <HistorialRecetas />
              </RoleRoute>
            }
          />

          <Route
            path="reportes-cierre-caja"
            element={
              <RoleRoute modulo="reportes-cierre-caja">
                <ReportesCierreCaja />
              </RoleRoute>
            }
          />

          <Route
            path="/app/doctor-shaddai/historial-laboratorio"
            element={<HistorialSolicitudesLaboratorio />}
          />

          <Route path="no-autorizado" element={<NoAutorizado />} />
        </Route>

        {/* Ruta no encontrada */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}