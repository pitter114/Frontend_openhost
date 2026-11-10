import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { timeout } from 'rxjs';
import { IconComponent } from '../../../shared/icon/icon.component';
import { AuthService } from '../../../core/services/auth.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { MiOrganizacion, TIPOS_ORGANIZACION } from '../../../core/models/auth.models';
import { PlanSaas } from '../../../core/models/saas.models';
import { modulosVisibles } from '../../../core/access/modulos-por-rol';

@Component({
  selector: 'app-organizaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './organizaciones.component.html',
  styleUrls: ['./organizaciones.component.scss'],
})
export class OrganizacionesComponent implements OnInit {
  vista = signal<'lista' | 'crear' | 'planes'>('lista');
  cargando = signal(true);
  entrando = signal<number | null>(null);
  creando = signal(false);
  procesandoPago = signal(false);
  error = signal<string | null>(null);
  mensajeExito = signal<string | null>(null);

  organizaciones = signal<MiOrganizacion[]>([]);
  tiposOrganizacion = TIPOS_ORGANIZACION;
  planes = signal<PlanSaas[]>([]);
  planSeleccionadoId = signal<number>(1);
  orgParaPagar = signal<MiOrganizacion | null>(null);

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private orgService = inject(OrganizacionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  form = this.fb.group({
    tipo_organizacion_id: [1, [Validators.required]],
    nombre_comercial: ['', [Validators.required, Validators.maxLength(150)]],
    nombre_legal: ['', [Validators.maxLength(80)]],
    ruc: ['', [Validators.maxLength(11)]],
    correo_contacto: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    telefono_contacto: ['', [Validators.required, Validators.maxLength(11)]],
  });

  ngOnInit(): void {
    this.cargar();
    this.cargarPlanes();
    this.verificarRetornoPago();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set(null);

    this.orgService.misOrganizaciones().pipe(
      timeout(8000)
    ).subscribe({
      next: (res) => {
        const list = res?.data ?? [];
        this.organizaciones.set(list);
        this.cargando.set(false);
        if (list.length === 0 && this.vista() !== 'planes') this.vista.set('crear');
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? 'No pudimos cargar tus organizaciones. Haz clic en reintentar.');
      },
    });
  }

  cargarPlanes(): void {
    this.orgService.planesPublicos().subscribe({
      next: (res) => {
        const list = res?.data ?? [];
        this.planes.set(list);
        if (list.length > 0) {
          const planFavorito = list.find((p) => p.nombre.toLowerCase().includes('pro')) || list[0];
          this.planSeleccionadoId.set(planFavorito.plan_id);
        }
      },
      error: () => {},
    });
  }

  verificarRetornoPago(): void {
    this.route.queryParams.subscribe((params) => {
      const status = params['status'];
      const orgId = params['org_id'];
      const planId = params['plan_id'];

      if (status === 'approved' && orgId) {
        this.procesandoPago.set(true);
        this.orgService.confirmarSuscripcion(Number(orgId), Number(planId || 1), 'approved').subscribe({
          next: (res) => {
            this.procesandoPago.set(false);
            this.mensajeExito.set(res.mensaje || '¡Pago confirmado con éxito! Tu hotel ha sido activado.');
            this.cargar();
            // Limpiar query params de la URL
            this.router.navigate([], { replaceUrl: true, queryParams: {} });
          },
          error: () => {
            this.procesandoPago.set(false);
            this.cargar();
          },
        });
      } else if (status === 'rejected' || status === 'failure') {
        this.error.set('El pago no fue aprobado o fue cancelado. Puedes intentar nuevamente o pagar por WhatsApp.');
      }
    });
  }

  abrirPlanes(org: MiOrganizacion, event?: Event): void {
    if (event) event.stopPropagation();
    this.orgParaPagar.set(org);
    this.vista.set('planes');
  }

  seleccionarPlan(planId: number): void {
    this.planSeleccionadoId.set(planId);
  }

  pagarConMercadoPago(): void {
    const org = this.orgParaPagar();
    const planId = this.planSeleccionadoId();
    if (!org || !planId) return;

    this.procesandoPago.set(true);
    this.error.set(null);

    this.orgService.checkoutSuscripcion(org.organizacion.id, planId).subscribe({
      next: (res) => {
        if (res?.data?.init_point) {
          window.location.href = res.data.init_point;
        } else {
          this.procesandoPago.set(false);
          this.error.set('No se pudo generar el enlace de pago de Mercado Pago.');
        }
      },
      error: (err) => {
        this.procesandoPago.set(false);
        this.error.set(err?.error?.message || 'Error al conectar con la pasarela de pago.');
      },
    });
  }

  contactarWhatsApp(org?: MiOrganizacion | null): void {
    const hotel = org ? org.organizacion.nombre_comercial : (this.orgParaPagar()?.organizacion.nombre_comercial || 'mi hotel');
    const planObj = this.planes().find((p) => p.plan_id === this.planSeleccionadoId());
    const planNombre = planObj ? planObj.nombre : 'Plan Hotel';
    const precio = planObj ? `S/ ${planObj.precio}` : '';
    const texto = encodeURIComponent(
      `Hola OpenHost, acabo de registrar mi hotel *${hotel}* y deseo activar el plan *${planNombre}* (${precio}). ¿Me podrían brindar las cuentas bancarias o Yape para el pago?`
    );
    window.open(`https://wa.me/51984751487?text=${texto}`, '_blank');
  }

  entrar(org: MiOrganizacion): void {
    if (org.organizacion.estado !== 'activa') {
      this.abrirPlanes(org);
      return;
    }

    if (this.auth.cuenta()?.contrasena_temporal) {
      this.error.set('Por seguridad, debes cambiar tu contraseña obligatoria antes de ingresar a este hotel.');
      return;
    }

    this.entrando.set(org.id);
    this.error.set(null);
    this.orgService.entrar(org.organizacion.id).subscribe({
      next: () => {
        this.entrando.set(null);
        this.orgService.fijarRolesActivos(org.roles);
        const esOpenHostAdmin = org.roles.includes('openhost-super-admin') || org.roles.includes('openhost-admin');
        this.router.navigate([esOpenHostAdmin ? '/superadmin/panel' : `/admin/${this.primerModulo(org.roles)}`]);
      },
      error: (err) => {
        this.entrando.set(null);
        this.error.set(err?.error?.message ?? 'No pudimos ingresar a esta organización.');
      },
    });
  }

  submitCrear(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.creando.set(true);
    this.error.set(null);

    this.orgService.crear(this.form.getRawValue() as any).subscribe({
      next: (nuevaOrg: any) => {
        this.creando.set(false);
        this.cargar();
        // Dirigir inmediatamente a elegir plan y pagar
        const item: MiOrganizacion = {
          id: nuevaOrg.id || nuevaOrg.organizacion_id,
          organizacion: nuevaOrg,
          roles: ['propietario'],
          perfiles: ['PROPIETARIO'],
        };
        this.abrirPlanes(item);
      },
      error: (err) => {
        this.creando.set(false);
        this.error.set(this.mensajeError(err));
      },
    });
  }

  cerrarSesion(): void {
    this.auth.logout().subscribe({ complete: () => this.router.navigate(['/login']) });
  }

  private primerModulo(roles: string[]): string {
    const visibles = modulosVisibles(roles);
    if (visibles === 'todos') return 'panel';
    const orden = ['panel', 'reservas', 'calendario', 'habitaciones', 'clientes', 'inventario', 'limpieza', 'mantenimiento', 'pagos', 'caja', 'informes'];
    return orden.find((m) => visibles.has(m)) ?? 'panel';
  }

  private mensajeError(err: any): string {
    const errores = err?.error?.errors;
    if (errores) {
      const primero = Object.values(errores)[0];
      if (Array.isArray(primero)) return primero[0];
    }
    return err?.error?.message ?? 'No pudimos crear la organización. Intenta nuevamente.';
  }
}
