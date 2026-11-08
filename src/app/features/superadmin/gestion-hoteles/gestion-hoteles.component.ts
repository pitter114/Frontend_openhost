import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IconComponent } from '../../../shared/icon/icon.component';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { Organizacion } from '../../../core/models/auth.models';
import { PlanSaas } from '../../../core/models/saas.models';
import { LoadingModalComponent } from '../../../shared/loading-modal/loading-modal.component';
import { ToastService } from '../../../core/services/toast.service';

type Filtro = 'todas' | 'pendiente_aprobacion' | 'activa' | 'rechazada' | 'suspendida';

@Component({
  selector: 'app-gestion-hoteles',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, LoadingModalComponent],
  templateUrl: './gestion-hoteles.component.html',
  styleUrls: ['./gestion-hoteles.component.scss'],
})
export class GestionHotelesComponent implements OnInit {
  private orgService = inject(OrganizacionService);
  private router = inject(Router);
  private toast = inject(ToastService);

  cargando = signal(true);
  error = signal<string | null>(null);
  procesando = signal<number | null>(null);
  filtro = signal<Filtro>('todas');
  organizaciones = signal<Organizacion[]>([]);

  // Modal de Asignación de Plan SaaS
  mostrarModalPlan = signal(false);
  orgSeleccionada = signal<Organizacion | null>(null);
  planesDisponibles = signal<PlanSaas[]>([]);
  planForm = {
    plan_id: 1,
    duracion_meses: 1,
    estado: 'activa' as 'activa' | 'prueba' | 'vencida',
    monto_pagado: 79,
    notas: '',
  };

  // Modal de Feature Flags (Módulos por Hotel)
  mostrarModalModulos = signal(false);
  cargandoModulos = signal(false);
  guardandoModulos = signal(false);
  modulosDetalle = signal<{
    plan_nombre: string;
    defaults_plan: any;
    overrides: any;
  } | null>(null);

  modulosForm = {
    limpieza: true,
    mantenimiento: true,
    inventario: false,
    edificios: false,
    reservas_web: false,
    tienda: true,
  };

  filtradas = computed(() => {
    const f = this.filtro();
    const orgs = this.organizaciones();
    return f === 'todas' ? orgs : orgs.filter((o) => o.estado === f);
  });

  // Paginación
  paginaActual = signal(1);
  itemsPorPagina = 8;

  totalPaginas = computed(() => {
    const total = Math.ceil(this.filtradas().length / this.itemsPorPagina);
    return Math.max(1, total);
  });

  hotelesPaginados = computed(() => {
    const actual = this.paginaActual();
    const start = (actual - 1) * this.itemsPorPagina;
    return this.filtradas().slice(start, start + this.itemsPorPagina);
  });

  cambiarPagina(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginas()) {
      this.paginaActual.set(nuevaPagina);
    }
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  pendientesCount = computed(() => this.organizaciones().filter((o) => o.estado === 'pendiente_aprobacion').length);

  ngOnInit(): void {
    this.cargar();
    this.cargarPlanesCatalogo();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);
    this.orgService.todas().subscribe({
      next: (res) => {
        this.organizaciones.set(res.data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(
          err?.status === 403
            ? 'Tu cuenta no tiene rol de OpenHost Admin para ver esto.'
            : 'No pudimos cargar las organizaciones.'
        );
      },
    });
  }

  cargarPlanesCatalogo(): void {
    this.orgService.listarPlanes().subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.planesDisponibles.set(res.data);
        } else {
          this.planesDisponibles.set(this.planesFallback);
        }
      },
      error: () => {
        this.planesDisponibles.set(this.planesFallback);
      },
    });
  }

  private planesFallback: PlanSaas[] = [
    { plan_id: 1, nombre: 'Starter Hotel', precio: 79, descripcion: 'Hasta 15 hab.', max_habitaciones: 15, max_edificios: 1, permite_inventario: false, permite_limpieza: true, permite_mantenimiento: true, comision_pct: 0, caracteristicas: [], activo: true },
    { plan_id: 2, nombre: 'Pro Hotel & Resort', precio: 149, descripcion: 'Hasta 50 hab.', max_habitaciones: 50, max_edificios: 3, permite_inventario: true, permite_limpieza: true, permite_mantenimiento: true, comision_pct: 0, caracteristicas: [], activo: true },
    { plan_id: 3, nombre: 'Enterprise Cadenas', precio: 299, descripcion: 'Ilimitado', max_habitaciones: 999, max_edificios: 99, permite_inventario: true, permite_limpieza: true, permite_mantenimiento: true, comision_pct: 0, caracteristicas: [], activo: true },
  ];

  // --- Herramienta 'Login Como' (Impersonación de Soporte) ---
  impersonar(org: Organizacion): void {
    this.procesando.set(org.id);
    this.orgService.impersonar(org.id).subscribe({
      next: () => {
        this.procesando.set(null);
        this.toast.info(`Accediendo al panel de "${org.nombre_comercial}" en modo asistencia...`);
        this.router.navigate(['/admin/panel']);
      },
      error: () => {
        this.procesando.set(null);
        // Fallback local: fija la organización activa y entra directamente
        this.orgService.fijarOrgActiva(org);
        localStorage.setItem('openhost_modo_soporte', 'true');
        this.toast.info(`Entrando a "${org.nombre_comercial}" en modo soporte...`);
        this.router.navigate(['/admin/panel']);
      },
    });
  }

  // --- Asignación de Plan SaaS ---
  abrirModalPlan(org: Organizacion): void {
    this.orgSeleccionada.set(org);
    const planActualId = org.plan_actual?.plan_id ?? 1;
    const planObj = this.planesDisponibles().find((p) => p.plan_id === planActualId);

    this.planForm = {
      plan_id: planActualId,
      duracion_meses: 1,
      estado: (org.plan_actual?.estado as any) || 'activa',
      monto_pagado: planObj?.precio ?? 79,
      notas: '',
    };
    this.mostrarModalPlan.set(true);
  }

  alCambiarPlan(): void {
    const seleccionado = this.planesDisponibles().find((p) => p.plan_id === Number(this.planForm.plan_id));
    if (seleccionado) {
      this.planForm.monto_pagado = seleccionado.precio * this.planForm.duracion_meses;
    }
  }

  cerrarModalPlan(): void {
    this.mostrarModalPlan.set(false);
    this.orgSeleccionada.set(null);
  }

  guardarAsignacionPlan(): void {
    const org = this.orgSeleccionada();
    if (!org) return;

    this.orgService.asignarPlan(org.id, this.planForm).subscribe({
      next: () => {
        this.toast.success(`Plan asignado correctamente a ${org.nombre_comercial}.`);
        this.cerrarModalPlan();
        this.cargar();
      },
      error: (err) => {
        const msg = err?.error?.mensaje || 'Error al guardar el plan en el servidor.';
        this.toast.error(msg);
      },
    });
  }

  // --- Feature Flags: Encender / Apagar Módulos por Hotel ---
  abrirModalModulos(org: Organizacion): void {
    this.orgSeleccionada.set(org);
    this.mostrarModalModulos.set(true);
    this.cargandoModulos.set(true);

    this.orgService.obtenerModulos(org.id).subscribe({
      next: (res) => {
        this.cargandoModulos.set(false);
        const d = res.data;
        this.modulosDetalle.set({
          plan_nombre: d.plan_nombre,
          defaults_plan: d.defaults_plan,
          overrides: d.overrides,
        });
        this.modulosForm = {
          limpieza: !!d.modulos_activos?.limpieza,
          mantenimiento: !!d.modulos_activos?.mantenimiento,
          inventario: !!d.modulos_activos?.inventario,
          edificios: !!d.modulos_activos?.edificios,
          reservas_web: !!d.modulos_activos?.reservas_web,
          tienda: d.modulos_activos?.tienda !== undefined ? !!d.modulos_activos?.tienda : true,
        };
      },
      error: () => {
        this.cargandoModulos.set(false);
        // Fallback si no hay conexión
        this.modulosForm = {
          limpieza: true,
          mantenimiento: true,
          inventario: org.plan_actual?.nombre?.includes('Pro') ?? false,
          edificios: org.plan_actual?.nombre?.includes('Pro') ?? false,
          reservas_web: org.plan_actual?.nombre?.includes('Pro') ?? false,
          tienda: true,
        };
      },
    });
  }

  cerrarModalModulos(): void {
    this.mostrarModalModulos.set(false);
    this.orgSeleccionada.set(null);
    this.modulosDetalle.set(null);
  }

  guardarModulos(): void {
    const org = this.orgSeleccionada();
    if (!org) return;

    this.guardandoModulos.set(true);
    this.orgService.actualizarModulos(org.id, { modulos: this.modulosForm }).subscribe({
      next: (res) => {
        this.guardandoModulos.set(false);
        this.toast.success(`Módulos de "${org.nombre_comercial}" actualizados.`);
        if (res.data?.modulos_activos) {
          const updated: Organizacion = {
            ...org,
            modulos_activos: res.data.modulos_activos,
            modulos_overrides: res.data.overrides,
          };
          this.reemplazar(updated);
        }
        this.cerrarModalModulos();
      },
      error: () => {
        this.guardandoModulos.set(false);
        this.toast.error('Error al actualizar módulos del hotel.');
      },
    });
  }

  restablecerValoresPlan(): void {
    const org = this.orgSeleccionada();
    if (!org) return;

    this.guardandoModulos.set(true);
    this.orgService.actualizarModulos(org.id, { restablecer_plan: true }).subscribe({
      next: (res) => {
        this.guardandoModulos.set(false);
        this.toast.info(`Módulos restablecidos al estándar de su plan.`);
        if (res.data?.modulos_activos) {
          const updated: Organizacion = {
            ...org,
            modulos_activos: res.data.modulos_activos,
            modulos_overrides: null,
          };
          this.reemplazar(updated);
        }
        this.cerrarModalModulos();
      },
      error: () => {
        this.guardandoModulos.set(false);
        this.toast.error('Error al restablecer valores del plan.');
      },
    });
  }

  aprobar(org: Organizacion): void {
    this.procesando.set(org.id);
    this.orgService.aprobar(org.id).subscribe({
      next: (actualizada) => {
        this.procesando.set(null);
        this.reemplazar(actualizada);
        this.toast.success(`Hotel "${org.nombre_comercial}" aprobado.`);
      },
      error: () => {
        this.procesando.set(null);
        this.error.set('No pudimos aprobar esta organización.');
      },
    });
  }

  rechazar(org: Organizacion): void {
    this.procesando.set(org.id);
    this.orgService.rechazar(org.id).subscribe({
      next: (actualizada) => {
        this.procesando.set(null);
        this.reemplazar(actualizada);
        this.toast.info(`Hotel "${org.nombre_comercial}" rechazado.`);
      },
      error: () => {
        this.procesando.set(null);
        this.error.set('No pudimos rechazar esta organización.');
      },
    });
  }

  setFiltro(f: Filtro): void {
    this.filtro.set(f);
    this.paginaActual.set(1);
  }

  private reemplazar(actualizada: Organizacion): void {
    this.organizaciones.update((lista) => lista.map((o) => (o.id === actualizada.id ? actualizada : o)));
  }
}
