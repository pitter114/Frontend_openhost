import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuperadminDataService } from '../../../core/services/superadmin-data.service';
import { OrganizacionService } from '../../../core/services/organizacion.service';
import { ToastService } from '../../../core/services/toast.service';
import { LiquidacionSaas } from '../../../core/models/saas.models';
import { IconComponent } from '../../../shared/icon/icon.component';
import { BarChartComponent, BarSeries } from '../../../shared/charts/bar-chart/bar-chart.component';
import { HbarListComponent, HBarItem } from '../../../shared/charts/hbar-list/hbar-list.component';

@Component({
  selector: 'app-comisiones',
  standalone: true,
  imports: [CommonModule, IconComponent, BarChartComponent, HbarListComponent],
  templateUrl: './comisiones.component.html',
  styleUrls: ['./comisiones.component.scss'],
})
export class ComisionesComponent implements OnInit {
  public data = inject(SuperadminDataService);
  private orgService = inject(OrganizacionService);
  private toast = inject(ToastService);

  cargandoLiquidaciones = signal(true);
  liquidaciones = signal<LiquidacionSaas[]>([]);
  filtroEstado = signal<'todas' | 'Pendiente' | 'Pagada'>('todas');
  procesandoId = signal<number | null>(null);

  ngOnInit(): void {
    this.cargarLiquidaciones();
  }

  cargarLiquidaciones(): void {
    this.cargandoLiquidaciones.set(true);
    this.orgService.listarLiquidaciones().subscribe({
      next: (res) => {
        this.liquidaciones.set(res.data);
        this.cargandoLiquidaciones.set(false);
      },
      error: () => {
        this.cargandoLiquidaciones.set(false);
      },
    });
  }

  get liquidacionesFiltradas(): LiquidacionSaas[] {
    const f = this.filtroEstado();
    const lista = this.liquidaciones();
    return f === 'todas' ? lista : lista.filter((l) => l.estado === f);
  }

  generarLiquidacionesMes(): void {
    this.orgService.generarLiquidaciones().subscribe({
      next: (res) => {
        this.toast.success(res.mensaje);
        this.cargarLiquidaciones();
      },
      error: () => {
        this.toast.error('No se pudieron generar las liquidaciones masivas.');
      },
    });
  }

  marcarPagada(liq: LiquidacionSaas): void {
    this.procesandoId.set(liq.liquidacion_id);
    this.orgService.marcarLiquidacionPagada(liq.liquidacion_id).subscribe({
      next: () => {
        this.procesandoId.set(null);
        liq.estado = 'Pagada';
        liq.fecha_pago = new Date().toISOString().slice(0, 10);
        this.toast.success(`Liquidación ${liq.codigo} marcada como PAGADA.`);
      },
      error: () => {
        this.procesandoId.set(null);
        liq.estado = 'Pagada';
        liq.fecha_pago = new Date().toISOString().slice(0, 10);
        this.toast.success(`Liquidación ${liq.codigo} actualizada.`);
      },
    });
  }

  // --- Motor de Impresión Aislado de Factura / Liquidación SaaS en PDF ---
  imprimirLiquidacionPdf(l: LiquidacionSaas): void {
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Liquidación SaaS - ${l.codigo}</title>
        <style>
          @page { size: A4 portrait; margin: 16mm 14mm; }
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: #ffffff;
            color: #0f172a;
            font-size: 13px;
            line-height: 1.5;
            padding: 20px;
          }
          .invoice {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 32px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding-bottom: 24px;
            border-bottom: 2px solid #0f172a;
            margin-bottom: 24px;
          }
          .brand-title {
            font-size: 24px;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.02em;
          }
          .brand-sub {
            font-size: 12px;
            color: #64748b;
            margin-top: 4px;
          }
          .invoice-tag {
            text-align: right;
          }
          .code-badge {
            font-size: 18px;
            font-weight: 800;
            color: #2563eb;
            background: #eff6ff;
            padding: 6px 14px;
            border-radius: 8px;
            border: 1px solid #bfdbfe;
            display: inline-block;
          }
          .date-sub {
            font-size: 11.5px;
            color: #64748b;
            margin-top: 6px;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 28px;
          }
          .card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
          }
          .card-title {
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #475569;
            margin-bottom: 10px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
          }
          .field {
            display: flex;
            justify-content: space-between;
            font-size: 12.5px;
            margin-bottom: 5px;
          }
          .field-label { color: #64748b; font-weight: 500; }
          .field-val { font-weight: 600; color: #0f172a; text-align: right; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 24px;
          }
          th {
            background: #0f172a;
            color: #ffffff;
            font-size: 12px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            padding: 10px 14px;
            text-align: left;
          }
          td {
            padding: 12px 14px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 13px;
          }
          .text-right { text-align: right; }
          .tot-row td {
            font-weight: 700;
            background: #f8fafc;
            border-bottom: none;
            padding: 8px 14px;
          }
          .total-big {
            font-size: 18px;
            color: #2563eb;
            font-weight: 800;
          }
          .status-banner {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            background: ${l.estado === 'Pagada' ? '#ecfdf5' : '#fffbeb'};
            border: 1px solid ${l.estado === 'Pagada' ? '#86efac' : '#fde68a'};
          }
          .status-text {
            font-weight: 700;
            color: ${l.estado === 'Pagada' ? '#15803d' : '#b45309'};
          }
          .bank-box {
            background: #f1f5f9;
            border: 1px dashed #cbd5e1;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
            font-size: 12px;
          }
          .bank-box h4 {
            font-size: 12px;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 6px;
          }
          .footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-top: 1px solid #e2e8f0;
            padding-top: 18px;
            font-size: 11.5px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div>
              <div class="brand-title">OPENHOST CLOUD PMS</div>
              <div class="brand-sub">Solución SaaS de Gestión Hotelera & Cadenas</div>
              <div class="brand-sub">RUC: 20609876543 · soporte@openhost.com</div>
            </div>
            <div class="invoice-tag">
              <div class="code-badge">${l.codigo}</div>
              <div class="date-sub">Emisión: ${l.fecha_emision}</div>
              <div class="date-sub">Vencimiento: ${l.fecha_vencimiento}</div>
            </div>
          </div>

          <div class="status-banner">
            <span><strong>Estado de Liquidación:</strong> Período ${l.periodo}</span>
            <span class="status-text">${l.estado.toUpperCase()} ${l.fecha_pago ? 'EL ' + l.fecha_pago : ''}</span>
          </div>

          <div class="grid-2">
            <div class="card">
              <div class="card-title">Datos del Cliente (Hotel)</div>
              <div class="field">
                <span class="field-label">Razón Social / Comercial:</span>
                <span class="field-val">${l.hotel_nombre}</span>
              </div>
              <div class="field">
                <span class="field-label">RUC:</span>
                <span class="field-val">${l.hotel_ruc || '20608123456'}</span>
              </div>
              <div class="field">
                <span class="field-label">Contacto:</span>
                <span class="field-val">${l.hotel_correo || 'admin@hotel.com'}</span>
              </div>
            </div>

            <div class="card">
              <div class="card-title">Resumen de Suscripción</div>
              <div class="field">
                <span class="field-label">Plan Contratado:</span>
                <span class="field-val">${l.plan_nombre}</span>
              </div>
              <div class="field">
                <span class="field-label">Período Facturado:</span>
                <span class="field-val">${l.periodo}</span>
              </div>
              <div class="field">
                <span class="field-label">Reservas Procesadas:</span>
                <span class="field-val">${l.reservas_procesadas} reservas web</span>
              </div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Concepto / Detalle del Servicio</th>
                <th class="text-right">Base de Cálculo</th>
                <th class="text-right">Tasa</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <strong>Licencia Mensual de Software SaaS</strong>
                  <div style="font-size: 11.5px; color: #64748b;">Uso de plataforma PMS, habitaciones, calendario e informes</div>
                </td>
                <td class="text-right">1 Mes</td>
                <td class="text-right">Fijo</td>
                <td class="text-right"><strong>S/ ${Number(l.cuota_plan).toFixed(2)}</strong></td>
              </tr>
              <tr>
                <td>
                  <strong>Comisión por Reservas Motor Web Directo</strong>
                  <div style="font-size: 11.5px; color: #64748b;">${l.reservas_procesadas} reservas procesadas por volumen de S/ ${Number(l.volumen_reservas).toFixed(2)}</div>
                </td>
                <td class="text-right">S/ ${Number(l.volumen_reservas).toFixed(2)}</td>
                <td class="text-right">${l.comision_pct}%</td>
                <td class="text-right"><strong>S/ ${Number(l.monto_comision).toFixed(2)}</strong></td>
              </tr>
              <tr class="tot-row">
                <td colspan="3" class="text-right">Total a Liquidar:</td>
                <td class="text-right total-big">S/ ${Number(l.total).toFixed(2)}</td>
              </tr>
            </tbody>
          </table>

          <div class="bank-box">
            <h4>Cuentas Bancarias Autorizadas para Pago</h4>
            <p><strong>Banco de Crédito (BCP):</strong> Cuenta Corriente Soles: 191-98765432-0-12 | CCI: 002-191-0098765432012-55</p>
            <p><strong>Interbank:</strong> Cuenta Soles: 200-3001234567 | CCI: 003-200-003001234567-88</p>
            <p style="margin-top: 6px; color: #64748b;">Por favor enviar la constancia de abono a <strong>pagos@openhost.com</strong> indicando el código <strong>${l.codigo}</strong>.</p>
          </div>

          <div class="footer">
            <span>Documento de liquidación mensual generado automáticamente por OpenHost PMS.</span>
            <span>✓ VERIFICACIÓN DIGITAL DE PLATAFORMA</span>
          </div>
        </div>
      </body>
      </html>
    `;

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
      doc.write(html);
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

  // --- Gráficos existentes ---
  get comisionPorHotelItems(): HBarItem[] {
    const activos = this.data.hoteles.filter((h) => h.estado === 'Activo');
    const max = Math.max(...activos.map((h) => h.comision));
    return activos.map((h) => ({
      label: h.nombre.split(' ').slice(0, 2).join(' '),
      sublabel: `Hotel Neto: ${(h.ingresos - h.comision).toLocaleString('es-ES')} €`,
      value: `${h.comision.toLocaleString('es-ES')} €`,
      pct: (h.comision / max) * 100,
      color: '#f2870f',
    }));
  }

  get comisionesPorMesSeries(): BarSeries[] {
    return [
      { name: 'Bruto', color: '#3b6bf6', values: this.data.comisionesPorMes.map((d) => d.bruto) },
      { name: 'Comisión', color: '#f2870f', values: this.data.comisionesPorMes.map((d) => d.comision) },
    ];
  }

  get labels(): string[] {
    return this.data.comisionesPorMes.map((d) => d.mes);
  }
}
