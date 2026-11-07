import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { IconComponent } from '../../../shared/icon/icon.component';
import { ToastContainerComponent } from '../../../shared/toast/toast-container.component';
import { AuthService } from '../../services/auth.service';
import { OrganizacionService } from '../../services/organizacion.service';
import { ThemeService } from '../../services/theme.service';
import { modulosVisibles } from '../../access/modulos-por-rol';
import { AnuncioSaas } from '../../models/saas.models';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  badge?: number;
  badgeColor?: 'red' | 'amber';
}

@Component({
  selector: 'app-hotel-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet, IconComponent, ToastContainerComponent],
  templateUrl: './hotel-layout.component.html',
  styleUrls: ['./hotel-layout.component.scss'],
})
export class HotelLayoutComponent implements OnInit {
  private auth = inject(AuthService);
  private orgService = inject(OrganizacionService);
  private router = inject(Router);
  theme = inject(ThemeService);

  menuAbierto = signal(false);
  anunciosActivos = signal<AnuncioSaas[]>([]);
  anuncioCerrado = signal(false);

  // Alertas y Notificaciones Inteligentes del Hotel
  menuNotificacionesAbierto = signal(false);
  notificaciones = signal<any[]>([]);
  resumenNotificaciones = signal<any>(null);
  cargandoNotificaciones = signal(false);

  anuncioVigente = computed(() => {
    if (this.anuncioCerrado()) return null;
    const lista = this.anunciosActivos();
    if (!lista || lista.length === 0) return null;
    const primer = lista[0];
    if (sessionStorage.getItem('anuncio_dismissed_' + primer.anuncio_id)) {
      return null;
    }
    return primer;
  });

  // Estado del Plan SaaS y Alertas de Facturación
  planEstado = computed(() => this.orgService.orgActiva()?.plan_actual?.estado ?? 'activa');
  planVencido = computed(() => this.planEstado() === 'vencida');
  planPorVencer = computed(() => {
    const fin = this.orgService.orgActiva()?.plan_actual?.fecha_fin;
    if (!fin) return false;
    const diffDays = Math.ceil((new Date(fin).getTime() - Date.now()) / (1000 * 3600 * 24));
    return diffDays >= 0 && diffDays <= 3;
  });
  diasParaVencer = computed(() => {
    const fin = this.orgService.orgActiva()?.plan_actual?.fecha_fin;
    if (!fin) return 0;
    return Math.max(0, Math.ceil((new Date(fin).getTime() - Date.now()) / (1000 * 3600 * 24)));
  });

  ngOnInit(): void {
    this.cargarAnuncios();
    this.cargarModulosActivos();
    this.cargarNotificaciones();
  }

  cargarNotificaciones(): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;
    this.cargandoNotificaciones.set(true);
    this.orgService.obtenerNotificacionesInteligentes(orgId).subscribe({
      next: (res) => {
        this.cargandoNotificaciones.set(false);
        if (res && res.notificaciones) {
          this.notificaciones.set(res.notificaciones);
          this.resumenNotificaciones.set(res.resumen);
        }
      },
      error: () => this.cargandoNotificaciones.set(false),
    });
  }

  toggleDropdownNotificaciones(): void {
    const abierto = !this.menuNotificacionesAbierto();
    this.menuNotificacionesAbierto.set(abierto);
    if (abierto) {
      this.cargarNotificaciones();
    }
  }

  cerrarDropdownNotificaciones(): void {
    this.menuNotificacionesAbierto.set(false);
  }

  navegarAlerta(ruta: string): void {
    this.menuNotificacionesAbierto.set(false);
    if (ruta) {
      this.router.navigate([ruta]);
    }
  }

  cargarModulosActivos(): void {
    const org = this.orgService.orgActiva();
    if (!org) return;
    this.orgService.consultarModulosHotel(org.id).subscribe({
      next: (res) => {
        if (res.data) {
          const updated = { ...org, modulos_activos: res.data };
          this.orgService.fijarOrgActiva(updated);
        }
      },
      error: () => {},
    });
  }

  cargarAnuncios(): void {
    this.orgService.listarAnunciosActivos().subscribe({
      next: (res) => {
        if (res.data) {
          this.anunciosActivos.set(res.data);
        }
      },
      error: () => {},
    });
  }

  descartarAnuncio(an: AnuncioSaas): void {
    sessionStorage.setItem('anuncio_dismissed_' + an.anuncio_id, 'true');
    this.anuncioCerrado.set(true);
  }

  hotelNombre = computed(() => this.orgService.orgActiva()?.nombre_comercial ?? 'Sin organización');
  usuarioNombre = computed(() => {
    const persona = this.auth.cuenta()?.persona;
    return persona ? `${persona.nombre} ${persona.apellido}` : this.auth.cuenta()?.correo ?? '';
  });
  iniciales = computed(() => {
    const persona = this.auth.cuenta()?.persona;
    if (persona) return `${persona.nombre[0] ?? ''}${persona.apellido[0] ?? ''}`.toUpperCase();
    return (this.auth.cuenta()?.correo?.[0] ?? 'U').toUpperCase();
  });

  fecha = new Date().toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });
  esOpenHostAdmin = computed(() => this.orgService.esOpenHostAdmin());
  modoSoporte = computed(() => this.orgService.modoSoporte());

  salirModoSoporte(): void {
    this.orgService.salirModoSoporte();
    this.router.navigate(['/superadmin/hoteles']);
  }
  puedeGestionarEmpleados = computed(() => {
    const roles = this.orgService.rolesActivos();
    return roles.includes('propietario') || roles.includes('gerente') || roles.includes('administrador');
  });

  private navItemsBase: NavItem[] = [
    { label: 'Panel', route: 'panel', icon: 'grid' },
    { label: 'Reservas', route: 'reservas', icon: 'book', badge: 3, badgeColor: 'red' },
    { label: 'Calendario', route: 'calendario', icon: 'calendar' },
    { label: 'Habitaciones', route: 'habitaciones', icon: 'bed' },
    { label: 'Registrarse', route: 'registrarse', icon: 'login', badge: 2, badgeColor: 'red' },
    { label: 'Verificar', route: 'verificar', icon: 'logout', badge: 1, badgeColor: 'red' },
    { label: 'Clientes', route: 'clientes', icon: 'users' },
    { label: 'Inventario', route: 'inventario', icon: 'box', badge: 1, badgeColor: 'amber' },
    { label: 'Tienda / POS', route: 'tienda', icon: 'card' },
    { label: 'Limpieza', route: 'limpieza', icon: 'sparkles' },
    { label: 'Mantenimiento', route: 'mantenimiento', icon: 'wrench', badge: 2, badgeColor: 'red' },
    { label: 'Pagos', route: 'pagos', icon: 'card' },
    { label: 'Caja', route: 'caja', icon: 'wallet' },
    { label: 'Informes', route: 'informes', icon: 'chart' },
  ];

  navItems = computed<NavItem[]>(() => {
    const org = this.orgService.orgActiva();
    const modulos = org?.modulos_activos;

    const visibles = modulosVisibles(this.orgService.rolesActivos());
    let items =
      visibles === 'todos' ? [...this.navItemsBase] : this.navItemsBase.filter((i) => visibles.has(i.route));

    // Filtrar según Feature Flags de la organización activa
    if (modulos) {
      if (modulos.inventario === false) {
        items = items.filter((i) => i.route !== 'inventario');
      }
      if (modulos.limpieza === false) {
        items = items.filter((i) => i.route !== 'limpieza');
      }
      if (modulos.mantenimiento === false) {
        items = items.filter((i) => i.route !== 'mantenimiento');
      }
      if (modulos.tienda === false) {
        items = items.filter((i) => i.route !== 'tienda');
      }
    }

    if (this.puedeGestionarEmpleados()) {
      items.push({ label: 'Empleados', route: 'empleados', icon: 'door' });
      items.push({ label: 'Configuración', route: 'configuracion', icon: 'settings' });
    }
    return items;
  });

  pageTitle = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      startWith(null),
      map(() => {
        const segment = this.router.url.split('/').pop() ?? '';
        return this.navItems().find((i) => i.route === segment)?.label ?? 'Panel';
      })
    ),
    { initialValue: 'Panel' }
  );

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  cerrarSesion(): void {
    this.orgService.limpiarOrgActiva();
    this.auth.logout().subscribe({ complete: () => this.router.navigate(['/login']) });
  }

  cambiarOrganizacion(): void {
    this.orgService.limpiarOrgActiva();
    this.router.navigate(['/organizaciones']);
  }
}