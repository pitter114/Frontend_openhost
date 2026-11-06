import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../../shared/icon/icon.component';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { EstablecimientoService } from '../../../core/services/establecimiento.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { CatalogoItem, Establecimiento } from '../../../core/models/establecimiento.models';

@Component({
  selector: 'app-establecimiento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './establecimiento-form.component.html',
  styleUrls: ['./establecimiento-form.component.scss'],
})
export class EstablecimientoFormComponent implements OnInit {
  @Output() creado = new EventEmitter<Establecimiento>();
  @Output() cerrar = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private catalogoService = inject(CatalogoService);
  private establecimientoService = inject(EstablecimientoService);
  private orgService = inject(OrganizacionService);

  cargando = signal(false);
  error = signal<string | null>(null);
  tiposEstablecimiento = signal<CatalogoItem[]>([]);
  ciudades = signal<CatalogoItem[]>([]);

  form = this.fb.group({
    tipo_establecimiento_id: [null as number | null, [Validators.required]],
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    descripcion_establecimiento: ['', [Validators.maxLength(1000)]],
    ciudad_id: [null as number | null, [Validators.required]],
    texto_direccion: ['', [Validators.required, Validators.maxLength(255)]],
  });

  ngOnInit(): void {
    this.catalogoService.tiposEstablecimiento().subscribe({ next: (res) => this.tiposEstablecimiento.set(res.data) });
    this.catalogoService.ciudades().subscribe({ next: (res) => this.ciudades.set(res.data) });
  }

  submit(): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    this.establecimientoService.crear(orgId, this.form.getRawValue() as any).subscribe({
      next: (establecimiento) => {
        this.cargando.set(false);
        this.creado.emit(establecimiento);
      },
      error: (err) => {
        this.cargando.set(false);
        this.error.set(this.mensajeError(err));
      },
    });
  }

  cerrarModal(): void {
    this.cerrar.emit();
  }

  private mensajeError(err: any): string {
    const errores = err?.error?.errors;
    if (errores) {
      const primero = Object.values(errores)[0];
      if (Array.isArray(primero)) return primero[0];
    }
    return err?.error?.message ?? 'No pudimos registrar tu propiedad.';
  }
}
