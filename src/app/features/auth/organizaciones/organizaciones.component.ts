import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { timeout } from 'rxjs';
import { IconComponent } from '../../../shared/icon/icon.component';
import { AuthService } from '../../../core/services/auth.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { MiOrganizacion, TIPOS_ORGANIZACION } from '../../../core/models/auth.models';
import { modulosVisibles } from '../../../core/access/modulos-por-rol';

@Component({
  selector: 'app-organizaciones',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './organizaciones.component.html',
  styleUrls: ['./organizaciones.component.scss'],
})
export class OrganizacionesComponent implements OnInit {
  vista = signal<'lista' | 'crear'>('lista');
  cargando = signal(true);
  entrando = signal<number | null>(null);
  creando = signal(false);
  error = signal<string | null>(null);
  organizaciones = signal<MiOrganizacion[]>([]);
  tiposOrganizacion = TIPOS_ORGANIZACION;

  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private orgService = inject(OrganizacionService);
  private router = inject(Router);

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
        if (list.length === 0) this.vista.set('crear');
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(err?.error?.message ?? 'No pudimos cargar tus organizaciones. Haz clic en reintentar.');
      },
    });
  }

  entrar(org: MiOrganizacion): void {
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
      next: () => {
        this.creando.set(false);
        this.vista.set('lista');
        this.cargar();
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