import * as XLSX from 'xlsx';

export interface ReporteTablaConfig {
  titulo: string;
  subtitulo?: string;
  columnas: { clave: string; titulo: string }[];
  filas: Record<string, any>[];
  hotelNombre: string;
}

export class ReporteExportHelper {
  static exportarPDF(config: ReporteTablaConfig): void {
    const fechaHora = new Date().toLocaleString('es-PE', { dateStyle: 'long', timeStyle: 'short' });

    const headersHtml = config.columnas
      .map((col) => `<th style="border: 1px solid #cbd5e1; background: #f8fafc; padding: 8px 12px; text-align: left; font-size: 12px; font-weight: 600; color: #1e293b;">${col.titulo}</th>`)
      .join('');

    const rowsHtml = config.filas
      .map((fila, idx) => {
        const bg = idx % 2 === 0 ? '#ffffff' : '#f8fafc';
        const cells = config.columnas
          .map((col) => {
            const val = fila[col.clave] ?? '-';
            return `<td style="border: 1px solid #e2e8f0; padding: 8px 12px; font-size: 12px; color: #334155;">${val}</td>`;
          })
          .join('');
        return `<tr style="background: ${bg};">${cells}</tr>`;
      })
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>${config.titulo} - ${config.hotelNombre}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px; }
          .hotel-name { font-size: 22px; font-weight: 700; color: #1e3a8a; }
          .report-title { font-size: 18px; font-weight: 600; color: #0f172a; margin-top: 4px; }
          .meta-info { font-size: 11px; color: #64748b; text-align: right; }
          .sub { font-size: 12px; color: #475569; margin-bottom: 15px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          .footer { margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 10px; font-size: 11px; color: #94a3b8; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="hotel-name">🏨 ${config.hotelNombre}</div>
            <div class="report-title">${config.titulo}</div>
          </div>
          <div class="meta-info">
            <div><strong>Emisión:</strong> ${fechaHora}</div>
            <div><strong>Sistema:</strong> HotelPMS</div>
          </div>
        </div>

        ${config.subtitulo ? `<div class="sub">${config.subtitulo}</div>` : ''}

        <table>
          <thead>
            <tr>${headersHtml}</tr>
          </thead>
          <tbody>
            ${rowsHtml.length > 0 ? rowsHtml : '<tr><td colspan="100%" style="text-align: center; padding: 20px; color: #94a3b8;">Sin datos registrados.</td></tr>'}
          </tbody>
        </table>

        <div class="footer">
          <span>Reporte generado automáticamente — ${config.hotelNombre}</span>
          <span>Página 1</span>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
    }
  }

  static exportarExcel(config: ReporteTablaConfig, nombreArchivo: string): void {
    const wb = XLSX.utils.book_new();
    const sheetName = config.titulo.slice(0, 30).replace(/[:\\\/\?\*\[\]]/g, ' ') || 'Reporte';
    const ws = this.crearHoja(config);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  static exportarLibroCompletoExcel(configs: ReporteTablaConfig[], nombreArchivo: string): void {
    const wb = XLSX.utils.book_new();
    const nombresUsados = new Set<string>();

    configs.forEach((config, idx) => {
      let baseName = config.titulo.slice(0, 26).replace(/[:\\\/\?\*\[\]]/g, ' ').trim() || `Hoja${idx + 1}`;
      let sheetName = baseName;
      let counter = 1;
      while (nombresUsados.has(sheetName)) {
        sheetName = `${baseName.slice(0, 24)} (${counter++})`;
      }
      nombresUsados.add(sheetName);

      const ws = this.crearHoja(config);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });

    XLSX.writeFile(wb, `${nombreArchivo}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  private static crearHoja(config: ReporteTablaConfig): XLSX.WorkSheet {
    const fechaHora = new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' });

    const headerRows: any[][] = [
      [`🏨 HOTEL: ${config.hotelNombre}`],
      [`📊 REPORTE: ${config.titulo}`],
      [config.subtitulo ? `ℹ️ DETALLE: ${config.subtitulo}` : `📅 EMISIÓN: ${fechaHora}`],
      [`📅 FECHA DE DESCARGA: ${fechaHora}`],
      [],
      config.columnas.map((c) => c.titulo),
    ];

    const dataRows = config.filas.map((fila) => {
      return config.columnas.map((col) => fila[col.clave] ?? '');
    });

    const fullSheetData = [...headerRows, ...dataRows];
    const ws = XLSX.utils.aoa_to_sheet(fullSheetData);

    const colWidths = config.columnas.map((col) => {
      let maxLen = col.titulo.length;
      config.filas.forEach((fila) => {
        const val = fila[col.clave] != null ? String(fila[col.clave]) : '';
        if (val.length > maxLen) {
          maxLen = val.length;
        }
      });
      return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
    });
    ws['!cols'] = colWidths;

    return ws;
  }
}
