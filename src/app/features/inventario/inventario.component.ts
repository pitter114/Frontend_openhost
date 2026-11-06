import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../shared/icon/icon.component';
import { InventarioService } from '../../core/services/inventario.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { ArticuloTarjeta, CategoriaArticulo, EstadisticasInventario } from '../../core/models/inventario.models';
import { ArticuloFormComponent } from './articulo-form/articulo-form.component';
import { LoadingModalComponent } from '../../shared/loading-modal/loading-modal.component';

const COLOR_HEX: Record<string, string> = { rojo: '#e0342c', amarillo: '#f2a30f', verde: '#17a34a' };
const BADGE_MOD: Record<string, string> = { rojo: 'red', amarillo: 'amber', verde: 'green' };
const ESTADO_LABEL: Record<string, string> = { critico: 'Crítico', medio: 'Medio', optimo: 'Óptimo' };

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ArticuloFormComponent, LoadingModalComponent],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss'],
})
export class InventarioComponent implements OnInit {
  private inventarioService = inject(InventarioService);
  private orgService = inject(OrganizacionService);

  cargando = signal(true);
  error = signal<string | null>(null);
  stats = signal<EstadisticasInventario | null>(null);
  categorias = signal<CategoriaArticulo[]>([]);
  articulos = signal<ArticuloTarjeta[]>([]);
  pagina = signal(1);
  totalPaginas = signal(1);
  mostrarFormArticulo = signal(false);
  articuloAEditar = signal<ArticuloTarjeta | null>(null);

  mostrarModalStock = signal(false);
  articuloAjustarStock = signal<ArticuloTarjeta | null>(null);
  nuevaCantidadStock = 0;
  guardandoStock = signal(false);

  search = '';
  categoriaSeleccionada: number | null = null;
  private buscarTimeout: any;

  private get orgId(): number | null {
    return this.orgService.orgActivaId();
  }

  ngOnInit(): void {
    const orgId = this.orgId;
    if (!orgId) return;

    this.inventarioService.estadisticas(orgId).subscribe({ next: (res) => this.stats.set(res.data) });
    this.cargarCategorias();
    this.cargarArticulos();
  }

  abrirModalCrear(): void {
    this.articuloAEditar.set(null);
    this.mostrarFormArticulo.set(true);
  }

  abrirEditarArticulo(a: ArticuloTarjeta): void {
    this.articuloAEditar.set(a);
    this.mostrarFormArticulo.set(true);
  }

  abrirAjustarStock(a: ArticuloTarjeta): void {
    this.articuloAjustarStock.set(a);
    this.nuevaCantidadStock = a.cantidad_total;
    this.mostrarModalStock.set(true);
  }

  cerrarModalStock(): void {
    this.mostrarModalStock.set(false);
    this.articuloAjustarStock.set(null);
  }

  guardarAjusteStock(): void {
    const orgId = this.orgId;
    const a = this.articuloAjustarStock();
    if (!orgId || !a) return;

    this.guardandoStock.set(true);
    this.inventarioService.ajustarStock(orgId, a.articulo_id, this.nuevaCantidadStock).subscribe({
      next: () => {
        this.guardandoStock.set(false);
        this.cerrarModalStock();
        this.cargarArticulos();
        this.inventarioService.estadisticas(orgId).subscribe({ next: (res) => this.stats.set(res.data) });
      },
      error: (err) => {
        this.guardandoStock.set(false);
        this.error.set(err?.error?.message ?? 'No pudimos actualizar el stock.');
      },
    });
  }

  cargarCategorias(): void {
    const orgId = this.orgId;
    if (!orgId) return;
    this.inventarioService.categorias(orgId).subscribe({ next: (res) => this.categorias.set(res.data) });
  }

  onArticuloCreado(): void {
    this.mostrarFormArticulo.set(false);
    this.articuloAEditar.set(null);
    this.cargarCategorias();
    this.cargarArticulos();
    this.inventarioService.estadisticas(this.orgId!).subscribe({ next: (res) => this.stats.set(res.data) });
  }

  cargarArticulos(): void {
    const orgId = this.orgId;
    if (!orgId) return;

    this.cargando.set(true);
    this.error.set(null);

    this.inventarioService
      .articulos(orgId, {
        busqueda: this.search || undefined,
        categoria_articulo_id: this.categoriaSeleccionada ?? undefined,
        page: this.pagina(),
      })
      .subscribe({
        next: (res) => {
          this.articulos.set(res.data);
          this.totalPaginas.set(res.meta.last_page);
          this.cargando.set(false);
        },
        error: (err) => {
          this.cargando.set(false);
          this.error.set(
            err?.status === 403 ? 'Tu rol no tiene acceso al inventario.' : 'No pudimos cargar el inventario.'
          );
        },
      });
  }

  onBuscar(): void {
    clearTimeout(this.buscarTimeout);
    this.buscarTimeout = setTimeout(() => {
      this.pagina.set(1);
      this.cargarArticulos();
    }, 350);
  }

  setCategoria(id: number | null): void {
    this.categoriaSeleccionada = id;
    this.pagina.set(1);
    this.cargarArticulos();
  }

  irAPagina(p: number): void {
    if (p < 1 || p > this.totalPaginas()) return;
    this.pagina.set(p);
    this.cargarArticulos();
  }

  colorHex(a: ArticuloTarjeta): string {
    return COLOR_HEX[a.color];
  }

  badgeMod(a: ArticuloTarjeta): string {
    return BADGE_MOD[a.color];
  }

  estadoLabel(a: ArticuloTarjeta): string {
    return ESTADO_LABEL[a.estado_stock];
  }
}
