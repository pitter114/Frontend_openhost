import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../../shared/icon/icon.component';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { EstablecimientoService } from '../../../core/services/establecimiento.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { CatalogoItem, Establecimiento } from '../../../core/models/establecimiento.models';
import { AlojamientoTarjeta } from '../../../core/models/estadisticas.models';

@Component({
  selector: 'app-alojamiento-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  templateUrl: './alojamiento-form.component.html',
  styleUrls: ['./alojamiento-form.component.scss'],
})
export class AlojamientoFormComponent implements OnInit, OnChanges {
  @Input({ required: true }) establecimientos: Establecimiento[] = [];
  @Input() alojamientoAEditar?: AlojamientoTarjeta | null = null;
  @Output() creado = new EventEmitter<void>();
  @Output() actualizado = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private catalogoService = inject(CatalogoService);
  private establecimientoService = inject(EstablecimientoService);
  private orgService = inject(OrganizacionService);

  cargando = signal(false);
  error = signal<string | null>(null);
  tiposAlojamiento = signal<CatalogoItem[]>([]);
  vistaPreviaImagen = signal<string | null>(null);

  form = this.fb.group({
    establecimiento_id: [null as number | null, [Validators.required]],
    etiqueta_unidad: ['', [Validators.required, Validators.maxLength(30)]],
    tipo_alojamiento: [null as number | null, [Validators.required]],
    num_habitaciones: [1, [Validators.min(0)]],
    descripcion_alojamiento: ['', [Validators.required, Validators.maxLength(2000)]],
    precio_base: [null as number | null, [Validators.required, Validators.min(0)]],
    max_huespedes_base: [2, [Validators.required, Validators.min(1)]],
    max_huespedes_extra: [0, [Validators.min(0)]],
    costo_huesped_extra: [0, [Validators.min(0)]],
    imagen_principal: [''],
  });

  get establecimientoSeleccionado(): Establecimiento | null {
    const estId = this.form.get('establecimiento_id')?.value;
    if (!estId && this.establecimientos && this.establecimientos.length > 0) {
      return this.establecimientos[0];
    }
    return this.establecimientos.find((e) => e.establecimiento_id === estId) ?? null;
  }

  get esHotelOHostal(): boolean {
    const tipo = (this.establecimientoSeleccionado?.tipo_establecimiento ?? '').toLowerCase();
    return tipo.includes('hotel') || tipo.includes('hostal');
  }

  get esDeptoOCabana(): boolean {
    const tipo = (this.establecimientoSeleccionado?.tipo_establecimiento ?? '').toLowerCase();
    return (
      tipo.includes('departamento') ||
      tipo.includes('cabaña') ||
      tipo.includes('cabana') ||
      tipo.includes('casa') ||
      tipo.includes('apartahotel')
    );
  }

  get tiposAlojamientoFiltrados(): CatalogoItem[] {
    const todos = this.tiposAlojamiento();

    if (this.esHotelOHostal) {
      // Si la propiedad es Hotel o Hostal, se ocultan Casa, Departamento Completo y Cabaña.
      return todos.filter((t) => {
        const nombreLower = (t.nombre ?? '').toLowerCase();
        return (
          !nombreLower.includes('casa') &&
          !nombreLower.includes('departamento') &&
          !nombreLower.includes('cabaña') &&
          !nombreLower.includes('cabana')
        );
      });
    }

    return todos;
  }

  ngOnInit(): void {
    this.catalogoService.tiposAlojamiento().subscribe({
      next: (res) => {
        this.tiposAlojamiento.set(res.data);
        this.cargarDatosEdicion();
      },
    });
    this.actualizarEstablecimientoId();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['establecimientos']) {
      this.actualizarEstablecimientoId();
    }
    if (changes['alojamientoAEditar']) {
      this.cargarDatosEdicion();
    }
  }

  private cargarDatosEdicion(): void {
    if (this.alojamientoAEditar && this.tiposAlojamiento().length > 0) {
      const a = this.alojamientoAEditar;
      const tipoObj = this.tiposAlojamiento().find((t) => t.nombre === a.tipo_alojamiento);
      this.form.patchValue({
        etiqueta_unidad: a.etiqueta_unidad,
        tipo_alojamiento: tipoObj?.id ?? null,
        precio_base: a.precio_base,
        imagen_principal: a.imagen_principal ?? '',
        descripcion_alojamiento: (a as any).descripcion_alojamiento ?? a.tipo_alojamiento,
      });
      if (a.imagen_principal) {
        this.vistaPreviaImagen.set(a.imagen_principal);
      }
    }
  }

  private actualizarEstablecimientoId(): void {
    if (this.establecimientos && this.establecimientos.length > 0 && !this.form.get('establecimiento_id')?.value) {
      this.form.patchValue({
        establecimiento_id: this.establecimientos[0].establecimiento_id,
      });
    }
  }

  onArchivoSeleccionado(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        this.vistaPreviaImagen.set(result);
        this.form.patchValue({ imagen_principal: result });
      };
      reader.readAsDataURL(file);
    }
  }

  quitarImagen(): void {
    this.vistaPreviaImagen.set(null);
    this.form.patchValue({ imagen_principal: '' });
  }

  submit(): void {
    const orgId = this.orgService.orgActivaId();

    if (!this.form.get('establecimiento_id')?.value && this.establecimientos && this.establecimientos.length > 0) {
      this.form.patchValue({ establecimiento_id: this.establecimientos[0].establecimiento_id });
    }

    if (!orgId || this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Por favor completa todos los campos obligatorios del formulario.');
      return;
    }

    const rawValues = this.form.getRawValue();
    const establecimiento_id = rawValues.establecimiento_id;
    if (!establecimiento_id) {
      this.error.set('Debes seleccionar o registrar una propiedad primero.');
      return;
    }

    const payload = {
      ...rawValues,
      num_habitaciones: this.esHotelOHostal ? 1 : (rawValues.num_habitaciones ?? 1),
      max_huespedes_extra: rawValues.max_huespedes_extra ?? 0,
      costo_huesped_extra: rawValues.costo_huesped_extra ?? 0,
    };
    delete (payload as any).establecimiento_id;

    this.cargando.set(true);
    this.error.set(null);

    if (this.alojamientoAEditar) {
      this.establecimientoService
        .actualizarAlojamiento(orgId, this.alojamientoAEditar.alojamiento_id, payload as any)
        .subscribe({
          next: () => {
            this.cargando.set(false);
            this.actualizado.emit();
          },
          error: (err) => {
            this.cargando.set(false);
            this.error.set(this.mensajeError(err));
          },
        });
    } else {
      this.establecimientoService.crearAlojamiento(orgId, establecimiento_id, payload as any).subscribe({
        next: () => {
          this.cargando.set(false);
          this.creado.emit();
        },
        error: (err) => {
          this.cargando.set(false);
          this.error.set(this.mensajeError(err));
        },
      });
    }
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
    return err?.error?.message ?? 'No pudimos guardar el alojamiento.';
  }
}
