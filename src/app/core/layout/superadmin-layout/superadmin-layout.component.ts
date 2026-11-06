import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { IconComponent } from '../../../shared/icon/icon.component';
import { ToastContainerComponent } from '../../../shared/toast/toast-container.component';
import { AuthService } from '../../services/auth.service';
import { OrganizacionService } from '../../services/organizacion.service';
import { ThemeService } from '../../services/theme.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
}

@Component({
  selector: 'app-superadmin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, IconComponent, ToastContainerComponent],
  templateUrl: './superadmin-layout.component.html',
  styleUrls: ['./superadmin-layout.component.scss'],
})
export class SuperadminLayoutComponent {
  theme = inject(ThemeService);
  menuAbierto = signal(false);

  fecha = new Date().toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  hotelesActivos = 5;

  navItems: NavItem[] = [
    { label: 'Panel de control global', route: 'panel', icon: 'grid' },
    { label: 'Gestión de Hoteles', route: 'hoteles', icon: 'building' },
    { label: 'Multi-Edificios (Límites)', route: 'edificios', icon: 'door' },
    { label: 'Planes & Suscripciones', route: 'planes', icon: 'card' },
    { label: 'Pasarelas & Mercado Pago', route: 'pasarelas', icon: 'creditCard' },
    { label: 'Reservas Plataforma', route: 'reservas', icon: 'book' },
    { label: 'Comisiones', route: 'comisiones', icon: 'dollar' },
    { label: 'Base de Clientes Globales', route: 'clientes', icon: 'database' },
    { label: 'Reputación & Lista Negra', route: 'reputacion', icon: 'alert' },
    { label: 'Cuentas & Seguridad', route: 'seguridad', icon: 'shield' },
    { label: 'Alertas Inteligentes', route: 'alertas', icon: 'bell', badge: 5 },
    { label: 'Auditoría & Logs', route: 'auditoria', icon: 'shield' },
  ];

  breadcrumb: Record<string, string> = {
    panel: 'Panel de control global',
    hoteles: 'Gestión de Hoteles',
    edificios: 'Auditoría Multi-Edificios & Control de Límites',
    planes: 'Planes SaaS & Suscripciones',
    pasarelas: 'Pasarelas de Pago Globales & Mercado Pago',
    reservas: 'Reservas Plataforma',
    comisiones: 'Comisiones',
    clientes: 'Base de Clientes Globales',
    reputacion: 'Red de Reputación Inter-Hotel (Lista Negra & Seguridad)',
    seguridad: 'Cuentas & Seguridad de Plataforma (Protocolos y Whitelist)',
    alertas: 'Alertas Inteligentes',
    auditoria: 'Historial de Actividad & Auditoría',
  };

  private router = inject(Router);

  currentSegment = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => this.router.url.split('/').pop() ?? 'panel')
    ),
    { initialValue: 'panel' }
  );

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  private auth = inject(AuthService);
  private orgService = inject(OrganizacionService);

  cerrarSesion(): void {
    this.orgService.limpiarOrgActiva();
    this.auth.logout().subscribe({ complete: () => this.router.navigate(['/login']) });
  }
}