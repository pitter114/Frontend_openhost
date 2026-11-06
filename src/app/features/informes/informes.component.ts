import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PmsDataService } from '../../core/services/pms-data.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { EstadisticasService } from '../../core/services/estadisticas.service';
import { LimpiezaService } from '../../core/services/limpieza.service';
import { MantenimientoService } from '../../core/services/mantenimiento.service';
import { InventarioService } from '../../core/services/inventario.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { BarChartComponent, BarSeries } from '../../shared/charts/bar-chart/bar-chart.component';
import { LoadingModalComponent } from '../../shared/loading-modal/loading-modal.component';
import { ReporteExportHelper, ReporteTablaConfig } from '../../core/utils/reporte-export-helper';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { FormsModule } from '@angular/forms';

interface ReportCard {
  key: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  categoria: string;
  categoriaColor: string;
  titulo: string;
  descripcion: string;
}

@Component({
  selector: 'app-informes',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, BarChartComponent, LoadingModalComponent],
  templateUrl: './informes.component.html',
  styleUrls: ['./informes.component.scss'],
})
export class InformesComponent implements OnInit {
  private orgService = inject(OrganizacionService);
  private estadisticasService = inject(EstadisticasService);
  private limpiezaService = inject(LimpiezaService);
  private mantenimientoService = inject(MantenimientoService);
  private inventarioService = inject(InventarioService);

  constructor(public data: PmsDataService) {}

  cargando = signal(false);

  // Date range filters (Default: 1st of month to today)
  fechaInicio = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  fechaFin = new Date().toISOString().slice(0, 10);

  // State for empty dataset alert modal
  mostrarModalSinDatos = signal(false);
  modalTitulo = signal('Sin Registros');
  modalMensaje = signal('');

  reportes: ReportCard[] = [
    { key: 'reservas', icon: 'file', iconBg: '#fdecec', iconColor: '#e0342c', categoria: 'Reservas', categoriaColor: 'blue', titulo: 'Reporte de Reservas', descripcion: 'Historial completo de reservas de la base de datos.' },
    { key: 'clientes', icon: 'users', iconBg: '#f2edfe', iconColor: '#8b5cf6', categoria: 'Clientes', categoriaColor: 'purple', titulo: 'Reporte de Clientes', descripcion: 'Base de datos de huéspedes registrados.' },
    { key: 'limpieza', icon: 'check', iconBg: '#fdf3e0', iconColor: '#f2a30f', categoria: 'Limpieza', categoriaColor: 'amber', titulo: 'Reporte de Limpieza', descripcion: 'Tareas de limpieza registradas por habitación' },
    { key: 'mantenimiento', icon: 'wrench', iconBg: '#fdedf5', iconColor: '#ec4899', categoria: 'Mantenimiento', categoriaColor: 'red', titulo: 'Reporte de Mantenimiento', descripcion: 'Incidencias técnicas y resoluciones' },
    { key: 'ocupacion', icon: 'building', iconBg: '#e4f7fa', iconColor: '#0ea5b7', categoria: 'Ocupación', categoriaColor: 'amber', titulo: 'Reporte de Ocupación', descripcion: 'Ocupación real por habitación' },
    { key: 'ingresos', icon: 'dollar', iconBg: '#fdf3e0', iconColor: '#17a34a', categoria: 'Finanzas', categoriaColor: 'green', titulo: 'Reporte de Ingresos', descripcion: 'Ingresos por reservas y servicios en Soles (S/)' },
    { key: 'salidas', icon: 'chart', iconBg: '#fdedf5', iconColor: '#e0342c', categoria: 'Finanzas', categoriaColor: 'red', titulo: 'Informe de Salidas / Gastos', descripcion: 'Salidas y egresos operativos' },
    { key: 'inventario_ingresos', icon: 'box', iconBg: '#e4f7fa', iconColor: '#0ea5b7', categoria: 'Inventario', categoriaColor: 'blue', titulo: 'Ingreso de Inventario', descripcion: 'Entradas de stock e insumos al almacén' },
    { key: 'inventario_salidas', icon: 'box', iconBg: '#fdf3e0', iconColor: '#f2a30f', categoria: 'Inventario', categoriaColor: 'amber', titulo: 'Reporte de Salida de Inventario', descripcion: 'Salidas y consumos de inventario' },
  ];

  ngOnInit(): void {
    this.data.cargarReservas();
  }

  private get orgId(): number | null {
    return this.orgService.orgActivaId();
  }

  get ingresosSalidasSeries(): BarSeries[] {
    const reservas = this.data.reservas || [];
    const totalIngresos = reservas.reduce((acc, r) => acc + (r.total || 0), 0);
    return [
      { name: 'Ingresos Reservas', color: '#17a34a', values: [totalIngresos] },
      { name: 'Salidas / Gastos', color: '#e0342c', values: [0] },
    ];
  }

  get labels(): string[] {
    return ['Período Actual'];
  }

  cerrarModalSinDatos(): void {
    this.mostrarModalSinDatos.set(false);
  }

  exportar(key: string, tipo: 'pdf' | 'excel'): void {
    const orgId = this.orgId;
    const hotelNombre = this.data.hotelNombre || 'HotelPMS';

    this.cargando.set(true);

    this.obtenerDatosReporte(key, orgId).subscribe({
      next: (config: ReporteTablaConfig) => {
        this.cargando.set(false);
        if (!config || !config.filas || config.filas.length === 0) {
          this.modalTitulo.set(`Sin datos en la Base de Datos`);
          this.modalMensaje.set(`No se encontraron registros en la base de datos para generar el '${config?.titulo || 'Reporte'}'.`);
          this.mostrarModalSinDatos.set(true);
          return;
        }

        if (tipo === 'pdf') {
          ReporteExportHelper.exportarPDF(config);
        } else {
          ReporteExportHelper.exportarExcel(config, `Reporte_${key}`);
        }
      },
      error: () => {
        this.cargando.set(false);
        this.modalTitulo.set('Sin Registros');
        this.modalMensaje.set('No hay datos registrados en la base de datos para este módulo.');
        this.mostrarModalSinDatos.set(true);
      },
    });
  }

  exportarTodoExcel(): void {
    const orgId = this.orgId;
    this.cargando.set(true);

    const keys = ['reservas', 'clientes', 'ingresos', 'ocupacion', 'limpieza', 'mantenimiento', 'inventario_ingresos'];
    const observables = keys.map((k) => this.obtenerDatosReporte(k, orgId));

    forkJoin(observables).subscribe({
      next: (configs: ReporteTablaConfig[]) => {
        this.cargando.set(false);
        const conDatos = configs.filter((c) => c && c.filas && c.filas.length > 0);
        if (conDatos.length === 0) {
          this.modalTitulo.set('Sin Registros');
          this.modalMensaje.set('No se encontraron registros suficientes para generar el libro completo de reportes.');
          this.mostrarModalSinDatos.set(true);
          return;
        }
        const hotelNombre = this.data.hotelNombre || 'HotelPMS';
        ReporteExportHelper.exportarLibroCompletoExcel(conDatos, `Libro_Completo_Reportes_${hotelNombre.replace(/\s+/g, '_')}`);
      },
      error: () => {
        this.cargando.set(false);
        this.modalTitulo.set('Error al exportar');
        this.modalMensaje.set('Ocurrió un error al compilar los datos para el libro completo.');
        this.mostrarModalSinDatos.set(true);
      },
    });
  }

  private obtenerDatosReporte(key: string, orgId: number | null): Observable<ReporteTablaConfig> {
    const hotelNombre = this.data.hotelNombre || 'HotelPMS';

    if (key === 'reservas') {
      const reservas = this.data.reservas || [];
      const config: ReporteTablaConfig = {
        titulo: 'Reporte General de Reservas',
        subtitulo: `Total de reservas: ${reservas.length}`,
        hotelNombre,
        columnas: [
          { clave: 'codigo', titulo: 'Código' },
          { clave: 'cliente', titulo: 'Huésped' },
          { clave: 'documento', titulo: 'DNI / Doc' },
          { clave: 'telefono', titulo: 'Teléfono' },
          { clave: 'habitacion', titulo: 'Habitación' },
          { clave: 'checkIn', titulo: 'Check-In' },
          { clave: 'checkOut', titulo: 'Check-Out' },
          { clave: 'estado', titulo: 'Estado' },
          { clave: 'totalStr', titulo: 'Total (S/)' },
        ],
        filas: reservas.map((r) => ({
          ...r,
          totalStr: `S/ ${(r.total || 0).toFixed(2)}`,
        })),
      };
      return of(config);
    }

    if (key === 'clientes') {
      const reservas = this.data.reservas || [];
      const clientesMap = new Map<string, { nombre: string; documento: string; telefono: string; estadias: number; totalGastado: number }>();

      reservas.forEach((r) => {
        const doc = r.documento || r.cliente;
        if (!doc) return;
        const actual = clientesMap.get(doc) || {
          nombre: r.cliente,
          documento: r.documento || 'Sin doc',
          telefono: r.telefono || 'Sin telf',
          estadias: 0,
          totalGastado: 0,
        };
        actual.estadias += 1;
        actual.totalGastado += Number(r.total) || 0;
        clientesMap.set(doc, actual);
      });

      const filas = Array.from(clientesMap.values()).map((c) => ({
        ...c,
        totalGastadoStr: `S/ ${c.totalGastado.toFixed(2)}`,
      }));

      const config: ReporteTablaConfig = {
        titulo: 'Reporte de Clientes y Huéspedes',
        subtitulo: `Total de clientes registrados: ${filas.length}`,
        hotelNombre,
        columnas: [
          { clave: 'nombre', titulo: 'Nombre Completo' },
          { clave: 'documento', titulo: 'DNI / Documento' },
          { clave: 'telefono', titulo: 'Teléfono' },
          { clave: 'estadias', titulo: 'Reservas Realizadas' },
          { clave: 'totalGastadoStr', titulo: 'Total Gastado (S/)' },
        ],
        filas,
      };
      return of(config);
    }

    if (key === 'ingresos') {
      const reservas = (this.data.reservas || []).filter((r) => Number(r.total) > 0);
      const config: ReporteTablaConfig = {
        titulo: 'Reporte de Ingresos de Reservas',
        subtitulo: 'Ingresos generados por reservas registradas en Soles',
        hotelNombre,
        columnas: [
          { clave: 'codigo', titulo: 'Reserva' },
          { clave: 'cliente', titulo: 'Huésped' },
          { clave: 'habitacion', titulo: 'Habitación' },
          { clave: 'origen', titulo: 'Canal de Origen' },
          { clave: 'checkIn', titulo: 'Fecha' },
          { clave: 'montoStr', titulo: 'Ingreso Total (S/)' },
        ],
        filas: reservas.map((r) => ({
          ...r,
          montoStr: `S/ ${(r.total || 0).toFixed(2)}`,
        })),
      };
      return of(config);
    }

    if (key === 'ocupacion') {
      if (!orgId) return of({ titulo: 'Reporte de Ocupación', columnas: [], filas: [], hotelNombre });
      return this.estadisticasService.alojamientos(orgId).pipe(
        catchError(() => of({ data: [] })),
        map((res: any) => {
          const list = res?.data || [];
          const filas = list.map((a: any) => ({
            unidad: a.etiqueta_unidad,
            tipo: a.tipo_alojamiento,
            precioStr: `S/ ${Number(a.precio_base || 0).toFixed(2)}`,
            estado: a.estados?.join(', ') || 'disponible',
          }));
          return {
            titulo: 'Reporte de Ocupación por Habitación',
            subtitulo: `Habitaciones evaluadas: ${filas.length}`,
            hotelNombre,
            columnas: [
              { clave: 'unidad', titulo: 'Habitación' },
              { clave: 'tipo', titulo: 'Tipo Alojamiento' },
              { clave: 'precioStr', titulo: 'Precio Base / Noche (S/)' },
              { clave: 'estado', titulo: 'Estado Actual' },
            ],
            filas,
          };
        })
      );
    }

    if (key === 'limpieza') {
      if (!orgId) return of({ titulo: 'Reporte de Limpieza', columnas: [], filas: [], hotelNombre });
      return forkJoin({
        p: this.limpiezaService.pendientes(orgId).pipe(catchError(() => of({ data: [] }))),
        e: this.limpiezaService.enProceso(orgId).pipe(catchError(() => of({ data: [] }))),
        c: this.limpiezaService.completadas(orgId).pipe(catchError(() => of({ data: [] }))),
      }).pipe(
        map(({ p, e, c }: any) => {
          const pList = p?.data || [];
          const eList = e?.data || [];
          const cList = c?.data || [];
          const todas = [...pList, ...eList, ...cList];
          const filas = todas.map((l: any) => ({
            habitacion: l.etiqueta_unidad || l.alojamiento_id,
            camarera: l.camarera || 'Sin asignar',
            estado: l.estado || 'Pendiente',
            notas: l.notas || '-',
            fecha: l.fecha_registro || '-',
          }));
          return {
            titulo: 'Reporte de Tareas de Limpieza',
            subtitulo: `Total de tareas de limpieza: ${filas.length}`,
            hotelNombre,
            columnas: [
              { clave: 'habitacion', titulo: 'Habitación' },
              { clave: 'camarera', titulo: 'Camarera Asignada' },
              { clave: 'estado', titulo: 'Estado Tarea' },
              { clave: 'notas', titulo: 'Notas / Observaciones' },
              { clave: 'fecha', titulo: 'Fecha Registro' },
            ],
            filas,
          };
        })
      );
    }

    if (key === 'mantenimiento') {
      if (!orgId) return of({ titulo: 'Reporte de Mantenimiento', columnas: [], filas: [], hotelNombre });
      return this.mantenimientoService.listar(orgId).pipe(
        catchError(() => of({ data: [] })),
        map((res: any) => {
          const list = res?.data || [];
          const filas = list.map((m: any) => ({
            habitacion: m.etiqueta_unidad || m.alojamiento_id,
            motivo: m.motivo_mantenimiento || m.descripcion || 'Revisión técnica',
            prioridad: m.prioridad || 'Media',
            estado: m.estado || 'Abierto',
            solucionado: m.estado === 'completado' || m.estado === 'cerrado' ? 'Sí' : 'No',
            fecha: m.fecha_inicio || m.created_at || '-',
          }));
          return {
            titulo: 'Reporte de Mantenimiento e Incidencias',
            subtitulo: `Incidencias registradas: ${filas.length}`,
            hotelNombre,
            columnas: [
              { clave: 'habitacion', titulo: 'Habitación' },
              { clave: 'motivo', titulo: 'Incidente / Motivo' },
              { clave: 'prioridad', titulo: 'Prioridad' },
              { clave: 'estado', titulo: 'Estado Atención' },
              { clave: 'solucionado', titulo: '¿Solucionado?' },
              { clave: 'fecha', titulo: 'Fecha Registro' },
            ],
            filas,
          };
        })
      );
    }

    if (key === 'inventario_ingresos' || key === 'inventario_salidas') {
      if (!orgId) return of({ titulo: 'Reporte de Inventario', columnas: [], filas: [], hotelNombre });
      return this.inventarioService.articulos(orgId).pipe(
        catchError(() => of({ data: [] })),
        map((res: any) => {
          const list = res?.data || [];
          const filas = list.map((i: any) => ({
            nombre: i.nombre,
            categoria: i.categoria || 'General',
            stock: i.stock_actual || 0,
            minimo: i.stock_minimo || 0,
            estado: (i.stock_actual || 0) <= (i.stock_minimo || 0) ? 'Stock Bajo' : 'Normal',
          }));
          return {
            titulo: key === 'inventario_ingresos' ? 'Reporte de Ingreso de Inventario' : 'Reporte de Salida de Inventario',
            subtitulo: `Artículos en inventario: ${filas.length}`,
            hotelNombre,
            columnas: [
              { clave: 'nombre', titulo: 'Producto / Insumo' },
              { clave: 'categoria', titulo: 'Categoría' },
              { clave: 'stock', titulo: 'Stock Actual' },
              { clave: 'minimo', titulo: 'Stock Mínimo' },
              { clave: 'estado', titulo: 'Estado Stock' },
            ],
            filas,
          };
        })
      );
    }

    // Salidas / Gastos
    return of({
      titulo: 'Informe de Salidas y Gastos Operativos',
      subtitulo: 'Gastos registrados en la base de datos',
      hotelNombre,
      columnas: [
        { clave: 'concepto', titulo: 'Concepto de Gasto' },
        { clave: 'montoStr', titulo: 'Monto (S/)' },
        { clave: 'fecha', titulo: 'Fecha' },
      ],
      filas: [],
    });
  }
}
