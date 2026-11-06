import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
  selector: 'app-confirmacion-reserva',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  template: `
    <div class="confirmacion-page">
      <!-- Tarjeta en Pantalla -->
      <div class="confirmation-card no-print">
        <div class="status-icon" [class.success]="status() === 'approved'" [class.pending]="status() === 'pending'" [class.danger]="status() === 'rejected'">
          <app-icon [name]="status() === 'approved' ? 'check' : (status() === 'pending' ? 'sparkles' : 'alert')" [size]="36"></app-icon>
        </div>

        @if (status() === 'approved') {
          <h2>¡Pago Aprobado con Éxito! 🎉</h2>
          <p class="subtitle">Su transacción ha sido confirmada vía <strong>Mercado Pago</strong> y su habitación está asegurada en el hotel.</p>
        } @else if (status() === 'pending') {
          <h2>Pago en Proceso</h2>
          <p class="subtitle">Mercado Pago está procesando la acreditación. Su reserva se confirmará de forma automática en breve.</p>
        } @else {
          <h2>Pago No Completado</h2>
          <p class="subtitle">La transacción no pudo completarse. Puede intentar nuevamente o abonar en recepción.</p>
        }

        <div class="voucher-box">
          <div class="voucher-row">
            <span class="label">Código de Reserva:</span>
            <strong class="value highlight">{{ codigoReserva() }}</strong>
          </div>
          <div class="voucher-row">
            <span class="label">Hotel:</span>
            <span class="value">{{ hotelNombre() }}</span>
          </div>
          <div class="voucher-row">
            <span class="label">Titular:</span>
            <span class="value">{{ huespedNombre() }}</span>
          </div>
          <div class="voucher-row">
            <span class="label">Método de Pago:</span>
            <span class="value">Mercado Pago (Online)</span>
          </div>
          <div class="voucher-row">
            <span class="label">Estado de la Operación:</span>
            <span class="badge" [class.badge-success]="status() === 'approved'" [class.badge-warn]="status() === 'pending'">
              {{ status() === 'approved' ? 'Acreditado / Confirmado' : (status() === 'pending' ? 'Pendiente de acreditación' : 'Rechazado') }}
            </span>
          </div>
        </div>

        <!-- Botón de WhatsApp -->
        <div class="whatsapp-box">
          <button class="btn btn-whatsapp" (click)="enviarWhatsApp()">
            <span class="wa-icon">📲</span>
            <span>Enviar Voucher a mi WhatsApp</span>
          </button>
          <small class="wa-sub">Recibirás los datos de tu reserva, instrucciones de llegada y ubicación en Google Maps.</small>
        </div>

        <div class="actions-row">
          <button class="btn btn-primary" (click)="imprimirComprobante()">
            <app-icon name="printer" [size]="16"></app-icon>
            <span>Imprimir Boleta / Voucher</span>
          </button>
          <a class="btn btn-outline" routerLink="/login">
            <app-icon name="arrowLeft" [size]="16"></app-icon>
            <span>Volver al Inicio</span>
          </a>
        </div>
      </div>

      <!-- Comprobante Oficial Imprimible (Visible solo al imprimir) -->
      <div class="printable-ticket print-only">
        <div class="ticket-header">
          <div class="ticket-brand">
            <h2>{{ hotelNombre() }}</h2>
            <p>COMPROBANTE DE RESERVA & ESTADÍA</p>
          </div>
          <div class="ticket-badge-box">
            <span class="ticket-code">{{ codigoReserva() }}</span>
            <span class="ticket-date">Emisión: {{ fechaEmision }}</span>
          </div>
        </div>

        <div class="ticket-divider"></div>

        <div class="ticket-grid">
          <div class="t-col">
            <span class="t-lbl">DATOS DEL HUÉSPED</span>
            <strong>{{ huespedNombre() }}</strong>
            <span>DNI/Doc: {{ huespedDoc() }}</span>
            <span>Teléfono: {{ huespedTel() }}</span>
          </div>
          <div class="t-col">
            <span class="t-lbl">DETALLE DE ESTADÍA</span>
            <strong>Check-In: {{ checkin() }} (14:00)</strong>
            <span>Check-Out: {{ checkout() }} (12:00)</span>
            <span>Alojamiento: Habitación Confirmada</span>
          </div>
        </div>

        <div class="ticket-divider"></div>

        <div class="ticket-payment">
          <div class="tp-row">
            <span>Forma de Pago:</span>
            <strong>Mercado Pago Checkout Pro (Soles)</strong>
          </div>
          <div class="tp-row">
            <span>Referencia de Pago:</span>
            <span>{{ externalRef() || codigoReserva() }}</span>
          </div>
          <div class="tp-row total-row">
            <span>TOTAL PAGADO:</span>
            <strong class="total-price">S/ {{ montoTotal() }}</strong>
          </div>
        </div>

        <div class="ticket-footer">
          <div class="qr-placeholder">
            <!-- QR SVG Minimalista -->
            <svg width="70" height="70" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm10 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 0h2v2h-2v-2zm-2-2h2v2h-2v-2zm4-2h2v2h-2v-2zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z" />
            </svg>
            <small>Voucher Oficial Validador</small>
          </div>
          <div class="ticket-terms">
            <p>• Presente este voucher impreso o digital al momento del check-in.</p>
            <p>• Check-in a partir de las 14:00 hrs. Check-out hasta las 12:00 hrs.</p>
            <p>• Ubicación y asistencia en recepción: <strong>{{ hotelNombre() }}</strong></p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .confirmacion-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
      background: #090d16;
      font-family: inherit;
    }

    .confirmation-card {
      background: #111827;
      border: 1px solid #1e293b;
      border-radius: 16px;
      padding: 2.5rem;
      max-width: 540px;
      width: 100%;
      text-align: center;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.45);
    }

    .status-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      margin: 0 auto 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;

      &.success { background: rgba(34, 197, 94, 0.15); color: #22c55e; border: 2px solid rgba(34, 197, 94, 0.3); }
      &.pending { background: rgba(245, 158, 11, 0.15); color: #f59e0b; border: 2px solid rgba(245, 158, 11, 0.3); }
      &.danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 2px solid rgba(239, 68, 68, 0.3); }
    }

    h2 { color: #f8fafc; font-size: 1.6rem; margin: 0 0 0.5rem 0; }
    .subtitle { color: #94a3b8; font-size: 0.95rem; margin: 0 0 1.75rem 0; line-height: 1.5; }

    .voucher-box {
      background: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 12px;
      padding: 1.25rem;
      margin-bottom: 1.5rem;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 0.85rem;

      .voucher-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9rem;

        .label { color: #64748b; }
        .value { color: #f1f5f9; font-weight: 500; }
        .highlight { color: #38bdf8; font-weight: 700; font-family: monospace; font-size: 1.05rem; }
      }
    }

    .badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-weight: 600;

      &.badge-success { background: rgba(34, 197, 94, 0.15); color: #4ade80; }
      &.badge-warn { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
    }

    .whatsapp-box {
      background: rgba(37, 211, 102, 0.08);
      border: 1px solid rgba(37, 211, 102, 0.25);
      border-radius: 12px;
      padding: 1rem;
      margin-bottom: 1.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;

      .btn-whatsapp {
        width: 100%;
        background: #25d366;
        color: #ffffff;
        font-weight: 700;
        font-size: 0.95rem;
        padding: 0.75rem 1.25rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);
        transition: background 0.2s;

        &:hover { background: #1ebd5b; }
      }

      .wa-sub { font-size: 0.75rem; color: #86efac; line-height: 1.35; }
    }

    .actions-row {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.4rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.2s;
      border: none;

      &.btn-primary { background: #0ea5e9; color: #ffffff; &:hover { background: #0284c7; } }
      &.btn-outline { background: transparent; border: 1px solid #334155; color: #cbd5e1; &:hover { background: #1e293b; color: #ffffff; } }
    }

    /* Print Styles */
    .print-only { display: none; }

    @media print {
      body { background: white !important; color: black !important; }
      .confirmacion-page { background: white; padding: 0; min-height: auto; }
      .no-print { display: none !important; }
      .print-only { display: block !important; width: 100%; max-width: 650px; margin: 0 auto; padding: 20px; font-family: sans-serif; color: #111; }

      .ticket-header { display: flex; justify-content: space-between; align-items: flex-start; }
      .ticket-brand h2 { margin: 0; font-size: 22px; color: #000; }
      .ticket-brand p { margin: 4px 0 0; font-size: 11px; color: #666; font-weight: bold; }
      .ticket-badge-box { text-align: right; }
      .ticket-code { display: block; font-size: 16px; font-weight: bold; font-family: monospace; }
      .ticket-date { font-size: 11px; color: #666; }

      .ticket-divider { border-bottom: 1px dashed #999; margin: 15px 0; }

      .ticket-grid { display: flex; justify-content: space-between; }
      .t-col { display: flex; flex-direction: column; gap: 4px; font-size: 12px; }
      .t-lbl { font-size: 10px; font-weight: bold; color: #666; }

      .ticket-payment { display: flex; flex-direction: column; gap: 6px; font-size: 12px; }
      .tp-row { display: flex; justify-content: space-between; }
      .total-row { font-size: 16px; font-weight: bold; border-top: 1px solid #000; padding-top: 6px; margin-top: 4px; }

      .ticket-footer { display: flex; align-items: center; gap: 20px; margin-top: 20px; padding-top: 15px; border-top: 1px dashed #999; }
      .qr-placeholder { text-align: center; font-size: 9px; color: #666; }
      .ticket-terms { font-size: 10px; color: #555; line-height: 1.4; p { margin: 2px 0; } }
    }
  `],
})
export class ConfirmacionReservaComponent implements OnInit {
  private route = inject(ActivatedRoute);

  status = signal<'approved' | 'pending' | 'rejected'>('approved');
  externalRef = signal<string>('');
  reservaId = signal<string>('0008');

  hotelNombre = signal<string>('Hotel Pedro');
  huespedNombre = signal<string>('Carlos Mendoza');
  huespedDoc = signal<string>('44556677');
  huespedTel = signal<string>('994042193');
  checkin = signal<string>('28/10/2026');
  checkout = signal<string>('29/10/2026');
  montoTotal = signal<string>('150.00');

  fechaEmision = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });

  codigoReserva(): string {
    return this.externalRef() || ('RES-' + this.reservaId());
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const s = params.get('status') || params.get('collection_status');
    if (s === 'approved' || s === 'success') {
      this.status.set('approved');
    } else if (s === 'pending' || s === 'in_process') {
      this.status.set('pending');
    } else if (s === 'rejected' || s === 'failure') {
      this.status.set('rejected');
    }

    if (params.get('external_ref')) this.externalRef.set(params.get('external_ref')!);
    if (params.get('reserva_id')) this.reservaId.set(params.get('reserva_id')!);
    if (params.get('hotel')) this.hotelNombre.set(params.get('hotel')!);
    if (params.get('huesped')) this.huespedNombre.set(params.get('huesped')!);
    if (params.get('doc')) this.huespedDoc.set(params.get('doc')!);
    if (params.get('tel')) this.huespedTel.set(params.get('tel')!);
    if (params.get('total')) this.montoTotal.set(params.get('total')!);
  }

  enviarWhatsApp(): void {
    const tel = this.huespedTel().replace(/\D/g, '') || '51994042193';
    const codigo = this.codigoReserva();
    const hotel = this.hotelNombre();
    const nombre = this.huespedNombre();
    const fecha = this.checkin();
    const voucherUrl = window.location.href;
    const mapsUrl = `https://maps.google.com/?q=${encodeURIComponent(hotel)}`;

    const mensaje = `¡Hola ${nombre}! Tu reserva ${codigo} en ${hotel} ha sido confirmada para el ${fecha}. Ver voucher: ${voucherUrl} | Ubicación en Google Maps: ${mapsUrl}`;

    const waUrl = `https://api.whatsapp.com/send?phone=${tel.startsWith('51') ? tel : ('51' + tel)}&text=${encodeURIComponent(mensaje)}`;
    window.open(waUrl, '_blank');
  }

  imprimirComprobante(): void {
    window.print();
  }
}
