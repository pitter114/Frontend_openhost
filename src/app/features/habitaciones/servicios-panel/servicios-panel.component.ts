import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../../shared/icon/icon.component';
import { ServicioService } from '../../../core/services/servicio.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { Servicio } from '../../../core/models/establecimiento.models';

@Component({
  selector: 'app-servicios-panel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './servicios-panel.component.html',
  styleUrls: ['./servicios-panel.component.scss'],
})
export class ServiciosPanelComponent implements OnInit {
  @Output() cerrar = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private servicioService = inject(ServicioService);
  private orgService = inject(OrganizacionService);

  cargando = signal(true);
  guardando = signal(false);
  error = signal<string | null>(null);
  servicios = signal<Servicio[]>([]);
  mostrarForm = signal(false);

  form = this.fb.group({
    nombre_servicio: ['', [Validators.required, Validators.maxLength(100)]],
    precio_base: [0, [Validators.required, Validators.min(0)]],
    descripcion_servicio: ['', [Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    this.cargar();
  }

  private get orgId(): number | null {
    return this.orgService.orgActivaId();
  }

  cargar(): void {
    const orgId = this.orgId;
    if (!orgId) return;
    this.cargando.set(true);
    this.servicioService.listar(orgId).subscribe({
      next: (res) => {
        this.servicios.set(res.data);
        this.cargando.set(false);
      },
      error: () => {
        this.cargando.set(false);
        this.error.set('No pudimos cargar los servicios.');
      },
    });
  }

  submit(): void {
    const orgId = this.orgId;
    if (!orgId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.guardando.set(true);
    this.error.set(null);

    this.servicioService.crear(orgId, this.form.getRawValue() as any).subscribe({
      next: () => {
        this.guardando.set(false);
        this.mostrarForm.set(false);
        this.form.reset({ precio_base: 0 });
        this.cargar();
      },
      error: (err) => {
        this.guardando.set(false);
        this.error.set(err?.error?.message ?? 'No pudimos crear el servicio.');
      },
    });
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }
}
