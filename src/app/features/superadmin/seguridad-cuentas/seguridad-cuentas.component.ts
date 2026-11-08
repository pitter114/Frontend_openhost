import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  SeguridadSuperadminService,
  CuentaSeguridad,
  HotelIpSeguridad,
  LogSeguridad,
} from '../../../core/services/seguridad-superadmin.service';
import { IconComponent } from '../../../shared/icon/icon.component';

@Component({
  selector: 'app-seguridad-cuentas',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './seguridad-cuentas.component.html',
  styleUrls: ['./seguridad-cuentas.component.scss'],
})
export class SeguridadCuentasComponent implements OnInit {
  private seguridadService = inject(SeguridadSuperadminService);

  pestanaActiva = signal<'cuentas' | 'ips' | 'auditoria'>('cuentas');
  cargando = signal(false);
  mensajeFeedback = signal<string | null>(null);

  // --- Cuentas ---
  cuentas = signal<CuentaSeguridad[]>([]);
  busqueda = signal('');
  filtroRol = signal('todos');
  filtroEstado = signal('todos');

  // --- Modales de Acción ---
  cuentaSeleccionada = signal<CuentaSeguridad | null>(null);

  // Modal Reset Password
  mostrarModalReset = signal(false);
  modoReset = signal<'temporal' | 'manual'>('temporal');
  nuevaClaveManual = signal('');
  procesandoReset = signal(false);
  resultadoClave = signal<string | null>(null);

  // Modal Emergencia Robo
  mostrarModalRobo = signal(false);
  suspenderEnRobo = signal(false);
  procesandoRobo = signal(false);
  resultadoRobo = signal<{ clave: string; mensaje: string } | null>(null);

  // --- Pestaña IPs ---
  hotelesIp = signal<HotelIpSeguridad[]>([]);
  tuIpActual = signal('127.0.0.1');
  guardandoIpId = signal<number | null>(null);

  // --- Pestaña Auditoría ---
  logs = signal<LogSeguridad[]>([]);

  ngOnInit(): void {
    this.cargarCuentas();
    this.cargarHotelesIp();
    this.cargarAuditoria();
  }

  cargarCuentas(): void {
    this.cargando.set(true);
    this.seguridadService.listarCuentas().subscribe({
      next: (res) => {
        this.cuentas.set(res.data || []);
        this.cargando.set(false);
      },
      error: () => this.cargando.set(false),
    });
  }

  cargarHotelesIp(): void {
    this.seguridadService.listarHotelesIp().subscribe({
      next: (res) => {
        this.hotelesIp.set(res.data || []);
        if (res.tu_ip_actual) this.tuIpActual.set(res.tu_ip_actual);
      },
      error: () => {},
    });
  }

  cargarAuditoria(): void {
    this.seguridadService.listarAuditoria().subscribe({
      next: (res) => {
        this.logs.set(res.data || []);
      },
      error: () => {},
    });
  }

  cuentasFiltradas = computed(() => {
    let list = this.cuentas();
    const q = this.busqueda().toLowerCase().trim();
    const r = this.filtroRol();
    const e = this.filtroEstado();

    if (q) {
      list = list.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.correo.toLowerCase().includes(q) ||
          c.hotel.toLowerCase().includes(q) ||
          c.documento.toLowerCase().includes(q)
      );
    }

    if (r !== 'todos') {
      list = list.filter((c) => c.rol_slug === r);
    }

    if (e !== 'todos') {
      list = list.filter((c) => c.estado === e);
    }

    return list;
  });

  // Paginación Cuentas
  paginaActualCuentas = signal(1);
  itemsPorPaginaCuentas = 8;
  totalPaginasCuentas = computed(() => Math.max(1, Math.ceil(this.cuentasFiltradas().length / this.itemsPorPaginaCuentas)));
  cuentasPaginadas = computed(() => {
    const start = (this.paginaActualCuentas() - 1) * this.itemsPorPaginaCuentas;
    return this.cuentasFiltradas().slice(start, start + this.itemsPorPaginaCuentas);
  });
  cambiarPaginaCuentas(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginasCuentas()) {
      this.paginaActualCuentas.set(nuevaPagina);
    }
  }

  // Paginación Logs Forenses
  paginaActualLogs = signal(1);
  itemsPorPaginaLogs = 6;
  totalPaginasLogs = computed(() => Math.max(1, Math.ceil(this.logs().length / this.itemsPorPaginaLogs)));
  logsPaginados = computed(() => {
    const start = (this.paginaActualLogs() - 1) * this.itemsPorPaginaLogs;
    return this.logs().slice(start, start + this.itemsPorPaginaLogs);
  });
  cambiarPaginaLogs(nuevaPagina: number): void {
    if (nuevaPagina >= 1 && nuevaPagina <= this.totalPaginasLogs()) {
      this.paginaActualLogs.set(nuevaPagina);
    }
  }

  min(a: number, b: number): number {
    return Math.min(a, b);
  }

  // Métricas rápidas de seguridad
  totalCuentas = computed(() => this.cuentas().length);
  cuentasCon2fa = computed(() => this.cuentas().filter((c) => c.dosfa_activo).length);
  cuentasBloqueadas = computed(() => this.cuentas().filter((c) => c.estado === 'suspendido').length);
  totalSesiones = computed(() => this.cuentas().reduce((acc, c) => acc + c.sesiones_activas, 0));

  // --- Acciones de Contraseña ---
  abrirModalReset(c: CuentaSeguridad): void {
    this.cuentaSeleccionada.set(c);
    this.modoReset.set('temporal');
    this.nuevaClaveManual.set('');
    this.resultadoClave.set(null);
    this.mostrarModalReset.set(true);
  }

  cerrarModalReset(): void {
    this.mostrarModalReset.set(false);
    this.cuentaSeleccionada.set(null);
    this.resultadoClave.set(null);
  }

  ejecutarResetPassword(): void {
    const c = this.cuentaSeleccionada();
    if (!c) return;

    if (this.modoReset() === 'manual' && (!this.nuevaClaveManual() || this.nuevaClaveManual().length < 6)) {
      alert('La contraseña manual debe tener al menos 6 caracteres.');
      return;
    }

    this.procesandoReset.set(true);
    this.seguridadService
      .resetPassword(c.usuario_id, {
        modo: this.modoReset(),
        contrasena: this.modoReset() === 'manual' ? this.nuevaClaveManual() : undefined,
      })
      .subscribe({
        next: (res) => {
          this.procesandoReset.set(false);
          this.resultadoClave.set(res.clave);
          this.mostrarNotificacion(res.mensaje);
          this.cargarCuentas();
          this.cargarAuditoria();
        },
        error: (err) => {
          this.procesandoReset.set(false);
          alert(err?.error?.mensaje || 'Error al actualizar contraseña.');
        },
      });
  }

  // --- Acciones de Emergencia Robo ---
  abrirModalRobo(c: CuentaSeguridad): void {
    this.cuentaSeleccionada.set(c);
    this.suspenderEnRobo.set(false);
    this.resultadoRobo.set(null);
    this.mostrarModalRobo.set(true);
  }

  cerrarModalRobo(): void {
    this.mostrarModalRobo.set(false);
    this.cuentaSeleccionada.set(null);
    this.resultadoRobo.set(null);
  }

  ejecutarProtocoloRobo(): void {
    const c = this.cuentaSeleccionada();
    if (!c) return;

    this.procesandoRobo.set(true);
    this.seguridadService.emergenciaRobo(c.usuario_id, this.suspenderEnRobo()).subscribe({
      next: (res) => {
        this.procesandoRobo.set(false);
        this.resultadoRobo.set({
          clave: res.clave_temporal,
          mensaje: res.mensaje,
        });
        this.mostrarNotificacion('Protocolo de robo ejecutado: sesiones expulsadas y 2FA desvinculado.');
        this.cargarCuentas();
        this.cargarAuditoria();
      },
      error: (err) => {
        this.procesandoRobo.set(false);
        alert(err?.error?.mensaje || 'Error al ejecutar el protocolo de emergencia.');
      },
    });
  }

  // --- Acciones Directas ---
  cerrarSesiones(c: CuentaSeguridad): void {
    if (!confirm(`¿Deseas expulsar todos los dispositivos conectados de ${c.correo}?`)) return;

    this.seguridadService.cerrarSesiones(c.usuario_id).subscribe({
      next: (res) => {
        this.mostrarNotificacion(res.mensaje);
        this.cargarCuentas();
        this.cargarAuditoria();
      },
      error: () => alert('Error al revocar sesiones.'),
    });
  }

  toggleBloqueo(c: CuentaSeguridad): void {
    const accion = c.estado === 'activo' ? 'bloquear / suspender' : 'desbloquear y activar';
    if (!confirm(`¿Confirmas que deseas ${accion} la cuenta de ${c.correo}?`)) return;

    this.seguridadService.toggleBloqueo(c.usuario_id).subscribe({
      next: (res) => {
        this.mostrarNotificacion(res.mensaje);
        this.cargarCuentas();
        this.cargarAuditoria();
      },
      error: () => alert('Error al cambiar estado de cuenta.'),
    });
  }

  // --- IP Whitelist Guardar y Capturar ---
  capturarMiIp(h: HotelIpSeguridad): void {
    const actual = this.tuIpActual();
    if (!h.ip_whitelist) {
      h.ip_whitelist = actual;
    } else if (!h.ip_whitelist.includes(actual)) {
      h.ip_whitelist += `, ${actual}`;
    }
  }

  guardarIpConfig(h: HotelIpSeguridad): void {
    this.guardandoIpId.set(h.organizacion_id);
    this.seguridadService
      .guardarHotelIp(h.organizacion_id, {
        ip_whitelist: h.ip_whitelist,
        restringir_ip_operativa: h.restringir_ip_operativa,
      })
      .subscribe({
        next: (res) => {
          this.guardandoIpId.set(null);
          this.mostrarNotificacion(res.mensaje);
          this.cargarAuditoria();
        },
        error: () => {
          this.guardandoIpId.set(null);
          alert('Error al guardar configuración de seguridad IP.');
        },
      });
  }

  mostrarNotificacion(msg: string): void {
    this.mensajeFeedback.set(msg);
    setTimeout(() => this.mensajeFeedback.set(null), 5000);
  }
}
