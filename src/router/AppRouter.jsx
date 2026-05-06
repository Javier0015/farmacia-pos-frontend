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

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/sesion-expirada" element={<SesionExpirada />} />

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

          <Route path="no-autorizado" element={<NoAutorizado />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}