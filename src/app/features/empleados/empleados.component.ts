import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../shared/icon/icon.component';
import { EmpleadoService } from '../../core/services/empleado.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { Empleado, ROLES_EMPLEADO, TIPOS_DOCUMENTO } from '../../core/models/auth.models';
import { LoadingModalComponent } from '../../shared/loading-modal/loading-modal.component';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent, LoadingModalComponent],
  templateUrl: './empleados.component.html',
  styleUrls: ['./empleados.component.scss'],
})
export class EmpleadosComponent implements OnInit {
  private empleadoService = inject(EmpleadoService);
  private orgService = inject(OrganizacionService);
  private fb = inject(FormBuilder);

  cargando = signal(true);
  error = signal<string | null>(null);
  empleados = signal<Empleado[]>([]);
  mostrarForm = signal(false);
  guardando = signal(false);
  invitacionExitosa = signal(false);
  search = signal('');

  tiposDocumento = TIPOS_DOCUMENTO;
  rolesEmpleado = ROLES_EMPLEADO;

  form = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    apellido: ['', [Validators.required, Validators.maxLength(50)]],
    tipo_documento_id: [1, [Validators.required]],
    numero_documento: ['', [Validators.required, Validators.maxLength(15)]],
    numero_telefono: ['', [Validators.required, Validators.pattern(/^[0-9]+$/), Validators.maxLength(20)]],
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
    rol_slug: ['recepcionista', [Validators.required]],
  });

  private get organizacionId(): number | null {
    return this.orgService.orgActivaId();
  }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    const orgId = this.organizacionId;
    if (!orgId) return;

    this.cargando.set(true);
    this.error.set(null);
    this.empleadoService.listar(orgId).subscribe({
      next: (res) => {
        this.empleados.set(res.data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(
          err?.status === 403
            ? 'Solo el propietario o gerente puede ver el personal.'
            : 'No pudimos cargar los empleados.'
        );
      },
    });
  }

  filtrados(): Empleado[] {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.empleados();
    return this.empleados().filter((e) =>
      `${e.nombre ?? ''} ${e.apellido ?? ''} ${e.correo ?? ''}`.toLowerCase().includes(q)
    );
  }

  abrirForm(): void {
    this.mostrarForm.set(true);
    this.invitacionExitosa.set(false);
    this.error.set(null);
  }

  cerrarForm(): void {
    this.mostrarForm.set(false);
    this.form.reset({ tipo_documento_id: 1, rol_slug: 'recepcionista' });
  }

  submit(): void {
    const orgId = this.organizacionId;
    if (!orgId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    this.empleadoService.agregar(orgId, this.form.getRawValue() as any).subscribe({
      next: () => {
        this.guardando.set(false);
        this.invitacionExitosa.set(true);
        this.form.reset({ tipo_documento_id: 1, rol_slug: 'recepcionista' });
        this.cargar();
        setTimeout(() => {
          this.mostrarForm.set(false);
          this.invitacionExitosa.set(false);
        }, 2000);
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(this.mensajeError(err));
      },
    });
  }

  private mensajeError(err: any): string {
    const errores = err?.error?.errors;
    if (errores) {
      const primero = Object.values(errores)[0];
      if (Array.isArray(primero)) return primero[0];
    }
    return err?.error?.message ?? 'No pudimos agregar al empleado.';
  }
}
