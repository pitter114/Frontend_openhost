import { Routes } from '@angular/router';
import { authGuard, guestGuard, openHostAdminGuard, organizacionGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registro',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/registro/registro.component').then((m) => m.RegistroComponent),
  },
  {
    path: 'aceptar-invitacion',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/aceptar-invitacion/aceptar-invitacion.component').then((m) => m.AceptarInvitacionComponent),
  },
  {
    path: 'reservar/confirmacion',
    loadComponent: () =>
      import('./features/reservar-publico/confirmacion-reserva/confirmacion-reserva.component').then((m) => m.ConfirmacionReservaComponent),
  },
  {
    path: 'reservar/:numero',
    loadComponent: () =>
      import('./features/reservar-publico/reservar-publico.component').then((m) => m.ReservarPublicoComponent),
  },
  {
    path: 'organizaciones',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/organizaciones/organizaciones.component').then((m) => m.OrganizacionesComponent),
  },
  {
    path: 'cuenta/seguridad',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cuenta/seguridad/seguridad.component').then((m) => m.SeguridadComponent),
  },

  {
    path: 'admin',
    canActivate: [organizacionGuard],
    loadComponent: () =>
      import('./core/layout/hotel-layout/hotel-layout.component').then((m) => m.HotelLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'panel' },
      { path: 'panel', loadComponent: () => import('./features/panel/panel.component').then((m) => m.PanelComponent) },
      { path: 'reservas', loadComponent: () => import('./features/reservas/reservas.component').then((m) => m.ReservasComponent) },
      { path: 'calendario', loadComponent: () => import('./features/calendario/calendario.component').then((m) => m.CalendarioComponent) },
      { path: 'habitaciones', loadComponent: () => import('./features/habitaciones/habitaciones.component').then((m) => m.HabitacionesComponent) },
      { path: 'registrarse', loadComponent: () => import('./features/registrarse/registrarse.component').then((m) => m.RegistrarseComponent) },
      { path: 'verificar', loadComponent: () => import('./features/verificar/verificar.component').then((m) => m.VerificarComponent) },
      { path: 'clientes', loadComponent: () => import('./features/clientes/clientes.component').then((m) => m.ClientesComponent) },
      { path: 'inventario', loadComponent: () => import('./features/inventario/inventario.component').then((m) => m.InventarioComponent) },
      { path: 'tienda', loadComponent: () => import('./features/tienda/tienda.component').then((m) => m.TiendaComponent) },
      { path: 'limpieza', loadComponent: () => import('./features/limpieza/limpieza.component').then((m) => m.LimpiezaComponent) },
      { path: 'mantenimiento', loadComponent: () => import('./features/mantenimiento/mantenimiento.component').then((m) => m.MantenimientoComponent) },
      { path: 'pagos', loadComponent: () => import('./features/pagos/pagos.component').then((m) => m.PagosComponent) },
      { path: 'caja', loadComponent: () => import('./features/pagos/pagos.component').then((m) => m.PagosComponent) },
      { path: 'informes', loadComponent: () => import('./features/informes/informes.component').then((m) => m.InformesComponent) },
      { path: 'empleados', loadComponent: () => import('./features/empleados/empleados.component').then((m) => m.EmpleadosComponent) },
      { path: 'configuracion', loadComponent: () => import('./features/configuracion/configuracion.component').then((m) => m.ConfiguracionComponent) },
    ],
  },
  {
    path: 'superadmin',
    canActivate: [openHostAdminGuard],
    loadComponent: () =>
      import('./core/layout/superadmin-layout/superadmin-layout.component').then((m) => m.SuperadminLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'panel' },
      { path: 'panel', loadComponent: () => import('./features/superadmin/panel-control/panel-control.component').then((m) => m.PanelControlComponent) },
      { path: 'hoteles', loadComponent: () => import('./features/superadmin/gestion-hoteles/gestion-hoteles.component').then((m) => m.GestionHotelesComponent) },
      { path: 'edificios', loadComponent: () => import('./features/superadmin/auditoria-edificios/auditoria-edificios.component').then((m) => m.AuditoriaEdificiosComponent) },
      { path: 'planes', loadComponent: () => import('./features/superadmin/planes-suscripciones/planes-suscripciones.component').then((m) => m.PlanesSuscripcionesComponent) },
      { path: 'pasarelas', loadComponent: () => import('./features/superadmin/pasarelas-pago/pasarelas-pago.component').then((m) => m.PasarelasPagoComponent) },
      { path: 'reservas', loadComponent: () => import('./features/superadmin/reservas-plataforma/reservas-plataforma.component').then((m) => m.ReservasPlataformaComponent) },
      { path: 'comisiones', loadComponent: () => import('./features/superadmin/comisiones/comisiones.component').then((m) => m.ComisionesComponent) },
      { path: 'clientes', loadComponent: () => import('./features/superadmin/clientes-globales/clientes-globales.component').then((m) => m.ClientesGlobalesComponent) },
      { path: 'reputacion', loadComponent: () => import('./features/superadmin/reputacion-huespedes/reputacion-huespedes.component').then((m) => m.ReputacionHuespedesComponent) },
      { path: 'seguridad', loadComponent: () => import('./features/superadmin/seguridad-cuentas/seguridad-cuentas.component').then((m) => m.SeguridadCuentasComponent) },
      { path: 'alertas', loadComponent: () => import('./features/superadmin/alertas/alertas.component').then((m) => m.AlertasComponent) },
      { path: 'auditoria', loadComponent: () => import('./features/superadmin/auditoria-logs/auditoria-logs.component').then((m) => m.AuditoriaLogsComponent) },
    ],
  },
  { path: '**', redirectTo: 'login' },
];