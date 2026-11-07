import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PmsDataService } from '../../core/services/pms-data.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { ClienteService, ClienteBackend } from '../../core/services/cliente.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { LoadingModalComponent } from '../../shared/loading-modal/loading-modal.component';

export interface ClienteView {
  id: number;
  nombre: string;
  documento: string;
  telefono: string;
  correo: string;
  nacionalidad: string;
  estadias: number;
  gastado: number;
  ultimaVisita: string;
  frecuencia: string;
  vip?: boolean;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, LoadingModalComponent],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.scss'],
})
export class ClientesComponent implements OnInit {
  private clienteService = inject(ClienteService);
  private orgService = inject(OrganizacionService);
  private toast = inject(ToastService);

  cargando = signal(true);
  search = '';
  clientes = signal<ClienteView[]>([]);

  // Modal de Reporte de Incidencias a Lista Negra
  mostrarModalIncidencia = signal(false);
  clienteSeleccionado = signal<ClienteView | null>(null);
  enviandoIncidencia = signal(false);

  incidenciaForm = {
    tipo_incidencia: 'impago' as 'impago' | 'danos_materiales' | 'conducta_inapropiada' | 'fraude' | 'otro',
    severidad: 'alta' as 'baja' | 'media' | 'alta' | 'critica',
    calificacion: 1,
    monto_deuda: 0,
    descripcion: '',
  };

  constructor(public data: PmsDataService) {}

  ngOnInit(): void {
    this.cargarClientes();
  }

  cargarClientes(): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId) {
      this.cargarDesdeFallback();
      return;
    }

    this.cargando.set(true);
    this.clienteService.listar(orgId, this.search).subscribe({
      next: (res) => {
        this.cargando.set(false);
        if (res?.data && res.data.length > 0) {
          const mapped: ClienteView[] = res.data.map((c) => ({
            id: c.huesped_organizacion_id,
            nombre: c.nombre,
            documento: c.dni,
            telefono: c.telefono || '—',
            correo: c.correo || '—',
            nacionalidad: c.nacionalidad || 'PER',
            estadias: c.estadias || 1,
            gastado: (c.estadias || 1) * 150,
            ultimaVisita: c.ultima_visita || new Date().toISOString().slice(0, 10),
            frecuencia: c.frecuencia === 'alta' ? 'Alta' : c.frecuencia === 'baja' ? 'Baja' : 'Media',
            vip: (c.estadias || 0) >= 5,
          }));
          this.clientes.set(mapped);
        } else {
          this.cargarDesdeFallback();
        }
      },
      error: () => {
        this.cargando.set(false);
        this.cargarDesdeFallback();
      },
    });
  }

  private cargarDesdeFallback(): void {
    this.cargando.set(false);
    const mock = this.data.clientes.map((c, idx) => ({
      id: idx + 1,
      nombre: c.nombre,
      documento: c.documento,
      telefono: c.telefono,
      correo: c.correo,
      nacionalidad: c.nacionalidad,
      estadias: c.estadias,
      gastado: c.gastado,
      ultimaVisita: c.ultimaVisita,
      frecuencia: c.frecuencia,
      vip: c.vip,
    }));
    this.clientes.set(mock);
  }

  get filtered(): ClienteView[] {
    const term = this.search.trim().toLowerCase();
    const list = this.clientes();
    if (!term) return list;
    return list.filter(
      (c) =>
        c.nombre.toLowerCase().includes(term) ||
        c.documento.toLowerCase().includes(term) ||
        c.correo.toLowerCase().includes(term)
    );
  }

  get topRecurrentes(): ClienteView[] {
    return [...this.clientes()].sort((a, b) => b.estadias - a.estadias).slice(0, 4);
  }

  frecuenciaClass(f: string): string {
    const l = f.toLowerCase();
    return l === 'alta' ? 'green' : l === 'baja' ? 'gray' : 'blue';
  }

  initials(nombre: string): string {
    return (nombre || 'H').trim().charAt(0).toUpperCase();
  }

  formatFecha(iso?: string): string {
    if (!iso) return '—';
    try {
      const d = new Date(iso + 'T00:00:00');
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return iso;
    }
  }

  // --- Reporte a Lista Negra / Red de Seguridad ---
  abrirReportarIncidencia(c: ClienteView): void {
    this.clienteSeleccionado.set(c);
    this.incidenciaForm = {
      tipo_incidencia: 'impago',
      severidad: 'alta',
      calificacion: 1,
      monto_deuda: 0,
      descripcion: '',
    };
    this.mostrarModalIncidencia.set(true);
  }

  setCalificacion(estrellas: number): void {
    this.incidenciaForm.calificacion = estrellas;
  }

  cerrarModalIncidencia(): void {
    this.mostrarModalIncidencia.set(false);
    this.clienteSeleccionado.set(null);
  }

  enviarIncidencia(): void {
    const c = this.clienteSeleccionado();
    if (!c) return;
    if (!this.incidenciaForm.descripcion.trim()) {
      this.toast.error('Por favor escribe el detalle de lo ocurrido con el huésped.');
      return;
    }

    const orgNombre = this.orgService.orgActiva()?.nombre_comercial || 'Hotel Afiliado';

    this.enviandoIncidencia.set(true);
    this.clienteService
      .reportarIncidencia({
        numero_documento: c.documento,
        nombre_completo: c.nombre,
        tipo_incidencia: this.incidenciaForm.tipo_incidencia,
        severidad: this.incidenciaForm.severidad,
        calificacion: this.incidenciaForm.calificacion,
        monto_deuda: Number(this.incidenciaForm.monto_deuda) || 0,
        descripcion: this.incidenciaForm.descripcion.trim(),
        reportado_por_nombre: `Recepción ${orgNombre}`,
      })
      .subscribe({
        next: () => {
          this.enviandoIncidencia.set(false);
          this.toast.success(
            `Incidencia de "${c.nombre}" registrada. Enviada al Super Admin para alerta en la red.`
          );
          this.cerrarModalIncidencia();
        },
        error: (err) => {
          this.enviandoIncidencia.set(false);
          this.toast.error(err?.error?.mensaje || 'No se pudo enviar el reporte.');
        },
      });
  }
}
