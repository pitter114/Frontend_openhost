import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { IconComponent } from '../../../shared/icon/icon.component';
import { CatalogoService } from '../../../core/services/catalogo.service';
import { InventarioService } from '../../../core/services/inventario.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { CatalogoItem } from '../../../core/models/establecimiento.models';
import { ArticuloTarjeta, CategoriaArticulo } from '../../../core/models/inventario.models';

@Component({
  selector: 'app-articulo-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IconComponent],
  templateUrl: './articulo-form.component.html',
  styleUrls: ['./articulo-form.component.scss'],
})
export class ArticuloFormComponent implements OnInit {
  @Input({ required: true }) categorias: CategoriaArticulo[] = [];
  @Input() articulo: ArticuloTarjeta | null = null;
  @Output() creado = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private catalogoService = inject(CatalogoService);
  private inventarioService = inject(InventarioService);
  private orgService = inject(OrganizacionService);

  cargando = signal(false);
  error = signal<string | null>(null);
  defaultTipos: CatalogoItem[] = [
    { id: 1, nombre: 'Consumible' },
    { id: 2, nombre: 'Reutilizable' },
    { id: 3, nombre: 'Activo' },
  ];
  tiposArticulo = signal<CatalogoItem[]>(this.defaultTipos);

  nuevaCategoria = signal(false);
  categoriaNombre = '';
  guardandoCategoria = signal(false);
  categoriasLocal = signal<CategoriaArticulo[]>([]);

  form = this.fb.group({
    categoria_articulo_id: [null as number | null, [Validators.required]],
    tipo_articulo_id: [null as number | null, [Validators.required]],
    nombre: ['', [Validators.required, Validators.maxLength(100)]],
    unidad_medida: ['', [Validators.required, Validators.maxLength(30)]],
    descripcion: ['', [Validators.maxLength(255)]],
    stock_minimo: [0, [Validators.required, Validators.min(0)]],
    stock_objetivo: [null as number | null, [Validators.min(0)]],
    stock_maximo: [null as number | null, [Validators.min(0)]],
    permite_stock_negativo: [false],
    control_individual: [false],
    cantidad_inicial: [0, [Validators.min(0)]],
  });

  ngOnInit(): void {
    this.categoriasLocal.set(this.categorias);
    this.catalogoService.tiposArticulo().subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.tiposArticulo.set(res.data);
        }
      },
      error: () => {
        this.tiposArticulo.set(this.defaultTipos);
      },
    });

    if (this.articulo) {
      this.form.patchValue({
        categoria_articulo_id: this.articulo.categoria?.categoria_articulo_id ?? null,
        tipo_articulo_id: this.articulo.tipo_articulo?.tipo_articulo_id ?? null,
        nombre: this.articulo.nombre,
        unidad_medida: this.articulo.unidad_medida,
        stock_minimo: this.articulo.stock_minimo,
        stock_objetivo: this.articulo.stock_objetivo,
        stock_maximo: this.articulo.stock_maximo,
      });
    }
  }

  crearCategoriaInline(): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId || !this.categoriaNombre.trim()) return;

    this.guardandoCategoria.set(true);
    this.inventarioService.crearCategoria(orgId, { nombre: this.categoriaNombre.trim() }).subscribe({
      next: (cat) => {
        this.guardandoCategoria.set(false);
        this.categoriasLocal.update((lista) => [...lista, cat]);
        this.form.patchValue({ categoria_articulo_id: cat.categoria_articulo_id });
        this.nuevaCategoria.set(false);
        this.categoriaNombre = '';
      },
      error: (err) => {
        this.guardandoCategoria.set(false);
        this.error.set(err?.error?.message ?? 'No pudimos crear la categoría.');
      },
    });
  }

  submit(): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.cargando.set(true);
    this.error.set(null);

    const payload = this.form.getRawValue() as any;

    if (this.articulo) {
      this.inventarioService.actualizarArticulo(orgId, this.articulo.articulo_id, payload).subscribe({
        next: () => {
          this.cargando.set(false);
          this.creado.emit();
        },
        error: (err) => {
          this.cargando.set(false);
          this.error.set(this.mensajeError(err));
        },
      });
    } else {
      this.inventarioService.crearArticulo(orgId, payload).subscribe({
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
    return err?.error?.message ?? 'No pudimos crear el artículo.';
  }
}
