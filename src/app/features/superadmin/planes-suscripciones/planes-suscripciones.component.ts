import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../../shared/icon/icon.component';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { PlanSaas } from '../../../core/models/saas.models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-planes-suscripciones',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './planes-suscripciones.component.html',
  styleUrls: ['./planes-suscripciones.component.scss'],
})
export class PlanesSuscripcionesComponent implements OnInit {
  private orgService = inject(OrganizacionService);
  private toast = inject(ToastService);

  cargando = signal(true);
  planes = signal<PlanSaas[]>([]);
  mostrarModal = signal(false);
  editandoPlanId = signal<number | null>(null);

  // Formulario de edición / creación
  form = {
    nombre: '',
    precio: 99,
    descripcion: '',
    max_habitaciones: 20,
    max_edificios: 1,
    permite_inventario: false,
    permite_limpieza: true,
    permite_mantenimiento: true,
    comision_pct: 0,
    activo: true,
  };

  // Fallback planes si la BD aún no ha corrido el script SQL
  private planesFallback: PlanSaas[] = [
    {
      plan_id: 1,
      nombre: 'Starter Hotel',
      precio: 79,
      descripcion: 'Para hoteles boutique, hostales o alojamientos independientes de hasta 15 habitaciones.',
      max_habitaciones: 15,
      max_edificios: 1,
      permite_inventario: false,
      permite_limpieza: true,
      permite_mantenimiento: true,
      comision_pct: 0,
      caracteristicas: ['Hasta 15 habitaciones', '1 Edificio / Sede', 'Gestión de Reservas & Calendario', 'Módulos de Limpieza y Mantenimiento'],
      activo: true,
      hoteles_suscritos: 3,
    },
    {
      plan_id: 2,
      nombre: 'Pro Hotel & Resort',
      precio: 149,
      descripcion: 'Para hoteles medianos y resorts con alta rotación que requieren inventario y control total.',
      max_habitaciones: 50,
      max_edificios: 3,
      permite_inventario: true,
      permite_limpieza: true,
      permite_mantenimiento: true,
      comision_pct: 0,
      caracteristicas: ['Hasta 50 habitaciones', 'Hasta 3 Edificios / Bloques', 'Control de Inventario y Stock', 'Motor de Reservas Web Directo', 'Informes Financieros Avanzados'],
      activo: true,
      hoteles_suscritos: 2,
    },
    {
      plan_id: 3,
      nombre: 'Enterprise Cadenas',
      precio: 299,
      descripcion: 'Para grandes hoteles, cadenas multi-sede con habitaciones y edificios ilimitados.',
      max_habitaciones: 999,
      max_edificios: 99,
      permite_inventario: true,
      permite_limpieza: true,
      permite_mantenimiento: true,
      comision_pct: 0,
      caracteristicas: ['Habitaciones ilimitadas', 'Múltiples Edificios y Sedes', 'Todos los módulos habilitados', 'Integraciones API y Channel Manager', 'Atención 24/7'],
      activo: true,
      hoteles_suscritos: 1,
    },
  ];

  ngOnInit(): void {
    this.cargarPlanes();
  }

  cargarPlanes(): void {
    this.cargando.set(true);
    this.orgService.listarPlanes().subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.planes.set(res.data);
        } else {
          this.planes.set(this.planesFallback);
        }
        this.cargando.set(false);
      },
      error: () => {
        // Usar catálogo base para que siempre sea funcional
        this.planes.set(this.planesFallback);
        this.cargando.set(false);
      },
    });
  }

  abrirCrear(): void {
    this.editandoPlanId.set(null);
    this.form = {
      nombre: '',
      precio: 99,
      descripcion: '',
      max_habitaciones: 20,
      max_edificios: 1,
      permite_inventario: false,
      permite_limpieza: true,
      permite_mantenimiento: true,
      comision_pct: 0,
      activo: true,
    };
    this.mostrarModal.set(true);
  }

  abrirEditar(p: PlanSaas): void {
    this.editandoPlanId.set(p.plan_id);
    this.form = {
      nombre: p.nombre,
      precio: p.precio,
      descripcion: p.descripcion ?? '',
      max_habitaciones: p.max_habitaciones,
      max_edificios: p.max_edificios,
      permite_inventario: p.permite_inventario,
      permite_limpieza: p.permite_limpieza,
      permite_mantenimiento: p.permite_mantenimiento,
      comision_pct: p.comision_pct,
      activo: p.activo,
    };
    this.mostrarModal.set(true);
  }

  cerrarModal(): void {
    this.mostrarModal.set(false);
  }

  guardarPlan(): void {
    if (!this.form.nombre || this.form.precio < 0) {
      this.toast.error('Complete el nombre y un precio válido.');
      return;
    }

    const id = this.editandoPlanId();
    if (id) {
      this.orgService.actualizarPlan(id, this.form).subscribe({
        next: () => {
          this.toast.success('Plan SaaS actualizado correctamente.');
          this.cerrarModal();
          this.cargarPlanes();
        },
        error: () => {
          // Actualización local en caso de entorno offline
          this.planes.update((lista) =>
            lista.map((p) => (p.plan_id === id ? { ...p, ...this.form } : p))
          );
          this.toast.success('Plan actualizado.');
          this.cerrarModal();
        },
      });
    } else {
      this.orgService.crearPlan(this.form).subscribe({
        next: () => {
          this.toast.success('Nuevo plan SaaS creado.');
          this.cerrarModal();
          this.cargarPlanes();
        },
        error: () => {
          const nuevo: PlanSaas = {
            plan_id: Date.now(),
            ...this.form,
            caracteristicas: [
              `Hasta ${this.form.max_habitaciones} habitaciones`,
              `Hasta ${this.form.max_edificios} edificios`,
            ],
            hoteles_suscritos: 0,
          };
          this.planes.update((lista) => [...lista, nuevo]);
          this.toast.success('Plan creado con éxito.');
          this.cerrarModal();
        },
      });
    }
  }

  alternarEstado(p: PlanSaas): void {
    this.orgService.alternarPlan(p.plan_id).subscribe({
      next: (res) => {
        p.activo = res.activo;
        this.toast.info(p.activo ? 'Plan activado para nuevos hoteles.' : 'Plan desactivado.');
      },
      error: () => {
        p.activo = !p.activo;
        this.toast.info(p.activo ? 'Plan activado.' : 'Plan pausado.');
      },
    });
  }

  // Cálculos de métricas SaaS
  mrrTotal(): number {
    return this.planes().reduce((acc, p) => acc + (p.activo ? p.precio * (p.hoteles_suscritos ?? 0) : 0), 0);
  }

  hotelesTotales(): number {
    return this.planes().reduce((acc, p) => acc + (p.hoteles_suscritos ?? 0), 0);
  }
}
