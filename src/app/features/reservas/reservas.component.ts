import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { PmsDataService } from '../../core/services/pms-data.service';
import { OrganizacionService } from '../../core/services/organizacion.service';
import { EstadisticasService } from '../../core/services/estadisticas.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { EstadoReserva, Reserva } from '../../core/models/pms.models';
import { AlojamientoTarjeta } from '../../core/models/estadisticas.models';
import { ReservaFormComponent } from './reserva-form/reserva-form.component';
import { LoadingModalComponent } from '../../shared/loading-modal/loading-modal.component';

const ESTADO_BADGE: Record<EstadoReserva, string> = {
  Registrarse: 'purple',
  Confirmada: 'blue',
  Verificar: 'green',
  Pendiente: 'amber',
};

const ORIGEN_COLOR: Record<string, string> = {
  Directo: '#3b6bf6',
  'Booking.com': '#8b5cf6',
  Expedia: '#17a34a',
  Airbnb: '#f2a30f',
  Agencia: '#ec4899',
  'Propiedad web': '#0ea5b7',
};

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, IconComponent, LoadingModalComponent, ReservaFormComponent],
  templateUrl: './reservas.component.html',
  styleUrls: ['./reservas.component.scss'],
})
export class ReservasComponent {
  public data = inject(PmsDataService);
  private fb = inject(FormBuilder);
  private orgService = inject(OrganizacionService);
  private estadisticasService = inject(EstadisticasService);
  private toast = inject(ToastService);

  search = '';

  reservaVer = signal<Reserva | null>(null);
  reservaEditar = signal<Reserva | null>(null);
  reservaEliminar = signal<Reserva | null>(null);
  reservaImprimir = signal<Reserva | null>(null);

  // Nueva Reserva selector
  mostrarSelectorHabitaciones = signal(false);
  cargandoHabitaciones = signal(false);
  alojamientosLista = signal<AlojamientoTarjeta[]>([]);
  habitacionParaReserva = signal<AlojamientoTarjeta | null>(null);
  filtroTipoHabitacion = signal<string>('todos');

  guardandoEdit = signal(false);
  eliminando = signal(false);
  mensajeModal = signal<string | null>(null);

  editForm = this.fb.group({
    cliente: ['', [Validators.required]],
    documento: ['', [Validators.required]],
    telefono: [''],
    checkIn: ['', [Validators.required]],
    checkOut: ['', [Validators.required]],
    estado: ['Confirmada', [Validators.required]],
  });

  get filtered(): Reserva[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.data.reservas;
    return this.data.reservas.filter(
      (r) => r.cliente.toLowerCase().includes(term) || r.codigo.toLowerCase().includes(term) || r.habitacion.includes(term)
    );
  }

  badgeClass(estado: EstadoReserva): string {
    return ESTADO_BADGE[estado] ?? 'gray';
  }

  origenColor(origen: string): string {
    return ORIGEN_COLOR[origen] ?? 'var(--pms-text-soft)';
  }

  formatFecha(iso: string): string {
    if (!iso) return '—';
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  generarLinkReserva(r: Reserva): string {
    const params = new URLSearchParams();
    params.set('hotel', this.data.hotelNombre);
    params.set('unidad', r.habitacion || '');
    if (r.checkIn) params.set('checkin', r.checkIn);
    if (r.checkOut) params.set('checkout', r.checkOut);
    if (r.total) params.set('precio', String(r.total));
    if (r.huespedes) params.set('huespedes', String(r.huespedes));

    const idRef = r.alojamiento_id || r.reserva_id || 1;
    return `${window.location.origin}/reservar/${idRef}?${params.toString()}`;
  }

  copiarLink(r: Reserva): void {
    const link = this.generarLinkReserva(r);
    navigator.clipboard.writeText(link).then(() => {
      this.toast.success(`Enlace de reserva para ${r.cliente} copiado al portapapeles.`);
    });
  }

  enviarWhatsapp(r: Reserva): void {
    const link = this.generarLinkReserva(r);
    const hotel = this.data.hotelNombre;
    const lineas = [
      `🏨 *${hotel}*`,
      `¡Hola ${r.cliente}! Te compartimos el enlace oficial para completar tus datos y confirmar tu reserva:`,
      '',
      `🛏️ *Habitación:* ${r.habitacion}`,
      `📅 *Check-in:* ${r.checkIn}`,
      `📅 *Check-out:* ${r.checkOut}`,
      `💰 *Total:* S/ ${r.total.toLocaleString('es-ES')}`,
      '',
      `🔗 *Haz clic aquí para confirmar y pagar:*`,
      link,
      '',
      `¡Puedes pagar con Mercado Pago (Tarjetas, Yape, Plin) o directamente en recepción!`,
    ];

    const texto = encodeURIComponent(lineas.join('\n'));
    const telefono = (r.telefono || '').replace(/\D/g, '');
    const url = telefono ? `https://wa.me/${telefono}?text=${texto}` : `https://wa.me/?text=${texto}`;
    window.open(url, '_blank');
  }

  verReserva(r: Reserva): void {
    this.reservaVer.set(r);
  }

  cerrarVer(): void {
    this.reservaVer.set(null);
  }

  abrirEditar(r: Reserva): void {
    this.reservaEditar.set(r);
    this.editForm.patchValue({
      cliente: r.cliente,
      documento: r.documento,
      telefono: r.telefono,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      estado: r.estado,
    });
  }

  cerrarEditar(): void {
    this.reservaEditar.set(null);
  }

  guardarEdicion(): void {
    const r = this.reservaEditar();
    if (!r || !r.reserva_id || this.editForm.invalid) return;

    this.guardandoEdit.set(true);
    const v = this.editForm.getRawValue();

    const payload = {
      nombre_huesped: v.cliente,
      dni_huesped: v.documento,
      telefono_huesped: v.telefono,
      fecha_entrada: v.checkIn,
      fecha_salida: v.checkOut,
      estado: v.estado,
    };

    this.data.actualizarReserva(r.reserva_id, payload, () => {
      this.guardandoEdit.set(false);
      this.cerrarEditar();
    });
  }

  abrirEliminar(r: Reserva): void {
    this.reservaEliminar.set(r);
  }

  cerrarEliminar(): void {
    this.reservaEliminar.set(null);
  }

  confirmarEliminar(): void {
    const r = this.reservaEliminar();
    if (!r || !r.reserva_id) return;

    this.eliminando.set(true);
    this.data.eliminarReserva(r.reserva_id, () => {
      this.eliminando.set(false);
      this.cerrarEliminar();
    });
  }

  calcularNoches(checkIn: string, checkOut: string): number {
    if (!checkIn || !checkOut) return 1;
    const d1 = new Date(checkIn.substring(0, 10));
    const d2 = new Date(checkOut.substring(0, 10));
    const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  }

  imprimirReserva(r: Reserva): void {
    const hotelNombre = this.data.hotelNombre || 'Hotel & Resort';
    const checkIn = this.formatFecha(r.checkIn);
    const checkOut = this.formatFecha(r.checkOut);
    const noches = this.calcularNoches(r.checkIn, r.checkOut);
    const total = Number(r.total) || 0;
    const debe = Number(r.debe) || 0;
    const pagado = Math.max(0, total - debe);
    const tarifaPorNoche = (total / noches).toFixed(2);
    const fechaEmision = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const voucherHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Comprobante de Reserva - ${r.codigo}</title>
        <style>
          @page {
            size: A4 portrait;
            margin: 14mm 16mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #1e293b;
            background: #ffffff;
            font-size: 13px;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .voucher {
            max-width: 780px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 32px 36px;
            background: #ffffff;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 20px;
            border-bottom: 2px solid #2563eb;
            margin-bottom: 24px;
          }
          .brand-name {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.02em;
          }
          .brand-sub {
            font-size: 12px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            margin-top: 2px;
            font-weight: 600;
          }
          .voucher-tag {
            text-align: right;
          }
          .code-box {
            display: inline-block;
            background: #eff6ff;
            border: 1px solid #bfdbfe;
            color: #1d4ed8;
            padding: 6px 14px;
            border-radius: 8px;
            font-weight: 800;
            font-size: 16px;
            letter-spacing: 0.02em;
          }
          .emission-date {
            font-size: 11px;
            color: #94a3b8;
            margin-top: 5px;
          }
          .status-bar {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 10px 16px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
          }
          .status-pill {
            font-weight: 700;
            padding: 3px 10px;
            border-radius: 999px;
            font-size: 12px;
            background: #dbeafe;
            color: #1e40af;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 24px;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 16px 18px;
            background: #f8fafc;
          }
          .card-title {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            font-weight: 700;
            margin-bottom: 12px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 6px;
          }
          .field {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            font-size: 13px;
          }
          .field:last-child {
            margin-bottom: 0;
          }
          .field-label {
            color: #64748b;
          }
          .field-val {
            font-weight: 600;
            color: #0f172a;
            text-align: right;
          }
          .highlight {
            color: #2563eb;
            font-weight: 700;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #f1f5f9;
            color: #475569;
            font-size: 11.5px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 10px 14px;
            text-align: left;
            border-top: 1px solid #cbd5e1;
            border-bottom: 1px solid #cbd5e1;
          }
          td {
            padding: 12px 14px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .tot-row td {
            font-size: 14px;
            font-weight: 700;
            border-bottom: none;
            padding-top: 8px;
            padding-bottom: 4px;
          }
          .total-big {
            font-size: 18px;
            color: #0f172a;
          }
          .paid-val { color: #16a34a; }
          .due-val { color: #dc2626; }
          .policies {
            background: #fdfdfd;
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            padding: 14px 18px;
            margin-bottom: 24px;
            font-size: 11.5px;
            color: #64748b;
          }
          .policies h4 {
            color: #334155;
            font-size: 12px;
            margin-bottom: 6px;
            text-transform: uppercase;
          }
          .policies ul {
            padding-left: 18px;
          }
          .policies li {
            margin-bottom: 3px;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 18px;
          }
          .footer-thanks {
            font-size: 13px;
            font-weight: 700;
            color: #0f172a;
          }
          .footer-thanks p {
            font-size: 11.5px;
            color: #64748b;
            font-weight: 400;
            margin-top: 2px;
          }
          .seal-stamp {
            border: 2px solid #22c55e;
            color: #16a34a;
            padding: 6px 12px;
            border-radius: 6px;
            font-weight: 800;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
        </style>
      </head>
      <body>
        <div class="voucher">
          <div class="header">
            <div>
              <div class="brand-name">${hotelNombre}</div>
              <div class="brand-sub">Comprobante Oficial de Reserva & Hospedaje</div>
            </div>
            <div class="voucher-tag">
              <div class="code-box">N° ${r.codigo}</div>
              <div class="emission-date">Emitido: ${fechaEmision}</div>
            </div>
          </div>

          <div class="status-bar">
            <span><strong>Tipo de Operación:</strong> Confirmación de Estancia</span>
            <span class="status-pill">${r.estado}</span>
          </div>

          <div class="grid-2">
            <div class="card">
              <div class="card-title">Datos del Huésped</div>
              <div class="field">
                <span class="field-label">Titular:</span>
                <span class="field-val">${r.cliente}</span>
              </div>
              <div class="field">
                <span class="field-label">DNI / Pasaporte:</span>
                <span class="field-val">${r.documento || 'No registrado'}</span>
              </div>
              <div class="field">
                <span class="field-label">Teléfono:</span>
                <span class="field-val">${r.telefono || 'Sin teléfono'}</span>
              </div>
              ${r.origen ? `
                <div class="field">
                  <span class="field-label">Canal de Reserva:</span>
                  <span class="field-val">${r.origen}</span>
                </div>
              ` : ''}
            </div>

            <div class="card">
              <div class="card-title">Información de la Estancia</div>
              <div class="field">
                <span class="field-label">Alojamiento:</span>
                <span class="field-val highlight">${r.habitacion}</span>
              </div>
              <div class="field">
                <span class="field-label">Check-in:</span>
                <span class="field-val">${checkIn} (14:00 hrs)</span>
              </div>
              <div class="field">
                <span class="field-label">Check-out:</span>
                <span class="field-val">${checkOut} (12:00 hrs)</span>
              </div>
              <div class="field">
                <span class="field-label">Total Noches:</span>
                <span class="field-val">${noches} Noche(s)</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Concepto / Detalle</th>
                <th class="text-center">Noches</th>
                <th class="text-right">Tarifa / Noche</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Hospedaje en Unidad ${r.habitacion}</strong>
                  <div style="font-size: 11.5px; color: #64748b; margin-top: 2px;">
                    Estancia del ${checkIn} al ${checkOut}
                  </div>
                </td>
                <td class="text-center">${noches}</td>
                <td class="text-right">S/ ${tarifaPorNoche}</td>
                <td class="text-right"><strong>S/ ${total.toFixed(2)}</strong></td>
              </tr>
              <tr class="tot-row">
                <td colspan="3" class="text-right">Total Hospedaje:</td>
                <td class="text-right total-big">S/ ${total.toFixed(2)}</td>
              </tr>
              <tr class="tot-row">
                <td colspan="3" class="text-right">Monto Abonado:</td>
                <td class="text-right paid-val">S/ ${pagado.toFixed(2)}</td>
              </tr>
              <tr class="tot-row">
                <td colspan="3" class="text-right">Saldo Pendiente al Ingreso:</td>
                <td class="text-right due-val">S/ ${debe.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="policies">
            <h4>Políticas de Alojamiento & Check-in</h4>
            <ul>
              <li><strong>Documentación:</strong> Todo huésped mayor de edad debe presentar documento de identidad original físico vigente al ingresar.</li>
              <li><strong>Horarios:</strong> El horario de ingreso oficial es a partir de las 14:00 hrs. El check-out debe realizarse antes de las 12:00 hrs.</li>
              <li><strong>Late Check-out:</strong> Sujeto a disponibilidad previa coordinación con la administración de recepción.</li>
            </ul>
          </div>

          <div class="footer">
            <div class="footer-thanks">
              ¡Muchas gracias por su preferencia!
              <p>Esperamos que disfrute de una estancia placentera y confortable.</p>
            </div>
            <div class="seal-stamp">
              ✓ RESERVA VÁLIDA
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Imprimir mediante iframe aislado (elimina 100% de fugas del topbar o avatar)
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(voucherHtml);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1200);
      }, 300);
    }
  }

  cerrarImprimir(): void {
    this.reservaImprimir.set(null);
  }

  // --- Nueva Reserva Directa a Habitación ---
  abrirNuevaReserva(): void {
    this.mostrarSelectorHabitaciones.set(true);
    this.cargarAlojamientosParaReserva();
  }

  cerrarSelectorHabitaciones(): void {
    this.mostrarSelectorHabitaciones.set(false);
  }

  cargarAlojamientosParaReserva(): void {
    const orgId = this.orgService.orgActivaId();
    if (!orgId) return;

    this.cargandoHabitaciones.set(true);
    this.estadisticasService.alojamientos(orgId).subscribe({
      next: (res) => {
        this.alojamientosLista.set(res.data);
        this.cargandoHabitaciones.set(false);
      },
      error: () => {
        this.cargandoHabitaciones.set(false);
        this.toast.error('No se pudieron cargar los alojamientos del hotel.');
      },
    });
  }

  seleccionarHabitacionParaReserva(a: AlojamientoTarjeta): void {
    if (!a.estados.includes('disponible')) {
      this.toast.warning(`La unidad ${a.etiqueta_unidad} está ${this.estadoLabel(a).toLowerCase()}. Elige una disponible.`);
      return;
    }
    this.habitacionParaReserva.set(a);
    this.mostrarSelectorHabitaciones.set(false);
  }

  cerrarReservaForm(): void {
    this.habitacionParaReserva.set(null);
    this.data.cargarReservas(true);
  }

  esDisponible(a: AlojamientoTarjeta): boolean {
    return a.estados.includes('disponible');
  }

  estadoLabel(a: AlojamientoTarjeta): string {
    if (a.estados.includes('disponible')) return 'Disponible';
    if (a.estados.includes('ocupado')) return 'Ocupada';
    if (a.estados.includes('reservado')) return 'Reservada';
    if (a.estados.includes('en_limpieza')) return 'En Limpieza';
    if (a.estados.includes('mantenimiento')) return 'Mantenimiento';
    return 'No disponible';
  }

  estadoColor(a: AlojamientoTarjeta): string {
    if (a.estados.includes('disponible')) return 'var(--pms-green)';
    if (a.estados.includes('ocupado')) return 'var(--pms-purple)';
    if (a.estados.includes('reservado')) return 'var(--pms-blue)';
    if (a.estados.includes('en_limpieza')) return 'var(--pms-amber)';
    if (a.estados.includes('mantenimiento')) return 'var(--pms-red)';
    return 'var(--pms-text-muted)';
  }
}
